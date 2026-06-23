-- Server-side PKCE bridge for admin Magic Link callbacks.
-- This keeps short-lived code verifiers server-side so mobile email app
-- transitions do not depend on browser-local PKCE storage.

create table if not exists public.admin_auth_pkce_attempts (
  id uuid primary key,
  code_verifier text not null,
  next_path text not null default '/admin/foods',
  created_at timestamptz not null default now(),
  expires_at timestamptz not null,
  used_at timestamptz
);

create index if not exists admin_auth_pkce_attempts_expires_idx
  on public.admin_auth_pkce_attempts(expires_at);

alter table public.admin_auth_pkce_attempts enable row level security;
