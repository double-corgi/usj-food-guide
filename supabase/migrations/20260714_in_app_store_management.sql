-- In-app staff store management and product-store relations.
-- Additive only: existing generated/manual data remains readable by v1.0 clients.

create table if not exists public.staff_shops (
  id text primary key,
  name text not null,
  name_en text,
  area_id text,
  area_name text not null,
  shop_type text not null default 'unknown' check (shop_type in ('restaurant','cart','wagon','unknown')),
  description text,
  image_url text,
  public_state text not null default 'draft' check (public_state in ('draft','published')),
  business_status text not null default 'unknown' check (business_status in ('active','paused','ended','unknown')),
  hidden boolean not null default false,
  sort_order integer not null default 1000,
  official_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  created_by uuid,
  updated_by uuid,
  deleted_by uuid,
  version integer not null default 1
);

create table if not exists public.staff_food_store_links (
  id uuid primary key default gen_random_uuid(),
  food_id text not null,
  shop_id text not null,
  is_primary boolean not null default false,
  sale_status text not null default 'unknown' check (sale_status in ('active','paused','ended','unknown')),
  price integer check (price is null or price >= 0),
  start_date date,
  end_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  created_by uuid,
  updated_by uuid,
  deleted_by uuid,
  unique(food_id, shop_id)
);

create index if not exists staff_shops_public_idx on public.staff_shops(public_state, hidden, deleted_at, business_status);
create index if not exists staff_shops_area_idx on public.staff_shops(area_name, sort_order, name);
create index if not exists staff_food_store_links_food_idx on public.staff_food_store_links(food_id) where deleted_at is null;
create index if not exists staff_food_store_links_shop_idx on public.staff_food_store_links(shop_id) where deleted_at is null;

drop trigger if exists staff_shops_set_updated_at on public.staff_shops;
create trigger staff_shops_set_updated_at before update on public.staff_shops
for each row execute function public.set_updated_at();
drop trigger if exists staff_food_store_links_set_updated_at on public.staff_food_store_links;
create trigger staff_food_store_links_set_updated_at before update on public.staff_food_store_links
for each row execute function public.set_updated_at();

drop trigger if exists staff_shops_bump_version on public.staff_shops;
create trigger staff_shops_bump_version before update on public.staff_shops
for each row execute function public.bump_staff_managed_version();

alter table public.staff_shops enable row level security;
alter table public.staff_food_store_links enable row level security;

drop policy if exists "public can read published staff shops" on public.staff_shops;
create policy "public can read published staff shops"
on public.staff_shops for select to anon, authenticated
using (public_state = 'published' and hidden = false and deleted_at is null);

drop policy if exists "staff can read all staff shops" on public.staff_shops;
create policy "staff can read all staff shops"
on public.staff_shops for select to authenticated
using (public.is_staff_member('editor', false));

drop policy if exists "staff aal2 can insert staff shops" on public.staff_shops;
create policy "staff aal2 can insert staff shops"
on public.staff_shops for insert to authenticated
with check (public.is_staff_member('editor', true));

drop policy if exists "staff aal2 can update staff shops" on public.staff_shops;
create policy "staff aal2 can update staff shops"
on public.staff_shops for update to authenticated
using (public.is_staff_member('editor', true))
with check (public.is_staff_member('editor', true));

drop policy if exists "owners aal2 can delete staff shops" on public.staff_shops;
create policy "owners aal2 can delete staff shops"
on public.staff_shops for delete to authenticated
using (public.is_staff_owner(true));

drop policy if exists "public can read active staff food store links" on public.staff_food_store_links;
create policy "public can read active staff food store links"
on public.staff_food_store_links for select to anon, authenticated
using (
  deleted_at is null
  and exists (
    select 1
    from public.staff_shops staff_shop
    where staff_shop.id = staff_food_store_links.shop_id
      and staff_shop.public_state = 'published'
      and staff_shop.hidden = false
      and staff_shop.deleted_at is null
  )
);

drop policy if exists "staff can read all staff food store links" on public.staff_food_store_links;
create policy "staff can read all staff food store links"
on public.staff_food_store_links for select to authenticated
using (public.is_staff_member('editor', false));

drop policy if exists "staff aal2 can insert food store links" on public.staff_food_store_links;
create policy "staff aal2 can insert food store links"
on public.staff_food_store_links for insert to authenticated
with check (public.is_staff_member('editor', true));

drop policy if exists "staff aal2 can update food store links" on public.staff_food_store_links;
create policy "staff aal2 can update food store links"
on public.staff_food_store_links for update to authenticated
using (public.is_staff_member('editor', true))
with check (public.is_staff_member('editor', true));

drop policy if exists "owners aal2 can delete food store links" on public.staff_food_store_links;
create policy "owners aal2 can delete food store links"
on public.staff_food_store_links for delete to authenticated
using (public.is_staff_owner(true));

grant select, insert, update, delete on public.staff_shops to authenticated;
grant select, insert, update, delete on public.staff_food_store_links to authenticated;
grant select on public.staff_shops, public.staff_food_store_links to anon;

drop trigger if exists staff_shops_staff_audit on public.staff_shops;
create trigger staff_shops_staff_audit
after insert or update or delete on public.staff_shops
for each row execute function public.log_staff_managed_change();

drop trigger if exists staff_food_store_links_staff_audit on public.staff_food_store_links;
create trigger staff_food_store_links_staff_audit
after insert or update or delete on public.staff_food_store_links
for each row execute function public.log_staff_managed_change();

-- Additional Storage policy for store images in the existing public food-images bucket.
drop policy if exists "staff aal2 can upload staff shop images" on storage.objects;
create policy "staff aal2 can upload staff shop images"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'food-images'
  and public.is_staff_member('editor', true)
  and (storage.foldername(name))[1] = 'staff-shops'
);

drop policy if exists "staff aal2 can update staff shop images" on storage.objects;
create policy "staff aal2 can update staff shop images"
on storage.objects for update to authenticated
using (
  bucket_id = 'food-images'
  and public.is_staff_member('editor', true)
  and (storage.foldername(name))[1] = 'staff-shops'
)
with check (
  bucket_id = 'food-images'
  and public.is_staff_member('editor', true)
  and (storage.foldername(name))[1] = 'staff-shops'
);

drop policy if exists "staff aal2 can delete staff shop images" on storage.objects;
create policy "staff aal2 can delete staff shop images"
on storage.objects for delete to authenticated
using (
  bucket_id = 'food-images'
  and public.is_staff_member('editor', true)
  and (storage.foldername(name))[1] = 'staff-shops'
);
