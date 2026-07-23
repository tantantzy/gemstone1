
-- Run this only if you already have the older game_saves table.

alter table public.game_saves
  add column if not exists username text,
  add column if not exists display_name text,
  add column if not exists created_at timestamptz not null default now();

update public.game_saves
set username = coalesce(username, 'player_' || substr(replace(user_id::text, '-', ''), 1, 8)),
    display_name = coalesce(display_name, username, 'Player');

alter table public.game_saves
  alter column username set not null,
  alter column display_name set not null;

create unique index if not exists game_saves_username_unique
on public.game_saves(username);
