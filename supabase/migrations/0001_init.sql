-- ============================================================
-- CampusGig — initial schema (Milestone 1)
-- Run this once in the Supabase Dashboard -> SQL Editor.
-- ============================================================

create extension if not exists pgcrypto;

-- ---------- profiles (public-safe fields, self-editable) ----------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  name text not null,
  bio text,
  school text,
  course_year text,
  photo_url text,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "profiles are publicly readable"
  on public.profiles for select
  using (true);

create policy "users can update their own profile"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- ---------- profile_private (email/phone — owner + admin only) ----------
create table public.profile_private (
  user_id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  phone text
);

alter table public.profile_private enable row level security;

-- ---------- verifications (status + ID doc path — owner + admin only) ----------
create table public.verifications (
  user_id uuid primary key references auth.users (id) on delete cascade,
  status text not null default 'unverified'
    check (status in ('unverified', 'pending', 'verified', 'rejected')),
  student_id_doc_path text,
  reviewed_by uuid references auth.users (id),
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.verifications enable row level security;

-- ---------- admins (allowlist — no client access at all) ----------
create table public.admins (
  user_id uuid primary key references auth.users (id) on delete cascade
);

alter table public.admins enable row level security;
-- Deliberately no policies here: not even SELECT is allowed via the client.
-- The only way in is the security-definer function below, or the SQL editor.

-- No-arg on purpose: checks the *current* session only, so it can safely be
-- called via RPC from the client (e.g. to decide whether to show an Admin
-- link) without letting anyone probe whether some other user is an admin.
create function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (select 1 from public.admins where user_id = auth.uid());
$$;

-- Now that is_admin() exists, add the policies that depend on it.

create policy "owner or admin can read private contact info"
  on public.profile_private for select
  using (auth.uid() = user_id or public.is_admin());

create policy "owner can update their own contact info"
  on public.profile_private for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "owner or admin can read verification status"
  on public.verifications for select
  using (auth.uid() = user_id or public.is_admin());

create policy "owner can submit for verification"
  on public.verifications for update
  using (auth.uid() = user_id and status in ('unverified', 'rejected'))
  with check (auth.uid() = user_id and status = 'pending');

create policy "admin can decide verification"
  on public.verifications for update
  using (public.is_admin())
  with check (public.is_admin());

-- ---------- categories (public read, seeded, no client writes) ----------
create table public.categories (
  id serial primary key,
  name text not null,
  slug text not null unique
);

alter table public.categories enable row level security;

create policy "categories are publicly readable"
  on public.categories for select
  using (true);

insert into public.categories (name, slug) values
  ('Tutoring', 'tutoring'),
  ('Thesis / Document Formatting', 'formatting'),
  ('Research Help', 'research-help'),
  ('Graphic Design', 'design'),
  ('Event Staffing', 'event-staffing'),
  ('Reselling', 'reselling');

-- ---------- service_listings (the directory) ----------
create table public.service_listings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  category_id int not null references public.categories (id),
  title text not null,
  description text not null,
  rate numeric(10, 2),
  rate_type text not null check (rate_type in ('hourly', 'fixed', 'negotiable')),
  area text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.service_listings enable row level security;

create policy "active listings are publicly readable"
  on public.service_listings for select
  using (is_active or auth.uid() = user_id or public.is_admin());

create policy "verified users can create their own listings"
  on public.service_listings for insert
  with check (
    auth.uid() = user_id
    and exists (
      select 1 from public.verifications
      where user_id = auth.uid() and status = 'verified'
    )
  );

create policy "owner can update their own listings"
  on public.service_listings for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "owner can delete their own listings"
  on public.service_listings for delete
  using (auth.uid() = user_id);

-- ---------- auto-create profile rows on sign-up ----------
create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, name, school, course_year)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'name', ''),
    new.raw_user_meta_data ->> 'school',
    new.raw_user_meta_data ->> 'course_year'
  );

  insert into public.profile_private (user_id, email, phone)
  values (new.id, new.email, new.raw_user_meta_data ->> 'phone');

  insert into public.verifications (user_id, status)
  values (new.id, 'unverified');

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================
-- Storage buckets
-- ============================================================

insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('student-ids', 'student-ids', false)
on conflict (id) do nothing;

-- avatars: public read, owner writes only inside their own {uid}/... folder
create policy "avatar images are publicly readable"
  on storage.objects for select
  using (bucket_id = 'avatars');

create policy "users can upload their own avatar"
  on storage.objects for insert
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name)) [1] = auth.uid()::text
  );

create policy "users can update their own avatar"
  on storage.objects for update
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name)) [1] = auth.uid()::text
  );

-- student-ids: private, owner + admin read only, owner writes own folder
create policy "owner or admin can read id docs"
  on storage.objects for select
  using (
    bucket_id = 'student-ids'
    and (
      (storage.foldername(name)) [1] = auth.uid()::text
      or public.is_admin()
    )
  );

create policy "users can upload their own id doc"
  on storage.objects for insert
  with check (
    bucket_id = 'student-ids'
    and (storage.foldername(name)) [1] = auth.uid()::text
  );

create policy "users can update their own id doc"
  on storage.objects for update
  using (
    bucket_id = 'student-ids'
    and (storage.foldername(name)) [1] = auth.uid()::text
  );
