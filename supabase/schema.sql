-- ══════════════════════════════════════════════════════
-- HES Retrofits Tracker — Supabase Schema
-- Run this in your Supabase SQL Editor (Dashboard → SQL Editor)
-- ══════════════════════════════════════════════════════

-- 1. USERS TABLE
create table if not exists public.users (
  id text primary key,
  name text not null,
  username text not null unique,
  pin text not null,
  role text not null check (role in ('admin','scheduler','assessor','scope','installer')),
  created_at timestamptz default now()
);

-- 2. PROJECTS TABLE
-- Core fields are indexed columns; full project data lives in jsonb
create table if not exists public.projects (
  id text primary key,
  data jsonb not null default '{}'::jsonb,
  customer_name text default '',
  address text default '',
  current_stage integer default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 3. INDEXES
create index if not exists idx_projects_stage on public.projects (current_stage);
create index if not exists idx_projects_updated on public.projects (updated_at desc);
create index if not exists idx_users_username on public.users (username);

-- 4. ROW LEVEL SECURITY
-- Enable RLS but allow all operations for now (anon key).
-- Tighten these policies once you add Supabase Auth.
alter table public.users enable row level security;
alter table public.projects enable row level security;

-- Allow all operations with anon key (simple PIN auth handled in app)
create policy "Allow all user operations" on public.users
  for all using (true) with check (true);

create policy "Allow all project operations" on public.projects
  for all using (true) with check (true);

-- 5. SEED DEFAULT USERS
-- These match the defaults in the app. Change PINs after first login!
insert into public.users (id, name, username, pin, role) values
  ('u1', 'Admin', 'admin', '1234', 'admin'),
  ('u2', 'Scheduler', 'scheduler', '1234', 'scheduler'),
  ('u3', 'Assessor', 'assessor', '1234', 'assessor'),
  ('u4', 'Scope Lead', 'scope', '1234', 'scope'),
  ('u5', 'Installer', 'installer', '1234', 'installer')
on conflict (id) do nothing;
