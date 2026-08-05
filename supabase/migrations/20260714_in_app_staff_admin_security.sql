-- In-app operator administration foundation.
--
-- This migration is additive only. It keeps the existing App Store 1.0 read
-- paths and the current Vercel admin service-role workflow compatible, while
-- adding Supabase Auth/RLS primitives for an in-app operator console.

create extension if not exists pgcrypto;

create table if not exists public.staff_members (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email text,
  display_name text,
  role text not null check (role in ('owner', 'editor')),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users(id),
  disabled_at timestamptz,
  disabled_by uuid references auth.users(id)
);

create index if not exists staff_members_role_active_idx
  on public.staff_members(role, is_active);

insert into public.staff_members (user_id, email, role, is_active, created_at, updated_at, created_by)
select id, email, role, true, created_at, now(), id
from public.admin_users
where role in ('owner', 'editor')
on conflict (user_id) do update set
  email = excluded.email,
  role = excluded.role,
  is_active = true,
  updated_at = now();

create or replace function public.current_auth_aal()
returns text
language sql
stable
as $$
  select coalesce(nullif(auth.jwt() ->> 'aal', ''), 'aal1')
$$;

create or replace function public.is_staff_member(min_role text default 'editor', require_aal2 boolean default false)
returns boolean
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  current_role text;
  current_rank integer;
  required_rank integer;
begin
  if auth.uid() is null then
    return false;
  end if;

  if require_aal2 and public.current_auth_aal() <> 'aal2' then
    return false;
  end if;

  select role into current_role
  from public.staff_members
  where user_id = auth.uid()
    and is_active = true;

  if current_role is null then
    return false;
  end if;

  current_rank := case current_role when 'owner' then 2 when 'editor' then 1 else 0 end;
  required_rank := case min_role when 'owner' then 2 when 'editor' then 1 else 99 end;
  return current_rank >= required_rank;
end;
$$;

create or replace function public.is_staff_owner(require_aal2 boolean default false)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.is_staff_member('owner', require_aal2)
$$;

alter table public.staff_members enable row level security;

drop policy if exists "staff members can read own row" on public.staff_members;
create policy "staff members can read own row"
on public.staff_members
for select
to authenticated
using (user_id = auth.uid() or public.is_staff_owner(false));

drop policy if exists "owners aal2 can insert staff members" on public.staff_members;
create policy "owners aal2 can insert staff members"
on public.staff_members
for insert
to authenticated
with check (public.is_staff_owner(true));

drop policy if exists "owners aal2 can update staff members" on public.staff_members;
create policy "owners aal2 can update staff members"
on public.staff_members
for update
to authenticated
using (public.is_staff_owner(true))
with check (public.is_staff_owner(true));

drop policy if exists "owners aal2 can delete staff members" on public.staff_members;
create policy "owners aal2 can delete staff members"
on public.staff_members
for delete
to authenticated
using (public.is_staff_owner(true));

grant select, insert, update, delete on public.staff_members to authenticated;

alter table public.manual_foods
  add column if not exists deleted_by uuid references auth.users(id),
  add column if not exists version integer not null default 1;

alter table public.food_overrides
  add column if not exists deleted_at timestamptz,
  add column if not exists deleted_by uuid references auth.users(id),
  add column if not exists version integer not null default 1;

alter table public.collections
  add column if not exists updated_by uuid references auth.users(id);

alter table public.food_publication_metadata
  add column if not exists updated_by uuid references auth.users(id);

alter table public.food_variants
  add column if not exists updated_by uuid references auth.users(id);

create or replace function public.bump_staff_managed_version()
returns trigger
language plpgsql
as $$
begin
  new.version = coalesce(old.version, 1) + 1;
  return new;
end;
$$;

drop trigger if exists manual_foods_bump_version on public.manual_foods;
create trigger manual_foods_bump_version
before update on public.manual_foods
for each row execute function public.bump_staff_managed_version();

drop trigger if exists food_overrides_bump_version on public.food_overrides;
create trigger food_overrides_bump_version
before update on public.food_overrides
for each row execute function public.bump_staff_managed_version();

create table if not exists public.staff_audit_logs (
  id uuid primary key default gen_random_uuid(),
  table_name text not null,
  record_id text not null,
  operation text not null check (operation in ('INSERT', 'UPDATE', 'DELETE')),
  old_data jsonb,
  new_data jsonb,
  actor_user_id uuid,
  actor_aal text,
  created_at timestamptz not null default now()
);

create index if not exists staff_audit_logs_table_record_idx
  on public.staff_audit_logs(table_name, record_id, created_at desc);
create index if not exists staff_audit_logs_actor_idx
  on public.staff_audit_logs(actor_user_id, created_at desc);

alter table public.staff_audit_logs enable row level security;

drop policy if exists "owners can read staff audit logs" on public.staff_audit_logs;
create policy "owners can read staff audit logs"
on public.staff_audit_logs
for select
to authenticated
using (public.is_staff_owner(false));

revoke insert, update, delete on public.staff_audit_logs from anon, authenticated;
grant select on public.staff_audit_logs to authenticated;

create or replace function public.staff_audit_record_id(row_data jsonb)
returns text
language sql
immutable
as $$
  select coalesce(
    row_data ->> 'id',
    row_data ->> 'food_id',
    row_data ->> 'user_id',
    concat_ws(':', row_data ->> 'food_id', row_data ->> 'collection_id'),
    row_data ->> 'email',
    'unknown'
  )
$$;

create or replace function public.log_staff_managed_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  old_json jsonb;
  new_json jsonb;
  row_json jsonb;
begin
  if tg_op = 'INSERT' then
    new_json := to_jsonb(new);
    row_json := new_json;
  elsif tg_op = 'UPDATE' then
    old_json := to_jsonb(old);
    new_json := to_jsonb(new);
    row_json := new_json;
  else
    old_json := to_jsonb(old);
    row_json := old_json;
  end if;

  insert into public.staff_audit_logs (
    table_name,
    record_id,
    operation,
    old_data,
    new_data,
    actor_user_id,
    actor_aal
  )
  values (
    tg_table_name,
    public.staff_audit_record_id(row_json),
    tg_op,
    old_json,
    new_json,
    auth.uid(),
    public.current_auth_aal()
  );

  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;

drop trigger if exists manual_foods_staff_audit on public.manual_foods;
create trigger manual_foods_staff_audit
after insert or update or delete on public.manual_foods
for each row execute function public.log_staff_managed_change();

drop trigger if exists food_overrides_staff_audit on public.food_overrides;
create trigger food_overrides_staff_audit
after insert or update or delete on public.food_overrides
for each row execute function public.log_staff_managed_change();

drop trigger if exists collections_staff_audit on public.collections;
create trigger collections_staff_audit
after insert or update or delete on public.collections
for each row execute function public.log_staff_managed_change();

drop trigger if exists food_collection_memberships_staff_audit on public.food_collection_memberships;
create trigger food_collection_memberships_staff_audit
after insert or update or delete on public.food_collection_memberships
for each row execute function public.log_staff_managed_change();

drop trigger if exists food_publication_metadata_staff_audit on public.food_publication_metadata;
create trigger food_publication_metadata_staff_audit
after insert or update or delete on public.food_publication_metadata
for each row execute function public.log_staff_managed_change();

drop trigger if exists food_variants_staff_audit on public.food_variants;
create trigger food_variants_staff_audit
after insert or update or delete on public.food_variants
for each row execute function public.log_staff_managed_change();

drop trigger if exists staff_members_staff_audit on public.staff_members;
create trigger staff_members_staff_audit
after insert or update or delete on public.staff_members
for each row execute function public.log_staff_managed_change();

grant select on public.manual_foods to anon, authenticated;
grant insert, update, delete on public.manual_foods to authenticated;
grant select, insert, update, delete on public.food_overrides to authenticated;
grant select, insert, update, delete on public.collections to authenticated;
grant select, insert, update, delete on public.food_collection_memberships to authenticated;
grant select, insert, update, delete on public.food_publication_metadata to authenticated;
grant select, insert, update, delete on public.food_variants to authenticated;

drop policy if exists "Public can read visible manual foods" on public.manual_foods;
create policy "Public can read visible manual foods"
on public.manual_foods
for select
to anon, authenticated
using (public_state = 'published' and hidden = false and deleted_at is null);

drop policy if exists "staff can read all manual foods" on public.manual_foods;
create policy "staff can read all manual foods"
on public.manual_foods
for select
to authenticated
using (public.is_staff_member('editor', false));

drop policy if exists "staff aal2 can insert manual foods" on public.manual_foods;
create policy "staff aal2 can insert manual foods"
on public.manual_foods
for insert
to authenticated
with check (public.is_staff_member('editor', true));

drop policy if exists "staff aal2 can update manual foods" on public.manual_foods;
create policy "staff aal2 can update manual foods"
on public.manual_foods
for update
to authenticated
using (public.is_staff_member('editor', true))
with check (public.is_staff_member('editor', true));

drop policy if exists "owners aal2 can delete manual foods" on public.manual_foods;
create policy "owners aal2 can delete manual foods"
on public.manual_foods
for delete
to authenticated
using (public.is_staff_owner(true));

drop policy if exists "staff can read all food overrides" on public.food_overrides;
create policy "staff can read all food overrides"
on public.food_overrides
for select
to authenticated
using (public.is_staff_member('editor', false));

drop policy if exists "staff aal2 can insert food overrides" on public.food_overrides;
create policy "staff aal2 can insert food overrides"
on public.food_overrides
for insert
to authenticated
with check (public.is_staff_member('editor', true));

drop policy if exists "staff aal2 can update food overrides" on public.food_overrides;
create policy "staff aal2 can update food overrides"
on public.food_overrides
for update
to authenticated
using (public.is_staff_member('editor', true))
with check (public.is_staff_member('editor', true));

drop policy if exists "owners aal2 can delete food overrides" on public.food_overrides;
create policy "owners aal2 can delete food overrides"
on public.food_overrides
for delete
to authenticated
using (public.is_staff_owner(true));

drop policy if exists "staff aal2 can modify collections" on public.collections;
create policy "staff aal2 can modify collections"
on public.collections
for all
to authenticated
using (public.is_staff_member('editor', true))
with check (public.is_staff_member('editor', true));

drop policy if exists "staff aal2 can modify memberships" on public.food_collection_memberships;
create policy "staff aal2 can modify memberships"
on public.food_collection_memberships
for all
to authenticated
using (public.is_staff_member('editor', true))
with check (public.is_staff_member('editor', true));

drop policy if exists "staff aal2 can modify publication metadata" on public.food_publication_metadata;
create policy "staff aal2 can modify publication metadata"
on public.food_publication_metadata
for all
to authenticated
using (public.is_staff_member('editor', true))
with check (public.is_staff_member('editor', true));

drop policy if exists "staff aal2 can modify variants" on public.food_variants;
create policy "staff aal2 can modify variants"
on public.food_variants
for all
to authenticated
using (public.is_staff_member('editor', true))
with check (public.is_staff_member('editor', true));

drop policy if exists "staff aal2 can upload food images" on storage.objects;
create policy "staff aal2 can upload food images"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'food-images'
  and public.is_staff_member('editor', true)
  and (
    name like 'manual/%'
    or name like 'overrides/%'
    or name like 'staff/%'
  )
);

drop policy if exists "staff aal2 can replace food images" on storage.objects;
create policy "staff aal2 can replace food images"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'food-images'
  and public.is_staff_member('editor', true)
  and (
    name like 'manual/%'
    or name like 'overrides/%'
    or name like 'staff/%'
  )
)
with check (
  bucket_id = 'food-images'
  and public.is_staff_member('editor', true)
  and (
    name like 'manual/%'
    or name like 'overrides/%'
    or name like 'staff/%'
  )
);

drop policy if exists "staff aal2 can delete food images" on storage.objects;
create policy "staff aal2 can delete food images"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'food-images'
  and public.is_staff_member('editor', true)
  and (
    name like 'manual/%'
    or name like 'overrides/%'
    or name like 'staff/%'
  )
);
