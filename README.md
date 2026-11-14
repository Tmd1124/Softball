# Catcher Strength & Mobility

Mobile-first PWA for a softball catcher's off-season (4-day split) and in-season (2-day) strength schedule plus a daily 10-minute mobility routine. Static front end plus a small PHP/MySQL API (`public/api/`). Each exercise log stores the day, exercise, sets, weight (lb) and the time it was completed; the History tab shows any date. A copy is cached in `localStorage`, and changes made offline are queued and retried.

Stack: React 19, Vite 8, TypeScript, Tailwind CSS 4, `lucide-react`, `vite-plugin-pwa`.

## Run it

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # type-checks, then writes the static site to dist/
npm run preview    # serve dist/ locally to test the PWA / service worker
```

Upload the contents of `dist/` to any static host. Install it on a phone with "Add to Home Screen".

## Exercise videos

Every exercise opens a popup that plays `public/softball/videos/<id>.mp4` next to its 3-phase breakdown. If a file is missing, the popup shows an animated form-breakdown card, so the app works without videos. An exercise id is also its video file name; `src/data/exercises.json` can point an exercise at another video with `"video"` (or `null` for none).

```bash
pip install -r scripts/requirements.txt
python setup_assets.py                        # rebuild all 30 videos
python setup_assets.py --ids landmine-press   # rebuild one
python setup_assets.py --list                 # show what exists
```

`setup_assets.py` reads `assets/frames/<id>_<n>_raw.png`, adds the title, coaching cue and tempo as `<id>_<n>.png`, and writes `public/softball/videos/<id>.mp4` (1080x1920 H.264, 3 frames cross-faded, about 5 s). It never regenerates art that already exists (`--force` with `--ids` does, and costs API credits). To use your own images, replace a `_raw.png` (the overlay is re-applied) or a finished `<id>_<n>.png` (used exactly as it is). Missing art is generated from `assets/athlete_ref.png` with OpenAI; set `OPENAI_API_KEY` in your shell, never in the file. `assets/frames/` is gitignored (about 400 MB); the MP4s are committed. Admins also see a **Rebuild Videos** tab in the workout app that shows which videos are live and these commands.

## Site layout (everharris.com)

| URL | What |
|---|---|
| `/` | Main page: header, hero, sport cards, combined Status and Highlights, footer |
| `/softball/` | Softball page (softball theme): hero, Status, Highlights |
| `/softball/workouts/` | The catcher workout app (PWA, scope limited to this path); needs a login (`sports` or `admin`) |
| `/basketball/` | Basketball page (basketball theme): hero, Status, Highlights (tracking not built yet) |
| `/admin/` | User management, `admin` login only |

Vite multi-page build: `index.html`, `softball/index.html`, `softball/workouts/index.html`, `basketball/index.html`, `admin/index.html`; page entries live in `src/pages/`, shared pieces in `src/site/`. Themes are CSS variable overrides on the `<html>` class (`theme-home`, `theme-softball`, `theme-basketball`) in `src/index.css`.

Images: `public/img/softball.svg` and `basketball.svg` are the header icons; `hero-home.svg`, `hero-softball.svg`, `hero-basketball.svg` are placeholder heroes. Replace them with real images (keep the file names, or change the paths in `src/pages/*.tsx`). Softball exercise videos live in `public/softball/videos/`.

## Data storage (PHP + MySQL)

- One database (`aycjztte_everharris`), tables created automatically on first request by `public/api/lib.php`: `users`, `activity_log` (keyed by user and `sport`, so softball and basketball stay separate but can be combined), `sessions`, `login_attempts`.
- Roles: `admin` can do everything (user management in `api/users.php`, plus all sports features); `sports` can do everything except manage users. Enforced on the server. Sign-in is a PHP session cookie (HttpOnly, SameSite=Lax, 30 days, stored in the DB); POSTs need the `X-Requested-With: fetch` header; logins are throttled (5 failures per user / 20 per IP per 15 minutes); passwords are bcrypt; deactivating a user or resetting their password ends their sessions.
- Logins are email addresses (stored lowercase). Passwords must be 8+ characters.
- Seed the first users once from a shell: set `SEED_ADMIN_EMAIL`, `SEED_ADMIN_PASSWORD`, `SEED_SPORTS_EMAIL`, `SEED_SPORTS_PASSWORD`, then `php api/seed_users.php` (CLI only, skips users that exist). Never write these into a file.
- Config: `public/api/config.php` (gitignored; template in `config.example.php`) or env `EVERHARRIS_DB_DSN`, `EVERHARRIS_DB_USER`, `EVERHARRIS_DB_PASS`. The API refuses to run with placeholders. `api/.htaccess` blocks web access to config, lib and seed files.
- Local testing: `npm run dev:local` starts PHP (:8000, SQLite file `.local/dev.sqlite`, gitignored) and Vite (:5173); open http://localhost:5173. HostGator MySQL is not reachable from outside, so local data is separate from the live site. The first time, create the local accounts with the seed variables above and `EVERHARRIS_DB_DSN=sqlite:<repo>/.local/dev.sqlite php public/api/seed_users.php`.

## Profile, remember me and password reset

The header profile icon opens Log in, or Profile and Log out. The profile dialog edits name and phone, sets a picture (cropped to 256 px and stored in the `profiles` table) and changes the password. Login has Remember me (30 days) and Forgot password: an emailed single-use link (30 minutes) to `/reset/`, with admin reset in `/admin/` as the fallback (the user is then asked to choose their own password). Mail is sent with PHP `mail()` from `no-reply@everharris.com`; `EVERHARRIS_MAIL_LOG` logs mails to a file for local testing, and `EVERHARRIS_SITE_URL` sets the link host. Schema changes (`must_change_password`, `profiles`, `password_resets`) are applied automatically on the first request after a deploy.

## Deploy

`bash scripts/deploy.sh [--dry-run]` builds, saves a dated backup of the docroot on the server (`~/backups/everharris-<timestamp>.tgz`), then uploads `dist/` over SSH to `~/public_html/everharris`. It uses the SSH key `~/.ssh/id_ed25519_hostgator` (`ssh -p 2222 aycjztte@50.6.161.39`). Rollback: extract that tarball inside the docroot.

## Pick up here

- State (2026-11-13): live at https://everharris.com (DNS and HTTPS work). Last deploy backup: `~/backups/everharris-20261113-185857.tgz`. All 30 cross-faded exercise videos are live (checked byte for byte), pushed to both remotes as `4e678ea`. Smoke test passed: home, softball, workouts, API. Live users: the admin (`tmd1124@outlook.com`) and the sports user (`ever.harris@outlook.com`). The live DB held only test data when the exercise ids were renamed, so nothing was migrated.
- Videos: rebuild with `python setup_assets.py` (see Video pipeline). The service worker caches videos under the name in `vite.config.ts` (`videos-2026-11-13b`); change it whenever MP4s are replaced, or installed phones keep the old ones. Videos are about 54 MB in total, 1.8 MB each.
- State (2026-11-13, later): profile icon menu, profile dialog, picture, change password, remember me, forgot/reset password are live (backups: files `~/backups/everharris-20261113-191923.tgz`, DB `~/backups/db-20261113-181913.sql.gz` on the server; schema migrated, checked). Tested locally and smoke-tested live; the reset email has not been tried live yet: ask for a reset to your own address and check the inbox and spam (HostGator `mail()` is untested; set up SPF/DKIM if it does not arrive).
- Previously uncommitted: wording fixes in `README.md`, `Claude.md` and `RebuildVideos.tsx` (no more Replicate mention). Needs a build, deploy, commit and push.
- Open: the OpenAI key that was hardcoded in an old `setup_assets.py` must be rotated (a copy is still in the Claude scratchpad, delete it). Both account passwords are weak or reused (the admin password equals the old DB password; the sports password is short and contains the site name): change them in `/admin/`. Rotate the DB password too (it was pasted in chat; update `public/api/config.php` and redeploy). Avast HTTPS scanning can show "Not secure" on Travis's PC; add an exception for everharris.com. Real hero/header images (`assets/Ever_Image.png`, `Ever Image.jpg` are committed but not used on the pages yet) and basketball tracking are not done. Old DB `aycjztte_softball`, the empty `workout_log` table in `aycjztte_everharris`, and the old site folder `~/public_html/products/softball` are still on the server (remove only when Travis says so).
- Decisions (Travis): logins are email addresses; `admin` can do everything, `sports` everything except user management; "trailer" is the footer; password minimum is 8 characters (2026-11-12). Videos are rebuilt with larger overlay text and a crossfade; the stray `public/videos/` folder was deleted locally and on the server (2026-11-13).
- Remotes: `origin` (GitHub `Tmd1124/Softball`) and `azure` (Azure DevOps `EWO360/Softball`). Push to both.
