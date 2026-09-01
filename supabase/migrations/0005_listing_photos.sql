-- ============================================================
-- CampusGig — add photos to service listings
-- Run this once in the Supabase Dashboard -> SQL Editor (after 0001-0004).
-- ============================================================

alter table public.service_listings
  add column photo_url text;

insert into storage.buckets (id, name, public)
values ('listing-photos', 'listing-photos', true)
on conflict (id) do nothing;

-- Same owner-scoped pattern as the avatars bucket: public read, owner
-- writes only inside their own {uid}/... folder.
create policy "listing photos are publicly readable"
  on storage.objects for select
  using (bucket_id = 'listing-photos');

create policy "users can upload their own listing photos"
  on storage.objects for insert
  with check (
    bucket_id = 'listing-photos'
    and (storage.foldername(name)) [1] = auth.uid()::text
  );

create policy "users can update their own listing photos"
  on storage.objects for update
  using (
    bucket_id = 'listing-photos'
    and (storage.foldername(name)) [1] = auth.uid()::text
  );
