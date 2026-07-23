# Gemstone Valley v2

This package is deliberately flat. After extracting, all files appear in one directory.

## Important

This package does **not** contain `config.js`, so it will not overwrite your existing Supabase keys.

Your existing root-level `config.js` must contain:

```javascript
window.GEMSTONE_CONFIG = {
  supabaseUrl: "https://YOUR_PROJECT.supabase.co",
  supabaseAnonKey: "YOUR_PUBLISHABLE_OR_ANON_KEY"
};
```

Never use the service-role key in browser files.

## Install

1. Extract this ZIP.
2. Copy every file directly into the root of your GitHub repository.
3. Keep your existing `config.js`.
4. Run `schema.sql` in Supabase SQL Editor.
5. Enable Email authentication in Supabase.
6. Set the Supabase Site URL to your GitHub Pages URL.
7. Commit and push the files.
8. Refresh the published site with Ctrl+Shift+R.

## Pages

- `index.html` — landing page
- `login.html` — sign in
- `signup.html` — player registration
- `forgot-password.html` — request reset email
- `reset-password.html` — choose a new password
- `play.html` — full factory game
- `profile.html` — player profile and cloud statistics
- `leaderboard.html` — public rankings
- `settings.html` — local preferences
- `about.html` — project information

## Game Features

- Eight factories
- Three machines per factory
- Individual upgrades and machine openings
- Factory storage and manual collection
- Production pauses when storage is full
- Two collected gems grant one XP
- Player levels, coins, selling, and unlock requirements
- Local saves and offline progress
- Supabase accounts and cloud saves
- Automatic cloud backup every 30 seconds
