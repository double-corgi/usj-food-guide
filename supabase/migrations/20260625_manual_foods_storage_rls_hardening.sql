-- Harden manual food data and food image storage access.
-- Apply manually in Supabase SQL Editor.
-- The app writes through server actions with the service role key only.

alter table public.manual_foods enable row level security;

revoke all on table public.manual_foods from anon, authenticated;

drop policy if exists "manual foods deny anon select" on public.manual_foods;
drop policy if exists "manual foods deny anon insert" on public.manual_foods;
drop policy if exists "manual foods deny anon update" on public.manual_foods;
drop policy if exists "manual foods deny anon delete" on public.manual_foods;

create policy "manual foods deny anon select"
on public.manual_foods
for select
to anon, authenticated
using (false);

create policy "manual foods deny anon insert"
on public.manual_foods
for insert
to anon, authenticated
with check (false);

create policy "manual foods deny anon update"
on public.manual_foods
for update
to anon, authenticated
using (false)
with check (false);

create policy "manual foods deny anon delete"
on public.manual_foods
for delete
to anon, authenticated
using (false);

drop policy if exists "food images public read" on storage.objects;
drop policy if exists "food images deny anon insert" on storage.objects;
drop policy if exists "food images deny anon update" on storage.objects;
drop policy if exists "food images deny anon delete" on storage.objects;

create policy "food images public read"
on storage.objects
for select
to anon, authenticated
using (bucket_id = 'food-images');

create policy "food images deny anon insert"
on storage.objects
for insert
to anon, authenticated
with check (bucket_id <> 'food-images');

create policy "food images deny anon update"
on storage.objects
for update
to anon, authenticated
using (bucket_id <> 'food-images')
with check (bucket_id <> 'food-images');

create policy "food images deny anon delete"
on storage.objects
for delete
to anon, authenticated
using (bucket_id <> 'food-images');
