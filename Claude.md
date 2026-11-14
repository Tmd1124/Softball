# CLAUDE.md: Everharris (softball + basketball)

Live at https://everharris.com (HostGator). Softball is built; basketball has its page and data model but no workout tracking yet.

## Stack
- **Front end:** React 19, TypeScript, Vite 8 (multi-page), Tailwind CSS 4, `lucide-react`, `vite-plugin-pwa` (the PWA covers `/softball/workouts/` only).
- **Back end:** PHP 8.1+ and MySQL on HostGator shared hosting, in `public/api/`. No framework, plain PDO.
- **Video pipeline:** Python 3, `setup_assets.py` (moviepy + Pillow) builds the exercise demo MP4s.

## Site map
| URL | Source | Notes |
|---|---|---|
| `/` | `index.html`, `src/pages/home.tsx` | header, hero, sport cards, combined Status and Highlights, footer |
| `/softball/` | `softball/index.html`, `src/pages/softball.tsx` | softball theme |
| `/softball/workouts/` | `softball/workouts/index.html`, `src/pages/workouts.tsx` + `src/App.tsx` | the workout app, needs login |
| `/basketball/` | `basketball/index.html`, `src/pages/basketball.tsx` | basketball theme |
| `/admin/` | `admin/index.html`, `src/pages/admin.tsx` | user management, admin only |
| `/reset/` | `reset/index.html`, `src/pages/reset.tsx` | password reset from the emailed link (`?token=`), or the forgot form without one |

Themes are CSS-variable overrides on `<html class="theme-home|theme-softball|theme-basketball">` in `src/index.css`. Shared page pieces live in `src/site/`.

## Workout app rules (`/softball/workouts/`)
- **Phone first** (375 to 430px): single column in `max-w-md`, fixed bottom tab bar (Schedule, Mobility, History, plus Rebuild Videos for admins), large tap targets (`min-h-12`), dark high-contrast theme with the amber/lime accent.
- **Desktop and tablet** (`md`, 768px and up): sidebar plus two-column card grid, tabs move under the site header, the exercise popup is a centered two-column dialog, the rest timer sits bottom-right.
- **Schedule:** Off-Season (4-day) and In-Season (2-day) toggle, day pills, per-exercise set circles, weight box, a completion checkbox, and a "Watch Form Video & Log Sets" button.
- **Exercise popup:** plays `/softball/videos/<video-id>.mp4` (`playsInline loop muted autoPlay controls`) next to the 3-phase breakdown. If the file is missing it shows the animated form-breakdown card instead.
- **Rest timer:** starts when a set is tapped (per-exercise 60s or 90s), with 60s, 90s, +15s and Skip. **Tempo coach** counts a rep. **Mobility** has an interval timer (45s a side, 30s for the shoulder stretch) with a chime.
- **Saving:** every change is written to the database (see API) and cached in `localStorage`; changes made offline are queued and retried.

## Exercises and videos
- `src/data/exercises.json` is the exercise library (name, focus, tempo, 3 cues). `src/data/workouts.ts` is the program (days, sets, reps, rest, mobility routine).
- **An exercise id is also its video file name:** `trap-bar-deadlift` is `public/softball/videos/trap-bar-deadlift.mp4` and `assets/frames/trap-bar-deadlift_{1,2,3}.png`. An optional `"video"` field overrides this (`goblet-squat-pause`, `half-kneeling-landmine-press` and `hip-switch-couch-stretch` reuse another video; `band-pull-apart-er` has none).
- `src/data/phases.json` (phase titles) and `scripts/image_prompts.json` are written by `setup_assets.py`; do not edit them by hand. Its `EXERCISES` list is the source for the 30 videos.
- **Changing an id** also changes what is stored in `activity_log.exercise_id`. Migrate existing rows before deploying.

## Database (`aycjztte_everharris`)
Tables are created and migrated on first request by `public/api/lib.php`: `users` (email login, role `admin` or `sports`, `must_change_password`), `profiles` (display name, phone, avatar stored as base64 text), `password_resets` (sha256 token hash, 30 minutes, single use), `activity_log` (user, **sport**, date, day, exercise, sets, weight, completed time), `sessions`, `login_attempts`. Softball and basketball rows stay separate through `sport` and are combined only for the home page summary.

## API (`public/api/`)
`auth.php` (login with `remember`, logout, forgot, reset, who am I), `profile.php` (own details, picture, change password), `avatar.php` (own picture), `users.php` (admin only), `activity.php` (log, reset, read by date, dates, summary), `seed_users.php` (CLI only). Rules: roles are enforced on the server; `admin` can do everything, `sports` everything except user management; POSTs need the `X-Requested-With: fetch` header; logins are throttled; passwords are bcrypt; DB sessions last 30 days. Config comes from `public/api/config.php` (gitignored) or `EVERHARRIS_DB_*` environment variables, and the API refuses to run with placeholders.

## Profile and sign-in
The header shows a profile icon (the user's picture, or a default icon) that opens a menu: Log in when signed out; Profile, Manage users (admin) and Log out when signed in. Remember me keeps the session 30 days (cookie `ev_rem`); otherwise it is a browser-session cookie that also expires server-side after 12 hours. Forgot password emails a single-use link through PHP `mail()` (`EVERHARRIS_SITE_URL` sets the link host; `EVERHARRIS_MAIL_LOG` writes mails to a file instead, used by `npm run dev:local`). An admin reset or a new admin-created account sets `must_change_password`, which opens the profile dialog until the user picks their own password. Changing a password signs out the user's other devices.

## Commands
- `npm run dev:local`: PHP :8000 (SQLite in `.local/`) plus Vite :5173. `npm run build`: type-check and build `dist/`. `bash scripts/deploy.sh [--dry-run]`: backup the docroot on the server, then upload over SSH.
- `python setup_assets.py [--ids a b] [--force] [--list]`: rebuild the videos (cross-faded). It never regenerates existing art unless `--force` is given with `--ids`. Replace `assets/frames/<id>_<n>_raw.png` (overlay is re-applied) or `<id>_<n>.png` (used as-is), then run it and deploy. New AI art uses `assets/athlete_ref.png` and needs `OPENAI_API_KEY` in the shell.

## Conventions
- No comments unless the why is non-obvious. Simplest thing that works. American spelling.
- Never commit secrets (`config.php`, `.env.deploy`, `.local/`). `assets/frames/` is gitignored (about 400 MB); the MP4s are committed.
- Before any deploy that changes data, take the dated backup (`scripts/deploy.sh` does for files) and note the rollback path.
- Push to both remotes: `origin` (GitHub `Tmd1124/Softball`) and `azure` (Azure DevOps `EWO360/Softball`).
