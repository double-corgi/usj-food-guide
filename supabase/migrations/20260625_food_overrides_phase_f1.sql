-- Phase F1: generated food override foundation only.
-- Apply manually in Supabase. This migration does not write food data.

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

create index if not exists food_overrides_updated_by_idx
  on public.food_overrides(updated_by);

create index if not exists food_override_revisions_food_id_version_idx
  on public.food_override_revisions(food_id, version desc);

alter table public.food_overrides enable row level security;
alter table public.food_override_revisions enable row level security;

revoke all on table public.food_overrides from anon, authenticated;
revoke all on table public.food_override_revisions from anon, authenticated;
