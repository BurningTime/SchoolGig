-- ============================================================
-- CampusGig — Milestone 3 schema (reviews, reports, banning, admin reach)
-- Run this once in the Supabase Dashboard -> SQL Editor (after 0001-0003).
-- ============================================================

-- ---------- ban infrastructure ----------
alter table public.profiles
  add column is_banned boolean not null default false;

-- Extends the existing trigger (created in 0002) to guard is_banned the
-- same way it already guards is_verified.
create or replace function public.protect_profile_admin_fields()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    new.is_verified := old.is_verified;
    new.is_banned := old.is_banned;
  end if;
  return new;
end;
$$;

-- The existing "owner can update their own profile" policy only lets a
-- user target their OWN row — an admin needs a separate policy just to
-- reach someone else's row at all before the trigger's column guard even
-- applies.
create policy "admin can update any profile"
  on public.profiles for update
  using (public.is_admin())
  with check (public.is_admin());

create function public.is_banned()
returns boolean
language sql
security definer
set search_path = public
as $$
  select coalesce((select is_banned from public.profiles where id = auth.uid()), false);
$$;

-- ---------- wire the ban check into every existing write path ----------

drop policy "verified users can create their own listings" on public.service_listings;
create policy "verified users can create their own listings"
  on public.service_listings for insert
  with check (
    auth.uid() = user_id
    and not public.is_banned()
    and exists (
      select 1 from public.verifications
      where user_id = auth.uid() and status = 'verified'
    )
  );

create policy "admin can moderate listings"
  on public.service_listings for update
  using (public.is_admin())
  with check (public.is_admin());

drop policy "verified users can post their own jobs" on public.job_posts;
create policy "verified users can post their own jobs"
  on public.job_posts for insert
  with check (
    auth.uid() = user_id
    and not public.is_banned()
    and exists (
      select 1 from public.verifications
      where user_id = auth.uid() and status = 'verified'
    )
  );

create policy "admin can moderate jobs"
  on public.job_posts for update
  using (public.is_admin())
  with check (public.is_admin());

drop policy "verified users can apply to jobs" on public.applications;
create policy "verified users can apply to jobs"
  on public.applications for insert
  with check (
    auth.uid() = applicant_id
    and not public.is_banned()
    and exists (
      select 1 from public.verifications
      where user_id = auth.uid() and status = 'verified'
    )
  );

drop policy "a user can start a conversation they are part of" on public.conversations;
create policy "a user can start a conversation they are part of"
  on public.conversations for insert
  with check (auth.uid() in (participant_a_id, participant_b_id) and not public.is_banned());

drop policy "participants can send messages as themselves" on public.messages;
create policy "participants can send messages as themselves"
  on public.messages for insert
  with check (
    sender_id = auth.uid()
    and not public.is_banned()
    and exists (
      select 1 from public.conversations c
      where c.id = messages.conversation_id
        and auth.uid() in (c.participant_a_id, c.participant_b_id)
    )
  );

-- Admin previously couldn't even see a reported message, let alone remove it.
create policy "admin can read any message"
  on public.messages for select
  using (public.is_admin());

create policy "admin can delete any message"
  on public.messages for delete
  using (public.is_admin());

-- ---------- reviews (the reputation record) ----------
create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  engagement_id uuid not null references public.engagements (id) on delete cascade,
  reviewer_id uuid not null references auth.users (id) on delete cascade,
  reviewee_id uuid not null references auth.users (id) on delete cascade,
  rating smallint not null check (rating between 1 and 5),
  comment text,
  created_at timestamptz not null default now(),
  unique (engagement_id, reviewer_id)
);

alter table public.reviews enable row level security;

create policy "reviews are publicly readable"
  on public.reviews for select
  using (true);

create policy "co-party can review a completed engagement"
  on public.reviews for insert
  with check (
    auth.uid() = reviewer_id
    and not public.is_banned()
    and exists (
      select 1 from public.engagements e
      where e.id = reviews.engagement_id
        and e.status = 'completed'
        and (
          (e.poster_id = auth.uid() and e.worker_id = reviews.reviewee_id)
          or (e.worker_id = auth.uid() and e.poster_id = reviews.reviewee_id)
        )
    )
  );

-- ---------- reports + admin moderation queue ----------
create table public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references auth.users (id) on delete cascade,
  target_type text not null check (target_type in ('user', 'listing', 'job', 'message')),
  target_id uuid not null,
  reason text not null,
  status text not null default 'open' check (status in ('open', 'actioned', 'dismissed')),
  handled_by uuid references auth.users (id),
  created_at timestamptz not null default now()
);

alter table public.reports enable row level security;

create policy "reporter or admin can read reports"
  on public.reports for select
  using (auth.uid() = reporter_id or public.is_admin());

create policy "non-banned users can file reports"
  on public.reports for insert
  with check (auth.uid() = reporter_id and not public.is_banned());

create policy "admin can update reports"
  on public.reports for update
  using (public.is_admin())
  with check (public.is_admin());
