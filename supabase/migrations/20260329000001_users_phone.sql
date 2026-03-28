-- Пользователи по телефону (браузер) и опционально телефон у Telegram-пользователей.

alter table public.users alter column telegram_user_id drop not null;

alter table public.users add column if not exists phone text;
alter table public.users add column if not exists age smallint;

create unique index if not exists uq_users_phone on public.users (phone) where phone is not null;

alter table public.users drop constraint if exists users_phone_or_tg;
alter table public.users add constraint users_phone_or_tg check (
  telegram_user_id is not null or phone is not null
);
