-- Current production-aligned schema for UNICOLLE hybrid food storage.
-- The public schema stores admin/auth state, manually added foods, generated-food
-- overrides, and seasonal foundation tables. Generated foods remain in
-- scripts/output/foods.generated.json and are not mirrored into a DB foods table.

create extension if not exists pgcrypto;

create table if not exists public.admin_users (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  role text not null check (role in ('owner', 'editor', 'viewer')),
  created_at timestamptz not null default now()
);

create table if not exists public.admin_auth_pkce_attempts (
  id uuid primary key,
  code_verifier text not null,
  next_path text not null default '/admin/foods',
  created_at timestamptz not null default now(),
  expires_at timestamptz not null,
  used_at timestamptz
);

create table if not exists public.manual_foods (
  id text primary key,
  name text not null,
  normalized_name text not null,
  name_en text,
  category text not null default 'unknown',
  category_tags text[] not null default '{}',
  price integer,
  area_name text not null,
  shop_name text not null,
  sale_status text not null default 'active' check (sale_status in ('active', 'paused', 'ended', 'unknown')),
  public_state text not null default 'published' check (public_state in ('published', 'draft')),
  hidden boolean not null default false,
  start_date date,
  end_date date,
  image_url text,
  source_url text not null,
  admin_notes text,
  created_by text not null,
  updated_by text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table if not exists public.food_overrides (
  food_id text primary key,
  name text,
  name_en text,
  price integer,
  price_min integer,
  price_max integer,
  price_note text,
  area_name text,
  area_id text,
  shop_name text,
  shop_id text,
  category text,
  category_tags text[],
  image_path text,
  image_source_url text,
  info_source_url text,
  sale_status text check (sale_status in ('active', 'paused', 'ended', 'unknown')),
  status text,
  hidden boolean,
  admin_source_type text,
  admin_confidence text,
  admin_notes text,
  is_deleted boolean not null default false,
  created_by text,
  updated_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.food_override_revisions (
  id uuid primary key default gen_random_uuid(),
  food_id text not null,
  version integer not null,
  snapshot jsonb not null,
  action text not null,
  actor_email text,
  created_at timestamptz not null default now()
);

create table if not exists public.collections (
  id text primary key,
  name text not null,
  season_type text not null check (season_type in ('summer', 'halloween', 'christmas', 'easter', 'anniversary', 'event', 'other')),
  starts_on date,
  ends_on date,
  accent_color text,
  is_featured boolean not null default false,
  sort_order integer not null default 100,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into public.collections (id, name, season_type, starts_on, ends_on, accent_color, is_featured, sort_order)
values ('summer-2026', '2026 サマーコレクション', 'summer', null, null, '#38b6c9', true, 100)
on conflict (id) do update set
  name = excluded.name,
  season_type = excluded.season_type,
  starts_on = excluded.starts_on,
  ends_on = excluded.ends_on,
  accent_color = excluded.accent_color,
  is_featured = excluded.is_featured,
  sort_order = excluded.sort_order,
  updated_at = now();

create table if not exists public.food_collection_memberships (
  food_id text not null,
  collection_id text not null references public.collections(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (food_id, collection_id)
);

create table if not exists public.food_publication_metadata (
  food_id text primary key,
  review_status text check (review_status in ('draft', 'pending', 'approved', 'rejected')),
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.food_variants (
  id text primary key default ('var-' || replace(gen_random_uuid()::text, '-', '')),
  food_id text not null,
  label text not null,
  price integer,
  is_default boolean not null default false,
  sort_order integer not null default 100,
  source_url text,
  last_checked_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create or replace function public.set_food_publication_metadata_published_at()
returns trigger as $$
begin
  if new.review_status = 'approved'
    and new.published_at is null
    and (tg_op = 'INSERT' or old.review_status is distinct from 'approved')
  then
    new.published_at = now();
  end if;
  return new;
end;
$$ language plpgsql;

drop trigger if exists manual_foods_set_updated_at on public.manual_foods;
create trigger manual_foods_set_updated_at before update on public.manual_foods
for each row execute function public.set_updated_at();

drop trigger if exists food_overrides_set_updated_at on public.food_overrides;
create trigger food_overrides_set_updated_at before update on public.food_overrides
for each row execute function public.set_updated_at();

drop trigger if exists collections_set_updated_at on public.collections;
create trigger collections_set_updated_at before update on public.collections
for each row execute function public.set_updated_at();

drop trigger if exists food_publication_metadata_set_updated_at on public.food_publication_metadata;
create trigger food_publication_metadata_set_updated_at before update on public.food_publication_metadata
for each row execute function public.set_updated_at();

drop trigger if exists food_publication_metadata_set_published_at on public.food_publication_metadata;
create trigger food_publication_metadata_set_published_at
before insert or update of review_status on public.food_publication_metadata
for each row execute function public.set_food_publication_metadata_published_at();

drop trigger if exists food_variants_set_updated_at on public.food_variants;
create trigger food_variants_set_updated_at before update on public.food_variants
for each row execute function public.set_updated_at();

create index if not exists manual_foods_public_idx
  on public.manual_foods(public_state, hidden, sale_status);
create index if not exists manual_foods_category_tags_idx
  on public.manual_foods using gin(category_tags);
create index if not exists manual_foods_updated_by_idx
  on public.manual_foods(updated_by);
create index if not exists manual_foods_deleted_at_idx
  on public.manual_foods(deleted_at);

create index if not exists food_overrides_hidden_idx
  on public.food_overrides(hidden, is_deleted);
create index if not exists food_override_revisions_food_version_idx
  on public.food_override_revisions(food_id, version desc);

create index if not exists food_collection_memberships_collection_sort_idx
  on public.food_collection_memberships(collection_id, created_at desc);
create index if not exists food_publication_metadata_status_idx
  on public.food_publication_metadata(review_status, published_at desc);
create unique index if not exists food_variants_food_label_idx
  on public.food_variants(food_id, label);
create unique index if not exists food_variants_one_default_per_food_idx
  on public.food_variants(food_id)
  where is_default;
create index if not exists food_variants_food_sort_idx
  on public.food_variants(food_id, sort_order);

alter table public.admin_users enable row level security;
alter table public.admin_auth_pkce_attempts enable row level security;
alter table public.manual_foods enable row level security;
alter table public.food_overrides enable row level security;
alter table public.food_override_revisions enable row level security;
alter table public.collections enable row level security;
alter table public.food_collection_memberships enable row level security;
alter table public.food_publication_metadata enable row level security;
alter table public.food_variants enable row level security;

drop policy if exists "Public can read collections" on public.collections;
create policy "Public can read collections" on public.collections
  for select using (true);

drop policy if exists "Public can read food collection memberships" on public.food_collection_memberships;
create policy "Public can read food collection memberships" on public.food_collection_memberships
  for select using (true);

drop policy if exists "Public can read food publication metadata" on public.food_publication_metadata;
create policy "Public can read food publication metadata" on public.food_publication_metadata
  for select using (true);

drop policy if exists "Public can read food variants" on public.food_variants;
create policy "Public can read food variants" on public.food_variants
  for select using (true);

-- Admin writes use service role from server-side actions. Generated foods are still
-- sourced from scripts/output/foods.generated.json; do not create a DB foods table.
