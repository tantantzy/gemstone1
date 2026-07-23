# Gemstone Valley v3.0.1 Cache Fix

This release fixes the browser loading the older registration script that still queried `public.profiles`.

## Important upload steps

1. Upload every file in this ZIP to the repository root.
2. Keep your existing `config.js`.
3. Delete the old root-level `auth.js` from GitHub.
4. Confirm the repository contains `auth-v3.js`.
5. Wait for GitHub Pages to redeploy.
6. Open the signup page and press Ctrl+Shift+R.

The HTML pages now load `auth-v3.js?v=3.0.1`, so the old cached authentication code cannot be reused.

# Gemstone Valley v3

This release uses one Supabase table only: `game_saves`.

## Package format

Every file is at the ZIP root. There are no subfolders, no `.github` folder, and no included `config.js`.

Keep your existing root-level `config.js`:

```javascript
window.GEMSTONE_CONFIG = {
  supabaseUrl: "https://YOUR_PROJECT.supabase.co",
  supabaseAnonKey: "YOUR_PUBLISHABLE_OR_ANON_KEY"
};
```

Never place the service-role key in browser code.

## Upgrade instructions

1. Back up your current repository.
2. Extract this ZIP.
3. Copy all extracted files directly into the repository root.
4. Keep your existing `config.js`.
5. Open Supabase → SQL Editor.
6. Run the complete `schema.sql`.
7. Confirm that `public.game_saves` now includes:
   - `user_id`
   - `username`
   - `display_name`
   - `player_level`
   - `xp`
   - `coins`
   - `game_state`
   - `created_at`
   - `updated_at`
8. Enable Email authentication in Supabase.
9. Commit the website files and refresh GitHub Pages with Ctrl+Shift+R.

## Existing game_saves table

The SQL uses `create table if not exists`, which does not add missing columns to an older table. If your current `game_saves` table contains only the old six columns, run this before the rest of the schema:

```sql
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
```

Then run the complete `schema.sql`.

## Registration

Registration now stores username and display name inside Auth metadata. A database trigger automatically creates the corresponding `game_saves` row, including when email confirmation is enabled.

## Included pages

- `index.html`
- `login.html`
- `signup.html`
- `forgot-password.html`
- `reset-password.html`
- `play.html`
- `profile.html`
- `leaderboard.html`
- `settings.html`
- `about.html`

## Included game systems

- Eight gemstone factories
- Three machines per factory
- Machine openings and upgrades
- Factory storage and manual collection
- Production stops when storage is full
- Two collected gemstones grant one XP
- Local and cloud saves
- Offline production
- Public leaderboard
