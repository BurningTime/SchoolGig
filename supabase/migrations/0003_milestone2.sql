-- ============================================================
-- CampusGig — Milestone 2 schema (job posts, applications, messaging, engagements)
-- Run this once in the Supabase Dashboard -> SQL Editor (after 0001, 0002).
-- ============================================================

-- ---------- job_posts (the demand side) ----------
create table public.job_posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  category_id int not null references public.categories (id),
  title text not null,
  description text not null,
  budget numeric(10, 2),
  date_needed date,
  area text not null,
  status text not null default 'open' check (status in ('open', 'closed', 'filled')),
  created_at timestamptz not null default now()
);

alter table public.job_posts enable row level security;

create policy "open jobs are publicly readable"
  on public.job_posts for select
  using (status = 'open' or auth.uid() = user_id or public.is_admin());

create policy "verified users can post their own jobs"
  on public.job_posts for insert
  with check (
    auth.uid() = user_id
    and exists (
      select 1 from public.verifications
      where user_id = auth.uid() and status = 'verified'
    )
  );

create policy "poster can update their own job"
  on public.job_posts for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ---------- applications ----------
create table public.applications (
  id uuid primary key default gen_random_uuid(),
  job_post_id uuid not null references public.job_posts (id) on delete cascade,
  applicant_id uuid not null references auth.users (id) on delete cascade,
  message text not null,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'declined')),
  created_at timestamptz not null default now(),
  unique (job_post_id, applicant_id)
);

alter table public.applications enable row level security;

create policy "applicant or poster can read applications"
  on public.applications for select
  using (
    auth.uid() = applicant_id
    or exists (
      select 1 from public.job_posts
      where job_posts.id = applications.job_post_id and job_posts.user_id = auth.uid()
    )
    or public.is_admin()
  );

create policy "verified users can apply to jobs"
  on public.applications for insert
  with check (
    auth.uid() = applicant_id
    and exists (
      select 1 from public.verifications
      where user_id = auth.uid() and status = 'verified'
    )
  );

create policy "poster can decide on applications to their own jobs"
  on public.applications for update
  using (
    exists (
      select 1 from public.job_posts
      where job_posts.id = applications.job_post_id and job_posts.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.job_posts
      where job_posts.id = applications.job_post_id and job_posts.user_id = auth.uid()
    )
  );

-- ---------- conversations ----------
create table public.conversations (
  id uuid primary key default gen_random_uuid(),
  participant_a_id uuid not null references auth.users (id) on delete cascade,
  participant_b_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  check (participant_a_id < participant_b_id),
  unique (participant_a_id, participant_b_id)
);

alter table public.conversations enable row level security;

create policy "participants can read their own conversation"
  on public.conversations for select
  using (auth.uid() in (participant_a_id, participant_b_id));

create policy "a user can start a conversation they are part of"
  on public.conversations for insert
  with check (auth.uid() in (participant_a_id, participant_b_id));

-- ---------- messages ----------
create table public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations (id) on delete cascade,
  sender_id uuid not null references auth.users (id) on delete cascade,
  body text not null,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.messages enable row level security;

create policy "participants can read messages in their conversation"
  on public.messages for select
  using (
    exists (
      select 1 from public.conversations c
      where c.id = messages.conversation_id
        and auth.uid() in (c.participant_a_id, c.participant_b_id)
    )
  );

create policy "participants can send messages as themselves"
  on public.messages for insert
  with check (
    sender_id = auth.uid()
    and exists (
      select 1 from public.conversations c
      where c.id = messages.conversation_id
        and auth.uid() in (c.participant_a_id, c.participant_b_id)
    )
  );

-- Deliberately no UPDATE policy on messages: a generic "recipient can
-- update" policy would let them rewrite body/sender_id too, since RLS is
-- row-level, not column-level. Marking as read only happens through this
-- function instead.
create function public.mark_conversation_read(p_conversation_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (
    select 1 from public.conversations
    where id = p_conversation_id
      and auth.uid() in (participant_a_id, participant_b_id)
  ) then
    return;
  end if;

  update public.messages
  set is_read = true
  where conversation_id = p_conversation_id
    and sender_id <> auth.uid()
    and is_read = false;
end;
$$;

-- ---------- engagements (the trust anchor) ----------
create table public.engagements (
  id uuid primary key default gen_random_uuid(),
  poster_id uuid not null references auth.users (id) on delete cascade,
  worker_id uuid not null references auth.users (id) on delete cascade,
  job_post_id uuid references public.job_posts (id) on delete set null,
  service_listing_id uuid references public.service_listings (id) on delete set null,
  status text not null default 'active' check (status in ('active', 'completed', 'cancelled')),
  created_at timestamptz not null default now()
);

alter table public.engagements enable row level security;

create policy "poster or worker can read their engagement"
  on public.engagements for select
  using (auth.uid() in (poster_id, worker_id) or public.is_admin());

create policy "poster can create an engagement from a hire"
  on public.engagements for insert
  with check (
    auth.uid() = poster_id
    and (
      (
        job_post_id is not null
        and exists (
          select 1 from public.applications ap
          join public.job_posts jp on jp.id = ap.job_post_id
          where ap.job_post_id = engagements.job_post_id
            and ap.applicant_id = engagements.worker_id
            and ap.status = 'accepted'
            and jp.user_id = auth.uid()
        )
      )
      or exists (
        select 1 from public.conversations c
        where auth.uid() in (c.participant_a_id, c.participant_b_id)
          and engagements.worker_id in (c.participant_a_id, c.participant_b_id)
          and engagements.worker_id <> auth.uid()
      )
    )
  );

create policy "either party can update engagement status"
  on public.engagements for update
  using (auth.uid() in (poster_id, worker_id))
  with check (auth.uid() in (poster_id, worker_id));
