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
  sale_status text not null default 'active'
    check (sale_status in ('active', 'paused', 'ended', 'unknown')),
  public_state text not null default 'published'
    check (public_state in ('published', 'draft')),
  hidden boolean not null default false,
  start_date date,
  end_date date,
  image_url text,
  source_url text not null,
  admin_notes text,
  created_by text not null,
  updated_by text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists manual_foods_public_idx
  on public.manual_foods(public_state, hidden, sale_status);

create index if not exists manual_foods_category_tags_idx
  on public.manual_foods using gin(category_tags);

create index if not exists manual_foods_updated_by_idx
  on public.manual_foods(updated_by);
