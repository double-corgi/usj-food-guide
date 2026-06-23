-- Phase 1: admin authentication and role allowlist only.
-- Apply manually in Supabase. This migration does not write food data.

create table if not exists public.admin_users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  role text not null check (role in ('owner', 'editor', 'viewer')),
  created_at timestamptz not null default now()
);

alter table public.admin_users enable row level security;

create or replace function public.is_admin_owner()
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.admin_users
    where id = auth.uid()
      and role = 'owner'
  );
$$;

drop policy if exists "admin users can read own row or owner can read all" on public.admin_users;
create policy "admin users can read own row or owner can read all"
on public.admin_users
for select
using (auth.uid() = id or public.is_admin_owner());

drop policy if exists "owners can insert admin users" on public.admin_users;
create policy "owners can insert admin users"
on public.admin_users
for insert
with check (public.is_admin_owner());

drop policy if exists "owners can update admin users" on public.admin_users;
create policy "owners can update admin users"
on public.admin_users
for update
using (public.is_admin_owner())
with check (public.is_admin_owner());

drop policy if exists "owners can delete admin users" on public.admin_users;
create policy "owners can delete admin users"
on public.admin_users
for delete
using (public.is_admin_owner());
