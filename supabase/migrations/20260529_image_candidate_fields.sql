alter table public.food_images add column if not exists image_candidate_score integer;
alter table public.food_images add column if not exists image_source_name text;
alter table public.food_images add column if not exists official_confirmed boolean not null default false;
alter table public.food_images add column if not exists image_last_checked_at timestamptz;
