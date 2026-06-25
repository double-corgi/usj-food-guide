alter table public.manual_foods
  add column if not exists deleted_at timestamptz null;

create index if not exists manual_foods_deleted_at_idx
  on public.manual_foods(deleted_at);
