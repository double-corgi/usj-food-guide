alter table public.food_images add column if not exists has_watermark boolean not null default false;
alter table public.food_images add column if not exists watermark_reason text;
