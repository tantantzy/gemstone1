
-- Run this entire file in Supabase SQL Editor.

create table if not exists public.profiles (
 id uuid primary key references auth.users(id) on delete cascade,
 username text not null unique check (username ~ '^[a-z0-9_]{3,20}$'),
 display_name text not null check (char_length(display_name) between 2 and 32),
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);

create table if not exists public.game_saves (
 user_id uuid primary key references auth.users(id) on delete cascade,
 player_level integer not null default 1 check (player_level >= 1),
 xp numeric not null default 0 check (xp >= 0),
 coins numeric not null default 0 check (coins >= 0),
 game_state jsonb not null default '{}'::jsonb,
 updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.game_saves enable row level security;

drop policy if exists "Public profiles are readable" on public.profiles;
create policy "Public profiles are readable" on public.profiles for select using (true);

drop policy if exists "Users insert own profile" on public.profiles;
create policy "Users insert own profile" on public.profiles for insert to authenticated with check ((select auth.uid()) = id);

drop policy if exists "Users update own profile" on public.profiles;
create policy "Users update own profile" on public.profiles for update to authenticated using ((select auth.uid()) = id) with check ((select auth.uid()) = id);

drop policy if exists "Users read own save" on public.game_saves;
create policy "Users read own save" on public.game_saves for select to authenticated using ((select auth.uid()) = user_id);

drop policy if exists "Users insert own save" on public.game_saves;
create policy "Users insert own save" on public.game_saves for insert to authenticated with check ((select auth.uid()) = user_id);

drop policy if exists "Users update own save" on public.game_saves;
create policy "Users update own save" on public.game_saves for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

grant select on public.profiles to anon, authenticated;
grant insert, update on public.profiles to authenticated;
grant select, insert, update on public.game_saves to authenticated;

create or replace view public.leaderboard as
select p.username,p.display_name,coalesce(g.player_level,1) as player_level,coalesce(g.coins,0) as coins
from public.profiles p
left join public.game_saves g on g.user_id=p.id
order by player_level desc, coins desc;

grant select on public.leaderboard to anon, authenticated;
