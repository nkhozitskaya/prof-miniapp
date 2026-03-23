-- Persistent user account profile (contacts + role + display data).
create table if not exists public.user_profiles (
  user_id uuid primary key references public.users(id) on delete cascade,
  display_name text,
  age int,
  phone text,
  email text,
  role text, -- teen|parent
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.user_profiles enable row level security;
create policy "No direct anon access" on public.user_profiles for all using (false);

