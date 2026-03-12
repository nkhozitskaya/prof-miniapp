-- Пользователи (по Telegram)
create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  telegram_user_id bigint not null unique,
  username text,
  first_name text,
  last_name text,
  created_at timestamptz not null default now()
);

-- Результаты диагностики
create table if not exists public.diagnostic_results (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  completed_at timestamptz not null default now(),
  subscales jsonb not null default '{}',
  tendencies jsonb not null default '{}',
  zones_support text[] not null default '{}',
  zones_middle text[] not null default '{}',
  zones_risk text[] not null default '{}',
  risk_signal boolean not null default false,
  interpretation text not null default ''
);

create index if not exists idx_diagnostic_results_user_id on public.diagnostic_results(user_id);

-- RLS: доступ только через service role (Edge Functions)
alter table public.users enable row level security;
alter table public.diagnostic_results enable row level security;

-- Политики не дают доступ анонимным пользователям; Edge Functions используют service role
create policy "No direct anon access" on public.users for all using (false);
create policy "No direct anon access" on public.diagnostic_results for all using (false);
