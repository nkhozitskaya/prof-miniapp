-- Parent portal: links, invites, parent assessments, profession trials, entitlements, purchase requests.

-- Parent-child links
create table if not exists public.parent_child_links (
  id uuid primary key default gen_random_uuid(),
  parent_user_id uuid not null references public.users(id) on delete cascade,
  child_user_id uuid not null references public.users(id) on delete cascade,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  revoked_at timestamptz
);

create unique index if not exists uq_parent_child_links_pair on public.parent_child_links(parent_user_id, child_user_id);
create index if not exists idx_parent_child_links_parent on public.parent_child_links(parent_user_id);
create index if not exists idx_parent_child_links_child on public.parent_child_links(child_user_id);

-- Invites (created by parent, redeemed by child)
create table if not exists public.link_invites (
  id uuid primary key default gen_random_uuid(),
  parent_user_id uuid not null references public.users(id) on delete cascade,
  code text not null unique,
  expires_at timestamptz not null,
  max_uses int not null default 1,
  uses int not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists idx_link_invites_parent on public.link_invites(parent_user_id);

-- Parent assessment about a child (visible only to parent)
create table if not exists public.parent_assessments (
  id uuid primary key default gen_random_uuid(),
  parent_user_id uuid not null references public.users(id) on delete cascade,
  child_user_id uuid not null references public.users(id) on delete cascade,
  completed_at timestamptz not null default now(),
  payload jsonb not null default '{}',
  result jsonb not null default '{}'
);

create index if not exists idx_parent_assessments_parent_child on public.parent_assessments(parent_user_id, child_user_id);

-- Child profession trials progress
create table if not exists public.profession_trials (
  id uuid primary key default gen_random_uuid(),
  child_user_id uuid not null references public.users(id) on delete cascade,
  profession_id text not null,
  status text not null default 'started', -- started|completed|cancelled
  result jsonb not null default '{}',
  started_at timestamptz not null default now(),
  completed_at timestamptz
);

create index if not exists idx_profession_trials_child on public.profession_trials(child_user_id);
create index if not exists idx_profession_trials_child_profession on public.profession_trials(child_user_id, profession_id);

-- Entitlements (purchased/unlocked for child)
create table if not exists public.entitlements (
  id uuid primary key default gen_random_uuid(),
  child_user_id uuid not null references public.users(id) on delete cascade,
  sku text not null, -- profession id or package id
  source text not null default 'grant', -- parent_purchase|child_purchase|grant
  active boolean not null default true,
  created_at timestamptz not null default now(),
  expires_at timestamptz
);

create unique index if not exists uq_entitlements_child_sku on public.entitlements(child_user_id, sku);
create index if not exists idx_entitlements_child on public.entitlements(child_user_id);

-- Purchase requests: child -> parent
create table if not exists public.purchase_requests (
  id uuid primary key default gen_random_uuid(),
  child_user_id uuid not null references public.users(id) on delete cascade,
  parent_user_id uuid not null references public.users(id) on delete cascade,
  sku text not null,
  status text not null default 'requested', -- requested|approved|declined|paid
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_purchase_requests_parent on public.purchase_requests(parent_user_id);
create index if not exists idx_purchase_requests_child on public.purchase_requests(child_user_id);

-- RLS: as in the project, deny direct client access; use service role via Edge Functions.
alter table public.parent_child_links enable row level security;
alter table public.link_invites enable row level security;
alter table public.parent_assessments enable row level security;
alter table public.profession_trials enable row level security;
alter table public.entitlements enable row level security;
alter table public.purchase_requests enable row level security;

create policy "No direct anon access" on public.parent_child_links for all using (false);
create policy "No direct anon access" on public.link_invites for all using (false);
create policy "No direct anon access" on public.parent_assessments for all using (false);
create policy "No direct anon access" on public.profession_trials for all using (false);
create policy "No direct anon access" on public.entitlements for all using (false);
create policy "No direct anon access" on public.purchase_requests for all using (false);

