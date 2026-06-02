alter table public.image_candidates add column if not exists is_menu_board boolean not null default false;
alter table public.image_candidates add column if not exists is_character_only boolean not null default false;
alter table public.image_candidates add column if not exists is_closeup_food boolean not null default false;
alter table public.image_candidates add column if not exists product_match_score integer not null default 0;
