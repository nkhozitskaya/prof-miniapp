-- Telegram chat IDs mapping for notifications (filled by bot backend).
create table if not exists public.telegram_chats (
  user_id uuid primary key references public.users(id) on delete cascade,
  chat_id bigint not null,
  updated_at timestamptz not null default now()
);

alter table public.telegram_chats enable row level security;
create policy "No direct anon access" on public.telegram_chats for all using (false);

