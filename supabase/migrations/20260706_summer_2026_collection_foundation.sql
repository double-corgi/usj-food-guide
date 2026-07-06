-- Phase P1: seasonal collection and price variant foundation.
-- Safe to run more than once. Does not backfill existing approved foods.

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

alter table if exists public.foods
  add column if not exists collection_id text,
  add column if not exists published_at timestamptz;

do $$
begin
  if to_regclass('public.foods') is not null
    and not exists (
      select 1
      from pg_constraint
      where conname = 'foods_collection_id_fkey'
        and conrelid = 'public.foods'::regclass
    )
  then
    alter table public.foods
      add constraint foods_collection_id_fkey
      foreign key (collection_id) references public.collections(id) on delete set null;
  end if;
end $$;

alter table if exists public.foods drop constraint if exists foods_review_status_check;
alter table if exists public.foods
  add constraint foods_review_status_check
  check (review_status in ('draft', 'pending', 'approved', 'rejected'));

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

alter table if exists public.food_variants
  alter column id drop default,
  alter column id type text using id::text,
  alter column id set default ('var-' || replace(gen_random_uuid()::text, '-', '')),
  alter column food_id type text using food_id::text,
  add column if not exists label text,
  add column if not exists price integer,
  add column if not exists is_default boolean not null default false,
  add column if not exists sort_order integer not null default 100,
  add column if not exists source_url text,
  add column if not exists last_checked_at timestamptz,
  add column if not exists canonical_group_id text,
  add column if not exists flavor text,
  add column if not exists event_name text,
  add column if not exists collaboration_name text,
  add column if not exists release_period text,
  add column if not exists seasonal_version text;

with numbered_variants as (
  select
    id,
    coalesce(label, flavor, event_name, collaboration_name, release_period, seasonal_version, '単品') as base_label,
    row_number() over (
      partition by food_id, coalesce(label, flavor, event_name, collaboration_name, release_period, seasonal_version, '単品')
      order by id
    ) as duplicate_index
  from public.food_variants
  where label is null
)
update public.food_variants as variant
  set label = case
    when numbered_variants.duplicate_index = 1 then numbered_variants.base_label
    else numbered_variants.base_label || ' ' || numbered_variants.duplicate_index::text
  end
  from numbered_variants
  where variant.id = numbered_variants.id;

alter table if exists public.food_variants
  alter column label set not null;

do $$
begin
  if to_regclass('public.food_variants') is not null
    and not exists (
      select 1
      from pg_constraint
      where conname = 'food_variants_food_id_fkey'
        and conrelid = 'public.food_variants'::regclass
    )
  then
    alter table public.food_variants
      add constraint food_variants_food_id_fkey
      foreign key (food_id) references public.foods(id) on delete cascade;
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from (
      select food_id, label, count(*) as duplicate_count
      from public.food_variants
      group by food_id, label
      having count(*) > 1
    ) duplicates
  ) then
    create unique index if not exists food_variants_food_label_idx
      on public.food_variants(food_id, label);
  else
    raise notice 'Skipped food_variants_food_label_idx because duplicate labels remain.';
  end if;
end $$;

create unique index if not exists food_variants_one_default_per_food_idx
  on public.food_variants(food_id)
  where is_default;

create index if not exists foods_collection_id_idx on public.foods(collection_id);
create index if not exists foods_published_at_idx on public.foods(published_at desc);
create index if not exists food_variants_food_sort_idx on public.food_variants(food_id, sort_order);

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

drop trigger if exists foods_set_published_at_on_approval on public.foods;
create trigger foods_set_published_at_on_approval
before insert or update of review_status on public.foods
for each row execute function public.set_food_published_at_on_approval();

create or replace function public.sync_food_price_from_default_variant()
returns trigger as $$
begin
  if new.is_default = true and new.price is not null then
    update public.foods
      set price = new.price
      where id = new.food_id
        and price is distinct from new.price;
  end if;
  return new;
end;
$$ language plpgsql;

drop trigger if exists food_variants_sync_default_price on public.food_variants;
create trigger food_variants_sync_default_price
after insert or update of price, is_default on public.food_variants
for each row execute function public.sync_food_price_from_default_variant();

alter table public.collections enable row level security;
alter table public.food_variants enable row level security;

drop policy if exists "Public can read collections" on public.collections;
create policy "Public can read collections" on public.collections
  for select using (true);

drop policy if exists "Public can read food variants" on public.food_variants;
create policy "Public can read food variants" on public.food_variants
  for select using (true);
