-- In-app staff area and collection management.
-- Additive only: keeps generated data and existing public reads compatible.

create extension if not exists pgcrypto;

create table if not exists public.staff_areas (
  id text primary key,
  name text not null,
  name_en text,
  description text,
  image_url text,
  public_state text not null default 'draft' check (public_state in ('draft','published')),
  hidden boolean not null default false,
  sort_order integer not null default 1000,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  created_by uuid,
  updated_by uuid,
  deleted_by uuid,
  version integer not null default 1
);

alter table public.collections
  add column if not exists name_en text,
  add column if not exists description text,
  add column if not exists image_url text,
  add column if not exists public_state text not null default 'published' check (public_state in ('draft','published')),
  add column if not exists hidden boolean not null default false,
  add column if not exists deleted_at timestamptz,
  add column if not exists created_by uuid references auth.users(id),
  add column if not exists updated_by uuid references auth.users(id),
  add column if not exists deleted_by uuid references auth.users(id),
  add column if not exists version integer not null default 1;

create index if not exists staff_areas_public_idx on public.staff_areas(public_state, hidden, deleted_at, sort_order);
create index if not exists staff_areas_name_idx on public.staff_areas(name);
create index if not exists collections_public_staff_idx on public.collections(public_state, hidden, deleted_at, sort_order);

drop trigger if exists staff_areas_set_updated_at on public.staff_areas;
create trigger staff_areas_set_updated_at before update on public.staff_areas
for each row execute function public.set_updated_at();

drop trigger if exists staff_areas_bump_version on public.staff_areas;
create trigger staff_areas_bump_version before update on public.staff_areas
for each row execute function public.bump_staff_managed_version();

drop trigger if exists collections_set_updated_at on public.collections;
create trigger collections_set_updated_at before update on public.collections
for each row execute function public.set_updated_at();

drop trigger if exists collections_bump_version on public.collections;
create trigger collections_bump_version before update on public.collections
for each row execute function public.bump_staff_managed_version();

alter table public.staff_areas enable row level security;
alter table public.collections enable row level security;

drop policy if exists "public can read published staff areas" on public.staff_areas;
create policy "public can read published staff areas"
on public.staff_areas for select to anon, authenticated
using (public_state = 'published' and hidden = false and deleted_at is null);

drop policy if exists "staff can read all staff areas" on public.staff_areas;
create policy "staff can read all staff areas"
on public.staff_areas for select to authenticated
using (public.is_staff_member('editor', false));

drop policy if exists "staff aal2 can insert staff areas" on public.staff_areas;
create policy "staff aal2 can insert staff areas"
on public.staff_areas for insert to authenticated
with check (public.is_staff_member('editor', true));

drop policy if exists "staff aal2 can update staff areas" on public.staff_areas;
create policy "staff aal2 can update staff areas"
on public.staff_areas for update to authenticated
using (public.is_staff_member('editor', true))
with check (public.is_staff_member('editor', true));

drop policy if exists "owners aal2 can delete staff areas" on public.staff_areas;
create policy "owners aal2 can delete staff areas"
on public.staff_areas for delete to authenticated
using (public.is_staff_owner(true));

drop policy if exists "Public can read collections" on public.collections;
drop policy if exists "public can read visible collections" on public.collections;
create policy "public can read visible collections" on public.collections
  for select to anon, authenticated
  using (public_state = 'published' and hidden = false and deleted_at is null);

drop policy if exists "staff can read all collections" on public.collections;
create policy "staff can read all collections" on public.collections
  for select to authenticated
  using (public.is_staff_member('editor', false));

drop policy if exists "staff aal2 can modify collections" on public.collections;
drop policy if exists "staff aal2 can insert collections" on public.collections;
create policy "staff aal2 can insert collections"
on public.collections for insert to authenticated
with check (public.is_staff_member('editor', true));

drop policy if exists "staff aal2 can update collections" on public.collections;
create policy "staff aal2 can update collections"
on public.collections for update to authenticated
using (public.is_staff_member('editor', true))
with check (public.is_staff_member('editor', true));

drop policy if exists "owners aal2 can delete collections" on public.collections;
create policy "owners aal2 can delete collections"
on public.collections for delete to authenticated
using (public.is_staff_owner(true));

grant select, insert, update, delete on public.staff_areas to authenticated;
grant select on public.staff_areas to anon;
grant select, insert, update, delete on public.collections to authenticated;
grant select on public.collections to anon;

drop trigger if exists staff_areas_staff_audit on public.staff_areas;
create trigger staff_areas_staff_audit
after insert or update or delete on public.staff_areas
for each row execute function public.log_staff_managed_change();

drop trigger if exists collections_staff_audit on public.collections;
create trigger collections_staff_audit
after insert or update or delete on public.collections
for each row execute function public.log_staff_managed_change();

-- Storage policies for area and collection image folders inside the existing food-images bucket.
drop policy if exists "staff aal2 can upload staff area images" on storage.objects;
create policy "staff aal2 can upload staff area images"
on storage.objects for insert to authenticated
with check (bucket_id = 'food-images' and public.is_staff_member('editor', true) and (storage.foldername(name))[1] = 'staff-areas');

drop policy if exists "staff aal2 can update staff area images" on storage.objects;
create policy "staff aal2 can update staff area images"
on storage.objects for update to authenticated
using (bucket_id = 'food-images' and public.is_staff_member('editor', true) and (storage.foldername(name))[1] = 'staff-areas')
with check (bucket_id = 'food-images' and public.is_staff_member('editor', true) and (storage.foldername(name))[1] = 'staff-areas');

drop policy if exists "staff aal2 can delete staff area images" on storage.objects;
create policy "staff aal2 can delete staff area images"
on storage.objects for delete to authenticated
using (bucket_id = 'food-images' and public.is_staff_member('editor', true) and (storage.foldername(name))[1] = 'staff-areas');

drop policy if exists "staff aal2 can upload collection images" on storage.objects;
create policy "staff aal2 can upload collection images"
on storage.objects for insert to authenticated
with check (bucket_id = 'food-images' and public.is_staff_member('editor', true) and (storage.foldername(name))[1] = 'collections');

drop policy if exists "staff aal2 can update collection images" on storage.objects;
create policy "staff aal2 can update collection images"
on storage.objects for update to authenticated
using (bucket_id = 'food-images' and public.is_staff_member('editor', true) and (storage.foldername(name))[1] = 'collections')
with check (bucket_id = 'food-images' and public.is_staff_member('editor', true) and (storage.foldername(name))[1] = 'collections');

drop policy if exists "staff aal2 can delete collection images" on storage.objects;
create policy "staff aal2 can delete collection images"
on storage.objects for delete to authenticated
using (bucket_id = 'food-images' and public.is_staff_member('editor', true) and (storage.foldername(name))[1] = 'collections');
