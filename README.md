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

## Data storage (PHP + MySQL)

- API: `public/api/index.php` (+ `lib.php`). Table `workout_log` is created automatically on the first request.
- Config: copy `public/api/config.example.php` to `public/api/config.php` (gitignored) and fill in the DB DSN/user/password, or set env vars `SOFTBALL_DB_DSN`, `SOFTBALL_DB_USER`, `SOFTBALL_DB_PASS`. The API refuses to run with placeholder values. `api/.htaccess` blocks web access to config and lib files.
- There is no login. Each browser gets a random athlete key (stored in `localStorage`, sent as `X-Athlete-Key`, hashed with SHA-256 in the DB). Data is per browser; clearing site data or switching phones starts a new log.
- Local dev: `php -S localhost:8000 -t public` in one terminal and `npm run dev` in another (Vite proxies `/api`). HostGator's MySQL is not reachable from outside, so test locally with `SOFTBALL_DB_DSN=sqlite:/path/test.sqlite`.

## Pick up here

- State: six workouts, mobility timer, rest timer, tempo coach, set logger with weight, History tab (pick a date), PHP API, PWA. `npm run build` passes with zero TypeScript errors. API and UI tested end to end locally on SQLite.
- Not done: never run against the real HostGator MySQL `aycjztte_softball` (not deployed yet); no keyframe images/videos; FTP deploy to `everharris.softball.com` (needs the FTP password as an env var).
- Remotes: `origin` (GitHub `Tmd1124/Softball`) and `azure` (Azure DevOps `EWO360/Softball`). Push to both.
