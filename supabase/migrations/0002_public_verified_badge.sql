-- ============================================================
-- Fix: the verified badge must be publicly visible (spec F2), but
-- `verifications` (which holds the sensitive student-ID doc path) is
-- correctly locked to owner+admin only — so anonymous visitors couldn't
-- see anyone's badge at all. Add a public boolean on `profiles`, synced
-- from `verifications.status` by a trigger, instead of loosening
-- `verifications`' RLS.
-- Run this once in the Supabase Dashboard -> SQL Editor (after 0001).
-- ============================================================

alter table public.profiles
  add column is_verified boolean not null default false;

-- Backfill any accounts already approved before this migration.
-- Must run before the protect-trigger below exists (that trigger would
-- otherwise revert this very update — see its comment).
update public.profiles p
set is_verified = true
from public.verifications v
where v.user_id = p.id and v.status = 'verified';

-- Guards is_verified against being set through the normal
-- "owner can update their own profile" policy — only a change made
-- while the *current session* is an admin is allowed through.
-- (The sync trigger below runs its UPDATE with the acting admin's
-- session, so it passes; a user editing their own bio does not touch
-- is_verified, so this is a no-op for them either way.)
create function public.protect_profile_admin_fields()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    new.is_verified := old.is_verified;
  end if;
  return new;
end;
$$;

create trigger protect_profiles_admin_fields
  before update on public.profiles
  for each row execute function public.protect_profile_admin_fields();

-- Keeps profiles.is_verified in sync whenever an admin decides a
-- verification (see the "admin can decide verification" policy —
-- only admins can move status to 'verified'/'rejected').
create function public.sync_verified_badge()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.profiles
  set is_verified = (new.status = 'verified')
  where id = new.user_id;
  return new;
end;
$$;

create trigger on_verification_decided
  after update on public.verifications
  for each row execute function public.sync_verified_badge();
