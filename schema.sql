
-- Gemstone Valley v3 single-table schema
-- Run this entire file in Supabase SQL Editor.

create table if not exists public.game_saves (
  user_id uuid primary key references auth.users(id) on delete cascade,
  username text not null unique check (username ~ '^[a-z0-9_]{3,20}$'),
  display_name text not null check (char_length(display_name) between 2 and 32),
  player_level integer not null default 1 check (player_level >= 1),
  xp numeric not null default 0 check (xp >= 0),
  coins numeric not null default 0 check (coins >= 0),
  game_state jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.game_saves enable row level security;

drop policy if exists "Leaderboard rows are public" on public.game_saves;
create policy "Leaderboard rows are public"
on public.game_saves
for select
using (true);

drop policy if exists "Users insert own player row" on public.game_saves;
create policy "Users insert own player row"
on public.game_saves
for insert
to authenticated
with check ((select auth.uid()) = user_id);

drop policy if exists "Users update own player row" on public.game_saves;
create policy "Users update own player row"
on public.game_saves
for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

grant select on public.game_saves to anon, authenticated;
grant insert, update on public.game_saves to authenticated;

-- Automatically create a player row when a new Auth user is created.
create or replace function public.handle_new_gemstone_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  requested_username text;
  requested_display_name text;
  final_username text;
begin
  requested_username := lower(coalesce(new.raw_user_meta_data ->> 'username', split_part(new.email, '@', 1)));
  requested_username := regexp_replace(requested_username, '[^a-z0-9_]', '_', 'g');
  requested_username := left(requested_username, 20);

  if char_length(requested_username) < 3 then
    requested_username := 'player_' || substr(replace(new.id::text, '-', ''), 1, 8);
  end if;

  final_username := requested_username;

  if exists(select 1 from public.game_saves where username = final_username) then
    final_username := left(requested_username, 11) || '_' || substr(replace(new.id::text, '-', ''), 1, 8);
  end if;

  requested_display_name := coalesce(
    new.raw_user_meta_data ->> 'display_name',
    new.raw_user_meta_data ->> 'username',
    split_part(new.email, '@', 1),
    'Player'
  );

  insert into public.game_saves (
    user_id,
    username,
    display_name,
    player_level,
    xp,
    coins,
    game_state
  )
  values (
    new.id,
    final_username,
    left(requested_display_name, 32),
    1,
    0,
    0,
    '{}'::jsonb
  )
  on conflict (user_id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_gemstone_user_created on auth.users;
create trigger on_gemstone_user_created
after insert on auth.users
for each row execute procedure public.handle_new_gemstone_user();

-- Optional helper for keeping updated_at fresh.
create or replace function public.set_gemstone_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_gemstone_updated_at on public.game_saves;
create trigger set_gemstone_updated_at
before update on public.game_saves
for each row execute procedure public.set_gemstone_updated_at();
