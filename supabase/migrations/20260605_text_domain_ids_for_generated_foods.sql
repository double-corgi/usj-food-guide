-- Generated app data uses stable text IDs such as food-62sv4l, area-apf4z5,
-- and shop-キノピオ・カフェ. Keep food-domain IDs text so generated seed data
-- can reference the 200-item dataset without UUID conversion errors.

alter table if exists public.food_images drop constraint if exists food_images_food_id_fkey;
alter table if exists public.food_locations drop constraint if exists food_locations_food_id_fkey;
alter table if exists public.food_locations drop constraint if exists food_locations_shop_id_fkey;
alter table if exists public.food_locations drop constraint if exists food_locations_area_id_fkey;
alter table if exists public.image_candidates drop constraint if exists image_candidates_food_id_fkey;
alter table if exists public.food_variants drop constraint if exists food_variants_food_id_fkey;
alter table if exists public.food_release_history drop constraint if exists food_release_history_food_id_fkey;
alter table if exists public.foods drop constraint if exists foods_shop_id_fkey;
alter table if exists public.foods drop constraint if exists foods_area_id_fkey;
alter table if exists public.shops drop constraint if exists shops_area_id_fkey;

alter table if exists public.areas
  alter column id drop default,
  alter column id type text using id::text,
  alter column id set default ('area-' || replace(gen_random_uuid()::text, '-', ''));

alter table if exists public.shops
  alter column id drop default,
  alter column id type text using id::text,
  alter column area_id type text using area_id::text,
  alter column id set default ('shop-' || replace(gen_random_uuid()::text, '-', ''));

alter table if exists public.foods
  alter column id drop default,
  alter column id type text using id::text,
  alter column shop_id type text using shop_id::text,
  alter column area_id type text using area_id::text,
  alter column id set default ('food-' || replace(gen_random_uuid()::text, '-', ''));

alter table if exists public.food_images
  alter column id drop default,
  alter column id type text using id::text,
  alter column food_id type text using food_id::text,
  alter column id set default ('img-' || replace(gen_random_uuid()::text, '-', ''));

alter table if exists public.food_locations
  alter column id drop default,
  alter column id type text using id::text,
  alter column food_id type text using food_id::text,
  alter column shop_id type text using shop_id::text,
  alter column area_id type text using area_id::text,
  alter column id set default ('loc-' || replace(gen_random_uuid()::text, '-', ''));

alter table if exists public.image_candidates
  alter column food_id type text using food_id::text;

alter table if exists public.food_collections
  alter column id drop default,
  alter column id type text using id::text,
  alter column id set default ('collection-' || replace(gen_random_uuid()::text, '-', ''));

alter table if exists public.food_variants
  alter column food_id type text using food_id::text;

alter table if exists public.food_release_history
  alter column food_id type text using food_id::text;

alter table if exists public.admin_flags
  alter column target_id type text using target_id::text;

alter table if exists public.shops
  add constraint shops_area_id_fkey foreign key (area_id) references public.areas(id) on delete set null;

alter table if exists public.foods
  add constraint foods_shop_id_fkey foreign key (shop_id) references public.shops(id) on delete set null,
  add constraint foods_area_id_fkey foreign key (area_id) references public.areas(id) on delete set null;

alter table if exists public.food_images
  add constraint food_images_food_id_fkey foreign key (food_id) references public.foods(id) on delete cascade;

alter table if exists public.food_locations
  add constraint food_locations_food_id_fkey foreign key (food_id) references public.foods(id) on delete cascade,
  add constraint food_locations_shop_id_fkey foreign key (shop_id) references public.shops(id) on delete set null,
  add constraint food_locations_area_id_fkey foreign key (area_id) references public.areas(id) on delete set null;

alter table if exists public.image_candidates
  add constraint image_candidates_food_id_fkey foreign key (food_id) references public.foods(id) on delete cascade;

alter table if exists public.food_variants
  add constraint food_variants_food_id_fkey foreign key (food_id) references public.foods(id) on delete cascade;

alter table if exists public.food_release_history
  add constraint food_release_history_food_id_fkey foreign key (food_id) references public.foods(id) on delete cascade;
