-- Phase P1: seasonal collection and price variant foundation for hybrid food storage.
-- Safe to run more than once. Does not reference a DB foods table and does not backfill
-- inferred published_at values for existing approved foods.

begin;

create extension if not exists pgcrypto;

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

create unique index if not exists food_variants_food_label_idx
  on public.food_variants(food_id, label);

create unique index if not exists food_variants_one_default_per_food_idx
  on public.food_variants(food_id)
  where is_default;

create index if not exists food_variants_food_sort_idx
  on public.food_variants(food_id, sort_order);

create index if not exists food_collection_memberships_collection_sort_idx
  on public.food_collection_memberships(collection_id, created_at desc);

create index if not exists food_publication_metadata_status_idx
  on public.food_publication_metadata(review_status, published_at desc);

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

drop trigger if exists collections_set_updated_at on public.collections;
create trigger collections_set_updated_at
before update on public.collections
for each row execute function public.set_updated_at();

drop trigger if exists food_publication_metadata_set_updated_at on public.food_publication_metadata;
create trigger food_publication_metadata_set_updated_at
before update on public.food_publication_metadata
for each row execute function public.set_updated_at();

drop trigger if exists food_publication_metadata_set_published_at on public.food_publication_metadata;
create trigger food_publication_metadata_set_published_at
before insert or update of review_status on public.food_publication_metadata
for each row execute function public.set_food_publication_metadata_published_at();

drop trigger if exists food_variants_set_updated_at on public.food_variants;
create trigger food_variants_set_updated_at
before update on public.food_variants
for each row execute function public.set_updated_at();

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

commit;
