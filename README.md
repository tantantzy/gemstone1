# Gemstone Valley — Flat Release

This release has no parent directory and no subdirectories. After extracting the ZIP, all files appear directly in one folder.

## Main files

- `index.html` — complete playable game
- `login.html` — standalone login page
- `signup.html` — standalone account creation page
- `forgot-password.html` — password reset page
- `style.css` — all website and game styling
- `game.js` — idle game logic
- `cloud.js` — in-game Supabase authentication and cloud saving
- `auth.js` — standalone authentication pages
- `schema.sql` — Supabase game-save table and security policies
- `config.example.js` — example only

## Supabase configuration

This ZIP intentionally does **not** contain `config.js`. Keep your existing file, or copy `config.example.js` to `config.js` and add your Supabase project URL and publishable/anon key. Never use the service-role key in browser files.

## GitHub Pages

Upload all extracted files directly to the root of your repository. In GitHub Pages settings, choose **Deploy from a branch**, select `main`, and use the root directory. No `.github` folder is included.
