alter table public.foods add column if not exists image_url text;
alter table public.foods add column if not exists confidence_score integer not null default 0;
alter table public.foods add column if not exists name_quality_score integer not null default 0;
alter table public.foods add column if not exists display_quality text not null default 'medium';
alter table public.foods add column if not exists extraction_source_count integer not null default 1;
alter table public.foods add column if not exists review_status text not null default 'pending';
alter table public.foods add column if not exists hidden boolean not null default false;
alter table public.foods add column if not exists duplicate_group_id text;
alter table public.foods add column if not exists composite_menu boolean not null default false;
alter table public.foods add column if not exists canonical_food boolean not null default false;
alter table public.foods add column if not exists price_min integer;
alter table public.foods add column if not exists price_max integer;
alter table public.foods add column if not exists price_note text;
alter table public.foods add column if not exists price_source_url text;
alter table public.foods add column if not exists price_last_checked_at timestamptz;
alter table public.foods add column if not exists price_confidence_score integer;
alter table public.foods add column if not exists dining_type text;
alter table public.foods add column if not exists dining_type_confidence_score integer;
alter table public.foods add column if not exists dining_type_reason text;
alter table public.foods add column if not exists canonical_group_id text;
alter table public.foods add column if not exists flavor text;
alter table public.foods add column if not exists event_name text;
alter table public.foods add column if not exists collaboration_name text;
alter table public.foods add column if not exists release_period text;
alter table public.foods add column if not exists seasonal_version text;
alter table public.foods add column if not exists rarity text;
alter table public.foods add column if not exists zukan_number integer;
alter table public.foods add column if not exists trusted_placeholder boolean not null default false;

alter table public.food_images add column if not exists alt text;
alter table public.food_images add column if not exists width integer;
alter table public.food_images add column if not exists height integer;
alter table public.food_images add column if not exists image_confidence_score integer not null default 0;
alter table public.food_images add column if not exists image_match_score integer not null default 0;
alter table public.food_images add column if not exists category_image_match_score integer not null default 0;
alter table public.food_images add column if not exists image_source_context text;
alter table public.food_images add column if not exists image_match_reason text;
alter table public.food_images add column if not exists image_mismatch_reason text;
alter table public.food_images add column if not exists image_verified boolean not null default false;
alter table public.food_images add column if not exists is_shared_too_much boolean not null default false;

create table if not exists public.food_locations (
  id uuid primary key default gen_random_uuid(),
  food_id uuid not null references public.foods(id) on delete cascade,
  shop_id uuid references public.shops(id) on delete set null,
  shop_name text not null,
  area_id uuid references public.areas(id) on delete set null,
  area_name text not null,
  shop_type text not null default 'unknown',
  source_url text,
  price integer,
  status text not null default 'unknown',
  start_date date,
  end_date date,
  last_checked_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (food_id, shop_name, area_name, source_url, price)
);
create index if not exists food_locations_food_idx on public.food_locations(food_id);

create index if not exists foods_review_visible_idx on public.foods(review_status, hidden, display_quality, name_quality_score desc, confidence_score desc);
create index if not exists foods_canonical_idx on public.foods(canonical_food, hidden, review_status);
create index if not exists foods_canonical_group_idx on public.foods(canonical_group_id);
create index if not exists foods_duplicate_group_idx on public.foods(duplicate_group_id);
create index if not exists foods_image_url_idx on public.foods(image_url);

create table if not exists public.food_events (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  start_date date,
  end_date date,
  official_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.food_collections (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  description text,
  sort_order integer not null default 999,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.food_variants (
  id uuid primary key default gen_random_uuid(),
  food_id uuid not null references public.foods(id) on delete cascade,
  canonical_group_id text,
  flavor text,
  event_name text,
  collaboration_name text,
  release_period text,
  seasonal_version text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.food_release_history (
  id uuid primary key default gen_random_uuid(),
  food_id uuid not null references public.foods(id) on delete cascade,
  event_name text,
  start_date date,
  end_date date,
  source_url text,
  created_at timestamptz not null default now()
);
