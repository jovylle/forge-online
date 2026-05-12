create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create table if not exists public.repositories (
  id uuid primary key default gen_random_uuid(),
  github_repo_id bigint not null unique,
  name text not null,
  full_name text not null unique,
  owner_login text not null,
  is_private boolean not null default false,
  description text,
  default_branch text,
  primary_language text,
  topics jsonb not null default '[]'::jsonb,
  updated_at_github timestamptz,
  pushed_at_github timestamptz,
  html_url text not null,
  homepage_url text,
  is_archived boolean not null default false,
  is_fork boolean not null default false,
  stargazer_count integer not null default 0,
  last_synced_at timestamptz,
  sync_source text not null check (sync_source in ('public', 'token')),
  hidden boolean not null default false,
  pinned boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.repo_metadata (
  repository_id uuid primary key references public.repositories (id) on delete cascade,
  goal text,
  status_override text check (status_override in ('active', 'wip', 'abandoned', 'done')),
  notes text,
  next_step text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.sync_state (
  key text primary key,
  last_synced_at timestamptz,
  status text not null default 'idle' check (status in ('idle', 'success', 'error')),
  message text,
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists repositories_owner_login_idx
  on public.repositories (owner_login);

create index if not exists repositories_pushed_at_github_idx
  on public.repositories (pushed_at_github desc);

create index if not exists repositories_updated_at_github_idx
  on public.repositories (updated_at_github desc);

create index if not exists repo_metadata_status_override_idx
  on public.repo_metadata (status_override);

create trigger repositories_set_updated_at
before update on public.repositories
for each row
execute function public.set_updated_at();

create trigger repo_metadata_set_updated_at
before update on public.repo_metadata
for each row
execute function public.set_updated_at();

create trigger sync_state_set_updated_at
before update on public.sync_state
for each row
execute function public.set_updated_at();
