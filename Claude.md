# CLAUDE.md — Softball Catcher Strength & Mobility Web App

## Project Overview
Build a mobile-first, Progressive Web App (PWA) for a softball catcher's strength, conditioning, and mobility schedule. The app must be ultra-fast, thumb-friendly for one-handed gym use, and deployable as a static website (no external backend database required; persist progress in `localStorage`).

## Tech Stack
- **Framework:** React 18+ with Vite and TypeScript
- **Styling:** Tailwind CSS (mobile-first, dark-mode high-contrast athletic UI)
- **Icons:** `lucide-react`
- **PWA Support:** `vite-plugin-pwa` (manifest + service worker for "Add to Home Screen" mobile install)
- **Video Asset Pipeline:** Python 3 script (`scripts/build_videos.py`) using `moviepy` / `Pillow` to compile 9:16 vertical MP4 demonstration videos from keyframe PNGs in `assets/frames/` into `public/videos/`.

## Mobile-First UI & UX Guardrails
1. **Viewport & Navigation:** Design primarily for mobile screens (`375px` to `430px` width) centered inside a sleek responsive container on desktop (`max-w-md mx-auto`). Use a fixed bottom navigation bar with large tap targets (`min-h-[48px]`).
2. **Gym-Floor Usability:**
   - High-contrast dark slate theme (`bg-slate-950`, cards `bg-slate-900`, primary accent `amber-500` or `emerald-500`) for easy reading under gym lights.
   - Large, unmissable checkboxes to mark sets/exercises complete.
   - Built-in sticky Rest Timer & Tempo Countdown overlay at the bottom of active workout screens.
3. **Video Player Rules:**
   - Every exercise card expands or opens a modal with a looping, muted, auto-playing HTML5 `<video playsInline loop muted>` player (`aspect-[9/16]` or `aspect-video` fallback).
   - If the `.mp4` file in `public/videos/<slug>.mp4` is not yet generated, gracefully render an interactive **3-Phase Form Breakdown Card** (Start -> Midpoint/Pause -> Finish) with animated CSS transitions so the app is 100% functional out of the box before videos are rendered.

## Directory Structure
- `src/data/workouts.ts` — Complete structured dataset for Off-Season (Days 1–4), In-Season (Workouts A & B), and Daily 10-Min Mobility.
- `src/components/` — `BottomNav.tsx`, `DaySchedule.tsx`, `ExerciseCard.tsx`, `VideoPlayerModal.tsx`, `RestTimerBar.tsx`, `MobilityChecklist.tsx`.
- `scripts/build_videos.py` — Standalone Python pipeline to generate 9:16 MP4s with tempo countdown overlays and coaching cues.
- `public/videos/` — Output directory for rendered `.mp4` exercise clips.