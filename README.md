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

## Exercise videos (optional)

Every exercise opens a drawer that plays `public/videos/<exercise-id>.mp4`. If that file does not exist, the drawer shows an animated 3-phase form breakdown instead, so the app is fully usable without any videos.

Exercise ids, names, coaching cues and tempo live in `src/data/exercises.json`. The program (sets, reps, rest, day order) lives in `src/data/workouts.ts`.

```bash
pip install -r scripts/requirements.txt

python scripts/build_videos.py --list                    # which exercises have keyframes
python scripts/build_videos.py                           # build every exercise that has all 3 keyframes
python scripts/build_videos.py tempo-goblet-squat        # build one
python scripts/build_videos.py --force                   # rebuild existing clips
python scripts/build_videos.py --placeholders            # fill missing keyframes with numbered placeholders
```

For each exercise put three keyframes in `assets/frames/`:

```
assets/frames/<exercise-id>_1.png   start / setup
assets/frames/<exercise-id>_2.png   midpoint / pause
assets/frames/<exercise-id>_3.png   finish
```

Any size works; frames are center-cropped to 9:16. Output is 1080x1920 H.264 (`yuv420p`, faststart) with a title banner, a coaching cue bar and a live tempo countdown (for example `3s LOWER → 3s PAUSE → EXPLODE`).

Tempo strings in `exercises.json` look like `"3 LOWER|3 PAUSE|EXPLODE"`. Segment 1 eases frame 1 to frame 2, segment 2 holds frame 2, segment 3 eases frame 2 to frame 3. A segment with no number lasts 1 second.

`--placeholders` clips look like numbered slides. Do not use it for the clips you ship unless you want them to replace the in-app form breakdown.

## Site layout (everharris.com)

| URL | What |
|---|---|
| `/` | Main page: header, hero, sport cards, combined Status and Highlights, footer |
| `/softball/` | Softball page (softball theme): hero, Status, Highlights |
| `/softball/workouts/` | The catcher workout app (PWA, scope limited to this path); needs a login (`sports` or `admin`) |
| `/basketball/` | Basketball page (basketball theme): hero, Status, Highlights (tracking not built yet) |
| `/admin/` | User management, `admin` login only |

Vite multi-page build: `index.html`, `softball/index.html`, `softball/workouts/index.html`, `basketball/index.html`, `admin/index.html`; page entries live in `src/pages/`, shared pieces in `src/site/`. Themes are CSS variable overrides on the `<html>` class (`theme-home`, `theme-softball`, `theme-basketball`) in `src/index.css`.

Images: `public/img/softball.svg` and `basketball.svg` are the header icons; `hero-home.svg`, `hero-softball.svg`, `hero-basketball.svg` are placeholder heroes. Replace them with real images (keep the file names, or change the paths in `src/pages/*.tsx`). Softball exercise videos go in `public/softball/videos/`.

## Data storage (PHP + MySQL)

- One database (`aycjztte_everharris`), tables created automatically on first request by `public/api/lib.php`: `users`, `activity_log` (keyed by user and `sport`, so softball and basketball stay separate but can be combined), `sessions`, `login_attempts`.
- Roles: `admin` can do everything (user management in `api/users.php`, plus all sports features); `sports` can do everything except manage users. Enforced on the server. Sign-in is a PHP session cookie (HttpOnly, SameSite=Lax, 30 days, stored in the DB); POSTs need the `X-Requested-With: fetch` header; logins are throttled (5 failures per user / 20 per IP per 15 minutes); passwords are bcrypt; deactivating a user or resetting their password ends their sessions.
- Logins are email addresses (stored lowercase). Passwords must be 8+ characters.
- Seed the first users once from a shell: set `SEED_ADMIN_EMAIL`, `SEED_ADMIN_PASSWORD`, `SEED_SPORTS_EMAIL`, `SEED_SPORTS_PASSWORD`, then `php api/seed_users.php` (CLI only, skips users that exist). Never write these into a file.
- Config: `public/api/config.php` (gitignored; template in `config.example.php`) or env `EVERHARRIS_DB_DSN`, `EVERHARRIS_DB_USER`, `EVERHARRIS_DB_PASS`. The API refuses to run with placeholders. `api/.htaccess` blocks web access to config, lib and seed files.
- Local testing: `npm run dev:local` starts PHP (:8000, SQLite file `.local/dev.sqlite`, gitignored) and Vite (:5173); open http://localhost:5173. HostGator MySQL is not reachable from outside, so local data is separate from the live site. The first time, create the local accounts with the seed variables above and `EVERHARRIS_DB_DSN=sqlite:<repo>/.local/dev.sqlite php public/api/seed_users.php`.

## Deploy

`bash scripts/deploy.sh [--dry-run]` builds, saves a dated backup of the docroot on the server (`~/backups/everharris-<timestamp>.tgz`), then uploads `dist/` over SSH to `~/public_html/everharris`. It uses the SSH key `~/.ssh/id_ed25519_hostgator` (`ssh -p 2222 aycjztte@50.6.161.39`). Rollback: extract that tarball inside the docroot.

## Pick up here

- State (2026-11-12): deployed to the server docroot `~/public_html/everharris` (backup `~/backups/everharris-20261112-150149.tgz`). Live smoke test passed via https://everharris.com.ayc.jzt.temporary.site (pages, blocked config files, both logins, role checks, data write/read/cleanup). Live users: the admin (`tmd1124@outlook.com`) and the sports user (`ever.harris@outlook.com`).
- Open: public DNS for everharris.com did not resolve on 2026-11-12, so use the temporary URL until it does. Both passwords are weak or reused (the admin password equals the old DB password; the sports password is short and contains the site name): change them in `/admin/`. Rotate the DB password too (it was pasted in chat; update `public/api/config.php` and redeploy). Real hero/header images, basketball tracking, softball keyframes/videos are not done. Old DB `aycjztte_softball`, the empty `workout_log` table in `aycjztte_everharris`, and the old site folder `~/public_html/products/softball` are still on the server (remove only when Travis says so).
- Decisions (Travis, 2026-11-12): logins are email addresses; `admin` can do everything, `sports` everything except user management; "trailer" is the footer; password minimum is 8 characters.
- Remotes: `origin` (GitHub `Tmd1124/Softball`) and `azure` (Azure DevOps `EWO360/Softball`). Push to both.
