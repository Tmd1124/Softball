#!/usr/bin/env python3
"""Compile 9:16 (1080x1920) H.264 exercise clips from keyframe PNGs.

Reads  assets/frames/{exercise_id}_1.png, _2.png, _3.png
Writes public/videos/{exercise_id}.mp4

Exercise names, coaching cues and tempo come from src/data/exercises.json,
the same file the web app uses, so the video and the app never disagree.

Tempo strings look like "3 LOWER|3 PAUSE|EXPLODE" and map onto the keyframes:
  segment 1 eases frame 1 -> frame 2, segment 2 holds frame 2,
  segment 3 eases frame 2 -> frame 3.
"""
from __future__ import annotations

import argparse
import json
import math
import sys
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

try:
    from moviepy import VideoClip
except ImportError:  # moviepy 1.x
    from moviepy.editor import VideoClip  # type: ignore

ROOT = Path(__file__).resolve().parent.parent
W, H = 1080, 1920
TOP_H = 250
BOTTOM_H = 520

AMBER = (245, 158, 11)
WHITE = (248, 250, 252)
MUTED = (148, 163, 184)
INK = (2, 6, 23)

PHASE_TITLES = {
    "strength": ("Stance / Setup", "Eccentric / Pause", "Explosive Finish"),
    "mobility": ("Start", "Hold / Reach", "Return"),
}

FONT_CANDIDATES = [
    "C:/Windows/Fonts/segoeuib.ttf",
    "C:/Windows/Fonts/arialbd.ttf",
    "/System/Library/Fonts/Supplemental/Arial Bold.ttf",
    "/Library/Fonts/Arial Bold.ttf",
    "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
    "/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf",
]
_font_path: str | None = None
_font_cache: dict[int, ImageFont.FreeTypeFont | ImageFont.ImageFont] = {}


def font(size: int):
    global _font_path
    if size in _font_cache:
        return _font_cache[size]
    if _font_path is None:
        _font_path = next((p for p in FONT_CANDIDATES if Path(p).exists()), "")
    try:
        f = ImageFont.truetype(_font_path, size) if _font_path else ImageFont.load_default(size)
    except OSError:
        f = ImageFont.load_default(size)
    _font_cache[size] = f
    return f


def parse_tempo(tempo: str) -> list[tuple[str, float | None]]:
    segs = []
    for part in tempo.split("|"):
        part = part.strip()
        head, _, rest = part.partition(" ")
        if head.isdigit() and rest:
            segs.append((rest, float(head)))
        else:
            segs.append((part, None))
    return segs


def tempo_text(label: str, seconds: float | None) -> str:
    return label if seconds is None else f"{int(seconds)}s {label}"


def wrap(draw: ImageDraw.ImageDraw, text: str, f, max_w: int) -> list[str]:
    lines, cur = [], ""
    for word in text.split():
        trial = f"{cur} {word}".strip()
        if draw.textlength(trial, font=f) <= max_w:
            cur = trial
        else:
            lines.append(cur)
            cur = word
    if cur:
        lines.append(cur)
    return lines


def cover(img: Image.Image) -> Image.Image:
    img = img.convert("RGB")
    scale = max(W / img.width, H / img.height)
    img = img.resize((math.ceil(img.width * scale), math.ceil(img.height * scale)), Image.LANCZOS)
    left, top = (img.width - W) // 2, (img.height - H) // 2
    return img.crop((left, top, left + W, top + H))


def make_placeholders(ex_id: str, ex: dict, frames_dir: Path) -> None:
    titles = PHASE_TITLES[ex["category"]]
    for i in range(3):
        path = frames_dir / f"{ex_id}_{i + 1}.png"
        if path.exists():
            continue
        im = Image.new("RGB", (W, H), (15, 23, 42))
        d = ImageDraw.Draw(im)
        shade = 30 + i * 18
        d.rectangle([0, H // 2 - 330, W, H // 2 + 330], fill=(shade, shade + 10, shade + 28))
        d.text((W / 2, H / 2 - 60), str(i + 1), font=font(420), fill=AMBER, anchor="mm")
        d.text((W / 2, H / 2 + 240), titles[i], font=font(76), fill=WHITE, anchor="mm")
        im.save(path)


def build_overlay(ex: dict, seg_idx: int, remaining: int, segs, titles) -> Image.Image:
    ov = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(ov)

    d.rectangle([0, 0, W, TOP_H], fill=(2, 6, 23, 215))
    d.rectangle([0, TOP_H - 6, W, TOP_H], fill=AMBER + (255,))
    name_font = font(66)
    name = ex["name"]
    while d.textlength(name, font=name_font) > W - 100 and name_font.size > 38:
        name_font = font(name_font.size - 4)
    d.text((W / 2, 112), name, font=name_font, fill=WHITE, anchor="mm")
    d.text((W / 2, 188), f"STEP {seg_idx + 1} OF {len(segs)}  ·  {titles[min(seg_idx, 2)].upper()}",
           font=font(36), fill=AMBER, anchor="mm")

    d.rectangle([0, H - BOTTOM_H, W, H], fill=(2, 6, 23, 225))
    cue = ex["cues"][min(seg_idx, 2)]
    cue_font = font(46)
    y = H - BOTTOM_H + 56
    for line in wrap(d, cue, cue_font, W - 140)[:4]:
        d.text((W / 2, y), line, font=cue_font, fill=WHITE, anchor="mt")
        y += 62

    labels = [tempo_text(lbl, sec) for lbl, sec in segs]
    tf = font(40)
    sep = "   →   "
    full = sep.join(labels)
    x = (W - d.textlength(full, font=tf)) / 2
    ty = H - 92
    for i, lbl in enumerate(labels):
        colour = AMBER if i == seg_idx else MUTED
        d.text((x, ty), lbl, font=tf, fill=colour, anchor="lm")
        x += d.textlength(lbl, font=tf)
        if i < len(labels) - 1:
            d.text((x, ty), sep, font=tf, fill=MUTED, anchor="lm")
            x += d.textlength(sep, font=tf)

    cx, cy, r = W - 150, H - BOTTOM_H - 150, 100
    d.ellipse([cx - r, cy - r, cx + r, cy + r], fill=(2, 6, 23, 230), outline=AMBER + (255,), width=8)
    d.text((cx, cy - 6), str(remaining), font=font(120), fill=WHITE, anchor="mm")
    lbl, _sec = segs[seg_idx]
    d.text((cx, cy - r - 36), lbl, font=font(44), fill=AMBER, anchor="mm")
    return ov


def render(ex_id: str, ex: dict, frames_dir: Path, out_path: Path, fps: int) -> None:
    frames = [cover(Image.open(frames_dir / f"{ex_id}_{i}.png")) for i in (1, 2, 3)]
    segs = parse_tempo(ex["tempo"])
    durs = [s if s is not None else 1.0 for _, s in segs]
    starts = [sum(durs[:i]) for i in range(len(durs))]
    total = sum(durs)
    titles = PHASE_TITLES[ex["category"]]

    overlays: dict[tuple[int, int], Image.Image] = {}
    held: dict[tuple[int, int, int], "Image.Image"] = {}

    def frame_at(t: float):
        t = min(max(t, 0.0), total - 1e-6)
        idx = max(i for i, s in enumerate(starts) if s <= t)
        local = t - starts[idx]
        remaining = max(1, math.ceil(durs[idx] - local))

        if idx == 0:
            a, b, p = 0, 1, local / durs[idx]
        elif idx == len(segs) - 1 and len(segs) > 2:
            a, b, p = 1, 2, min(1.0, local / (durs[idx] * 0.7))
        else:
            a, b, p = 1, 1, 0.0
        p = p * p * (3 - 2 * p)

        key = (idx, remaining)
        if a == b:
            hold_key = (idx, remaining, a)
            if hold_key in held:
                return held[hold_key]
        if key not in overlays:
            overlays[key] = build_overlay(ex, idx, remaining, segs, titles)
        base = frames[a] if a == b else Image.blend(frames[a], frames[b], p)
        out = base.convert("RGBA")
        out.alpha_composite(overlays[key])
        arr = out.convert("RGB")
        if a == b:
            held[(idx, remaining, a)] = arr
        return arr

    import numpy as np

    clip = VideoClip(lambda t: np.asarray(frame_at(t)), duration=total)
    out_path.parent.mkdir(parents=True, exist_ok=True)
    clip.write_videofile(
        str(out_path),
        fps=fps,
        codec="libx264",
        audio=False,
        preset="medium",
        ffmpeg_params=["-pix_fmt", "yuv420p", "-crf", "23", "-movflags", "+faststart"],
        logger=None,
    )
    clip.close()


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("ids", nargs="*", help="exercise ids to build (default: all with frames)")
    ap.add_argument("--frames", type=Path, default=ROOT / "assets" / "frames")
    ap.add_argument("--out", type=Path, default=ROOT / "public" / "videos")
    ap.add_argument("--data", type=Path, default=ROOT / "src" / "data" / "exercises.json")
    ap.add_argument("--fps", type=int, default=24)
    ap.add_argument("--force", action="store_true", help="rebuild clips that already exist")
    ap.add_argument("--placeholders", action="store_true",
                    help="generate numbered placeholder keyframes for any that are missing")
    ap.add_argument("--list", action="store_true", help="list exercise ids and frame status, then exit")
    args = ap.parse_args()

    exercises = json.loads(args.data.read_text(encoding="utf-8"))
    unknown = [i for i in args.ids if i not in exercises]
    if unknown:
        print(f"Unknown exercise id(s): {', '.join(unknown)}", file=sys.stderr)
        return 2
    ids = args.ids or list(exercises)

    def have_frames(i: str) -> bool:
        return all((args.frames / f"{i}_{n}.png").exists() for n in (1, 2, 3))

    if args.list:
        for i in ids:
            print(f"{'ok     ' if have_frames(i) else 'missing'}  {i}")
        return 0

    args.frames.mkdir(parents=True, exist_ok=True)
    built, skipped, missing = 0, 0, []
    for i in ids:
        out = args.out / f"{i}.mp4"
        if args.placeholders:
            make_placeholders(i, exercises[i], args.frames)
        if not have_frames(i):
            missing.append(i)
            continue
        if out.exists() and not args.force:
            skipped += 1
            continue
        print(f"Rendering {i} ...", flush=True)
        render(i, exercises[i], args.frames, out, args.fps)
        built += 1

    print(f"\nBuilt {built}, skipped {skipped} existing, {len(missing)} missing frames.")
    if missing:
        print(f"Add {args.frames}/<id>_1.png, _2.png, _3.png for: {', '.join(missing)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
