import { useEffect, useState } from 'react'
import { CheckCircle2, XCircle } from 'lucide-react'
import phases from '../data/phases.json'
import { getExercise } from '../data/workouts'

const IDS = Object.keys(phases)

const nameOf = (id: string) => {
  try {
    return getExercise(id).name
  } catch {
    return id
  }
}

const COMMANDS = `pip install -r scripts/requirements.txt

python setup_assets.py                       # rebuild every video
python setup_assets.py --ids landmine-press  # rebuild one
python setup_assets.py --list                # show what exists`

export default function RebuildVideos() {
  const [present, setPresent] = useState<Record<string, boolean> | null>(null)

  useEffect(() => {
    let live = true
    Promise.all(
      IDS.map((id) =>
        fetch(`/softball/videos/${id}.mp4`, { method: 'HEAD', cache: 'no-store' })
          .then((r) => [id, r.ok && (r.headers.get('content-type') ?? '').startsWith('video')] as const)
          .catch(() => [id, false] as const),
      ),
    ).then((rows) => live && setPresent(Object.fromEntries(rows)))
    return () => {
      live = false
    }
  }, [])

  const have = present ? IDS.filter((id) => present[id]).length : 0

  return (
    <div className="px-4 pb-32 pt-5 md:px-6">
      <h1 className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Admin</h1>
      <h2 className="mt-1 text-2xl font-bold tracking-tight text-slate-50">Rebuild Videos</h2>
      <p className="mt-1 text-sm text-slate-400">
        Demo videos are built on your computer from the images in <code className="text-slate-200">assets/frames/</code>,
        then deployed with the site. This page checks what is live and shows the commands.
      </p>

      <div className="mt-5 grid gap-6 md:grid-cols-2">
        <section aria-label="Commands" className="space-y-4">
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">Run in the project folder</p>
            <pre className="mt-2 overflow-x-auto rounded-xl bg-slate-950 p-3 text-xs leading-relaxed text-slate-200">{COMMANDS}</pre>
          </div>
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4 text-sm leading-relaxed text-slate-300">
            <p className="font-bold text-slate-50">Swapping in new images</p>
            <ul className="mt-2 list-disc space-y-1.5 pl-5">
              <li>
                Replace <code className="text-slate-200">assets/frames/&lt;id&gt;_1_raw.png</code> (also <code>_2</code>,{' '}
                <code>_3</code>): the title, cue and tempo overlay is added for you.
              </li>
              <li>
                Or replace <code className="text-slate-200">assets/frames/&lt;id&gt;_1.png</code> to use your finished frame exactly
                as it is.
              </li>
              <li>Existing images are never regenerated. Re-running only rebuilds the overlays and the MP4s.</li>
              <li>
                New art is made from your athlete photo and needs <code className="text-slate-200">OPENAI_API_KEY</code> set in
                your shell before running.
              </li>
              <li>
                Then publish with <code className="text-slate-200">bash scripts/deploy.sh</code>.
              </li>
            </ul>
          </div>
        </section>

        <section aria-label="Video status" className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
          <div className="flex items-baseline justify-between">
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">Live on this site</p>
            <p className="text-sm font-semibold tabular-nums text-slate-300">
              {present ? `${have}/${IDS.length}` : 'Checking…'}
            </p>
          </div>
          <ul className="mt-3 divide-y divide-slate-800">
            {IDS.map((id) => (
              <li key={id} className="flex items-center gap-3 py-2">
                {present === null ? (
                  <span className="h-5 w-5 shrink-0 rounded-full border border-slate-700" aria-hidden />
                ) : present[id] ? (
                  <CheckCircle2 size={20} className="shrink-0 text-emerald-500" aria-label="Present" />
                ) : (
                  <XCircle size={20} className="shrink-0 text-red-400" aria-label="Missing" />
                )}
                <span className="min-w-0 flex-1 truncate text-sm font-semibold text-slate-100">{nameOf(id)}</span>
                <code className="hidden shrink-0 text-xs text-slate-500 sm:inline">{id}.mp4</code>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  )
}
