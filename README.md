# Gemstone Valley v5 — Depleting Mine Capacity

- Press Start Mining.
- Mine capacity decreases according to gems per second.
- The same amount becomes Ready to Collect.
- At zero capacity, mining stops.
- Press Mine Again to refill the level-based capacity and start a new run.
- Machine upgrades increase speed and maximum capacity.
- Store buying and selling remains available.

# Gemstone Valley v4 — Manual Mining Cycles

Factories no longer mine continuously.

## New cycle

1. Press **Run Mine** on a factory.
2. The factory mines automatically.
3. It stops at its level-based maximum batch capacity.
4. Press **Collect** to move the batch into inventory and receive XP.
5. The factory remains idle.
6. Press **Run Mine** again for the next batch.

Machine upgrades increase production speed and maximum batch capacity. A running factory may continue while the player is offline, but it stops as soon as its batch is full.

The 24-hour Auto Collect mechanic has been removed.

# Gemstone Valley v3.4 — Account Isolation & Auto Collect Fix

## Critical fixes

### Separate progress for every account

Local browser saves are now stored using the authenticated Supabase user ID:

```text
gemValleyCompact:<SUPABASE_USER_ID>
```

A newly created account no longer reads or uploads another account's local progress.

The old shared key `gemValleyCompact` is intentionally ignored.

### Auto Collect repaired

The production loop previously called a nonexistent `storageCap()` function. The correct function is `storageCapacity()`. That error stopped the mining timer and prevented Auto Collect from running.

This release:

- Uses the correct storage-capacity function.
- Checks all unlocked factories every production tick.
- Automatically clears full storage while Auto Collect is active.
- Immediately resumes mining after collection.
- Handles floating-point capacity values safely.
- Applies Auto Collect during offline production when the reward is still active.

## Upload instructions

1. Upload every file to the repository root.
2. Keep your existing `config.js`.
3. Wait for GitHub Pages to deploy.
4. Refresh with Ctrl+Shift+R.
5. Sign out and sign into each account once.

Each account will now create its own local save and use only its own Supabase `game_saves` row.

# Gemstone Valley v3.3 — Auto Collect Production Fix

## Fixed

- Auto Collect now checks every unlocked factory before production.
- Factories that are already full are cleared immediately.
- Production room is recalculated after automatic collection.
- Factories resume mining in the same tick after being emptied.
- A factory that becomes full during a production tick is collected immediately.
- Activating Auto Collect immediately clears every already-full unlocked factory.
- Manual collection refreshes the full factory interface, preventing other factories from appearing stopped.

# Gemstone Valley v3.2 — 24-Hour Auto Collect

The left-side reward now activates **Auto Collect for 24 hours**.

During the active period:

- Every unlocked factory continues mining normally.
- When any factory reaches full storage capacity, its stored gems are automatically moved to inventory.
- XP is awarded automatically using the normal rule: 2 collected gems = 1 XP.
- The emptied factory immediately resumes production.
- The reward button shows the remaining active time.
- The reward can be activated again after the 24-hour period ends.

# Gemstone Valley v3.1 — Daily Reward & Mobile Navigation Fix

## New in this release

- Added a left-side Daily Reward button.
- The reward becomes available every 24 hours.
- Claiming grants coins plus gems from the highest unlocked factory.
- The countdown updates automatically.
- Fixed bottom navigation alignment on mobile.
- Ranks, Factory, Profile, and Save now use equal-width cells with centered icons and labels.
- Added safe-area spacing for phones with gesture/navigation bars.

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
