-- Phase 1 schema for "ユニバで食べたものリスト".
-- Run this in Supabase SQL Editor, then run supabase/seed.sql for MVP sample data.

create extension if not exists pgcrypto;

create table if not exists public.areas (
  id text primary key default ('area-' || replace(gen_random_uuid()::text, '-', '')),
  name text not null unique,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.shops (
  id text primary key default ('shop-' || replace(gen_random_uuid()::text, '-', '')),
  area_id text references public.areas(id) on delete set null,
  name text not null,
  type text not null default 'unknown' check (type in ('restaurant', 'cart', 'wagon', 'unknown')),
  official_url text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (area_id, name)
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
  created_at timestamptz not null default now()
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
  sort_order = excluded.sort_order;

create table if not exists public.foods (
  id text primary key default ('food-' || replace(gen_random_uuid()::text, '-', '')),
  shop_id text references public.shops(id) on delete set null,
  area_id text references public.areas(id) on delete set null,
  name text not null,
  normalized_name text not null,
  category text not null default 'unknown' check (category in ('churro', 'popcorn', 'drink', 'dessert', 'burger', 'pizza', 'chicken', 'rice', 'noodle', 'snack', 'kids', 'seasonal', 'set', 'unknown')),
  price integer,
  price_min integer,
  price_max integer,
  price_note text,
  price_source_url text,
  price_last_checked_at timestamptz,
  price_confidence_score integer,
  dining_type text check (dining_type in ('takeout', 'eat_in', 'both', 'food_cart', 'unknown')),
  dining_type_confidence_score integer,
  dining_type_reason text,
  description text,
  official_url text,
  source_url text not null,
  image_url text,
  start_date date,
  end_date date,
  status text not null default 'unknown' check (status in ('active', 'scheduled', 'ended', 'inactive', 'unknown')),
  is_limited boolean not null default false,
  confidence_score integer not null default 0,
  name_quality_score integer not null default 0,
  display_quality text not null default 'medium' check (display_quality in ('high', 'medium', 'low')),
  extraction_source_count integer not null default 1,
  review_status text not null default 'pending' check (review_status in ('draft', 'pending', 'approved', 'rejected')),
  hidden boolean not null default false,
  collection_id text references public.collections(id) on delete set null,
  published_at timestamptz,
  duplicate_group_id text,
  manual_override boolean not null default false,
  composite_menu boolean not null default false,
  canonical_food boolean not null default false,
  canonical_group_id text,
  flavor text,
  event_name text,
  collaboration_name text,
  release_period text,
  seasonal_version text,
  rarity text check (rarity in ('standard', 'limited', 'event', 'rare')),
  zukan_number integer,
  trusted_placeholder boolean not null default false,
  last_checked_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (shop_id, normalized_name)
);

create table if not exists public.food_images (
  id text primary key default ('img-' || replace(gen_random_uuid()::text, '-', '')),
  food_id text not null references public.foods(id) on delete cascade,
  image_url text not null,
  source_type text not null check (source_type in ('official', 'own', 'user', 'ai', 'placeholder')),
  source_url text,
  priority integer not null default 100,
  alt_text text,
  alt text,
  width integer,
  height integer,
  image_confidence_score integer not null default 0,
  image_match_score integer not null default 0,
  category_image_match_score integer not null default 0,
  image_source_context text,
  image_match_reason text,
  image_mismatch_reason text,
  image_verified boolean not null default false,
  is_shared_too_much boolean not null default false,
  has_watermark boolean not null default false,
  watermark_reason text,
  image_candidate_score integer,
  image_source_name text,
  official_confirmed boolean not null default false,
  image_last_checked_at timestamptz,
  enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (food_id, image_url)
);

create table if not exists public.food_locations (
  id text primary key default ('loc-' || replace(gen_random_uuid()::text, '-', '')),
  food_id text not null references public.foods(id) on delete cascade,
  shop_id text references public.shops(id) on delete set null,
  shop_name text not null,
  area_id text references public.areas(id) on delete set null,
  area_name text not null,
  shop_type text not null default 'unknown' check (shop_type in ('restaurant', 'cart', 'wagon', 'unknown')),
  source_url text,
  price integer,
  status text not null default 'unknown' check (status in ('active', 'scheduled', 'ended', 'inactive', 'unknown')),
  start_date date,
  end_date date,
  last_checked_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (food_id, shop_name, area_name, source_url, price)
);

create table if not exists public.food_events (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  start_date date,
  end_date date,
  official_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.image_candidates (
  id uuid primary key default gen_random_uuid(),
  food_id text not null references public.foods(id) on delete cascade,
  candidate_url text not null,
  thumbnail_url text,
  source_page text,
  source_domain text,
  source_name text,
  image_width integer,
  image_height integer,
  image_match_score integer not null default 0,
  has_watermark boolean not null default false,
  watermark_reason text,
  is_product_photo boolean not null default false,
  is_storefront boolean not null default false,
  is_menu_board boolean not null default false,
  is_collage boolean not null default false,
  is_character_only boolean not null default false,
  is_closeup_food boolean not null default false,
  product_match_score integer not null default 0,
  is_approved boolean not null default false,
  is_rejected boolean not null default false,
  official_confirmed boolean not null default false,
  reasons jsonb not null default '[]'::jsonb,
  query text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(food_id, candidate_url)
);

create table if not exists public.food_collections (
  id text primary key default ('collection-' || replace(gen_random_uuid()::text, '-', '')),
  name text not null unique,
  description text,
  sort_order integer not null default 999,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.food_variants (
  id text primary key default ('var-' || replace(gen_random_uuid()::text, '-', '')),
  food_id text not null references public.foods(id) on delete cascade,
  label text not null,
  price integer,
  is_default boolean not null default false,
  sort_order integer not null default 100,
  source_url text,
  last_checked_at timestamptz,
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
  food_id text not null references public.foods(id) on delete cascade,
  event_name text,
  start_date date,
  end_date date,
  source_url text,
  created_at timestamptz not null default now()
);

create table if not exists public.crawl_logs (
  id uuid primary key default gen_random_uuid(),
  source_name text not null,
  source_url text not null,
  status text not null check (status in ('success', 'failed')),
  message text,
  added_count integer not null default 0,
  updated_count integer not null default 0,
  inactive_count integer not null default 0,
  pages_crawled integer not null default 0,
  foods_found integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.admin_flags (
  id uuid primary key default gen_random_uuid(),
  target_type text not null,
  target_id text not null,
  note text not null,
  created_at timestamptz not null default now()
);

create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create or replace function public.set_food_published_at_on_approval()
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

create or replace function public.sync_food_price_from_default_variant()
returns trigger as $$
begin
  if new.is_default = true and new.price is not null then
    update public.foods
      set price = new.price
      where id = new.food_id and price is distinct from new.price;
  end if;
  return new;
end;
$$ language plpgsql;

drop trigger if exists areas_set_updated_at on public.areas;
create trigger areas_set_updated_at before update on public.areas
for each row execute function public.set_updated_at();

drop trigger if exists shops_set_updated_at on public.shops;
create trigger shops_set_updated_at before update on public.shops
for each row execute function public.set_updated_at();

drop trigger if exists foods_set_updated_at on public.foods;
create trigger foods_set_updated_at before update on public.foods
for each row execute function public.set_updated_at();

drop trigger if exists foods_set_published_at_on_approval on public.foods;
create trigger foods_set_published_at_on_approval before insert or update of review_status on public.foods
for each row execute function public.set_food_published_at_on_approval();

drop trigger if exists food_images_set_updated_at on public.food_images;
create trigger food_images_set_updated_at before update on public.food_images
for each row execute function public.set_updated_at();

drop trigger if exists food_variants_sync_default_price on public.food_variants;
create trigger food_variants_sync_default_price after insert or update of price, is_default on public.food_variants
for each row execute function public.sync_food_price_from_default_variant();

alter table public.areas enable row level security;
alter table public.shops enable row level security;
alter table public.foods enable row level security;
alter table public.collections enable row level security;
alter table public.food_images enable row level security;
alter table public.food_variants enable row level security;
alter table public.crawl_logs enable row level security;
alter table public.admin_flags enable row level security;

create policy "Public can read areas" on public.areas for select using (true);
create policy "Public can read active shops" on public.shops for select using (true);
create policy "Public can read foods" on public.foods for select using (true);
create policy "Public can read collections" on public.collections for select using (true);
create policy "Public can read enabled images" on public.food_images for select using (enabled = true);
create policy "Public can read food variants" on public.food_variants for select using (true);

create index if not exists foods_status_idx on public.foods(status);
create index if not exists foods_category_idx on public.foods(category);
create index if not exists foods_review_visible_idx on public.foods(review_status, hidden, display_quality, name_quality_score desc, confidence_score desc);
create index if not exists foods_collection_id_idx on public.foods(collection_id);
create index if not exists foods_published_at_idx on public.foods(published_at desc);
create index if not exists foods_duplicate_group_idx on public.foods(duplicate_group_id);
create index if not exists foods_image_url_idx on public.foods(image_url);
create index if not exists foods_area_id_idx on public.foods(area_id);
create index if not exists foods_shop_id_idx on public.foods(shop_id);
create index if not exists food_images_food_priority_idx on public.food_images(food_id, enabled, priority);
create unique index if not exists food_variants_food_label_idx on public.food_variants(food_id, label);
create unique index if not exists food_variants_one_default_per_food_idx on public.food_variants(food_id) where is_default;
create index if not exists food_variants_food_sort_idx on public.food_variants(food_id, sort_order);

-- Admin writes and crawler writes should use Supabase service role in server-side code.
