import { useEffect, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { HelpCircle, Printer, Send, Trash2, X } from 'lucide-react'
import { ApiError, api } from '../lib/api'
import { HELP } from './helpContent'

interface Msg {
  role: 'user' | 'assistant'
  content: string
}

const SUGGESTIONS = [
  'Create a printable scouting report for Ever',
  'What are Ever’s verified measurables?',
  'Where will Ever play next?',
  'How do I contact Ever’s coaches?',
]

const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!)

function printConversation(msgs: Msg[], ai: boolean) {
  const w = window.open('', '_blank')
  if (!w) return
  const body = msgs
    .map((m) => `<section class="${m.role}"><h2>${m.role === 'user' ? 'Question' : 'Answer'}</h2><p>${esc(m.content)}</p></section>`)
    .join('')
  w.document.write(`<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Ever Harris – Recruiting Q&amp;A</title>
<style>body{font:14px/1.5 system-ui,Arial,sans-serif;color:#111;max-width:7.5in;margin:0.5in auto;padding:0 12px}h1{font-size:22px;margin:0}
.meta{color:#555;margin:2px 0 16px;border-bottom:2px solid #111;padding-bottom:8px}h2{font-size:11px;text-transform:uppercase;letter-spacing:.08em;color:#555;margin:14px 0 2px}
p{margin:0;white-space:pre-wrap}.user p{font-weight:700}.note{margin-top:24px;border-top:1px solid #aaa;padding-top:8px;color:#555;font-size:12px}
@media print{body{margin:0}}</style></head><body>
<h1>Ever Harris, Class of 2031</h1><p class="meta">Recruiting Q&amp;A · ${esc(new Date().toLocaleDateString(undefined, { dateStyle: 'long' }))} · everharris.com</p>${body}
<p class="note">${ai ? 'Answers are generated from the profile published at everharris.com. ' : ''}Please confirm details with Ever’s recruiting contact listed on the site.</p>
<script>window.onload=function(){window.print()}<\/script></body></html>`)
  w.document.close()
}

export default function Assistant({ helpKey, lift = false, startOn }: { helpKey: string; lift?: boolean; startOn: 'ask' | 'help' }) {
  const [open, setOpen] = useState(false)
  const [tab, setTab] = useState<'ask' | 'help'>(startOn)
  const [msgs, setMsgs] = useState<Msg[]>([])
  const [text, setText] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [ai, setAi] = useState(true)
  const end = useRef<HTMLDivElement>(null)
  const topic = HELP[helpKey] ?? HELP.home

  useEffect(() => {
    end.current?.scrollIntoView({ block: 'end' })
  }, [msgs, busy, open, tab])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  const ask = async (q: string) => {
    const question = q.trim()
    if (!question || busy) return
    const next: Msg[] = [...msgs, { role: 'user', content: question }]
    setMsgs(next)
    setText('')
    setBusy(true)
    setError('')
    try {
      const r = await api<{ reply: string; ai: boolean }>('chat.php', { messages: next.slice(-11) })
      setAi(r.ai)
      setMsgs([...next, { role: 'assistant', content: r.reply }])
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Could not reach the server. Check your connection and try again.')
    } finally {
      setBusy(false)
    }
  }

  const submit = (e: FormEvent) => {
    e.preventDefault()
    void ask(text)
  }

  const tabBtn = (id: 'ask' | 'help', label: string) => (
    <button
      type="button"
      role="tab"
      aria-selected={tab === id}
      onClick={() => setTab(id)}
      className="min-h-12 flex-1 text-sm font-bold text-slate-300 aria-selected:border-b-2 aria-selected:border-amber-500 aria-selected:text-amber-400"
    >
      {label}
    </button>
  )

  return (
    <div className="no-print">
      {!open && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Open help and questions"
          title="Ask a question or get help"
          className={`fixed right-4 z-40 flex h-16 w-16 items-center justify-center rounded-full bg-amber-500 text-4xl leading-none shadow-lg shadow-black/40 transition-transform hover:scale-105 active:scale-95 active:bg-amber-400 ${lift ? 'bottom-24' : 'bottom-4'}`}
        >
          <span aria-hidden>🤖</span>
        </button>
      )}
      {open && (
        <section
          role="dialog"
          aria-label="Help and questions"
          className="sheet-up fixed inset-x-2 bottom-2 z-50 flex h-[min(34rem,calc(100dvh-1rem))] flex-col overflow-hidden rounded-3xl border border-slate-700 bg-slate-900 shadow-2xl shadow-black/60 sm:inset-x-auto sm:right-4 sm:bottom-4 sm:w-[24rem]"
        >
          <div className="flex items-center border-b border-slate-800 pl-4">
            <div role="tablist" className="flex flex-1">
              {tabBtn('ask', 'Ask about Ever')}
              {tabBtn('help', 'Help')}
            </div>
            <button type="button" onClick={() => setOpen(false)} aria-label="Close" className="flex h-12 w-12 items-center justify-center text-slate-300 active:bg-slate-800">
              <X size={20} aria-hidden />
            </button>
          </div>

          {tab === 'help' ? (
            <div className="flex-1 overflow-y-auto p-4">
              <p className="flex items-center gap-2 text-lg font-extrabold text-slate-50">
                <HelpCircle size={20} className="text-amber-400" aria-hidden /> {topic.title}
              </p>
              <ul className="mt-3 list-disc space-y-3 pl-5 text-sm leading-relaxed text-slate-200">
                {topic.tips.map((t) => (
                  <li key={t}>{t}</li>
                ))}
              </ul>
              <button type="button" onClick={() => setTab('ask')} className="mt-5 min-h-12 rounded-full border border-slate-600 px-5 text-sm font-bold text-slate-100 active:bg-slate-800">
                Ask a question instead
              </button>
            </div>
          ) : (
            <>
              <div className="flex-1 space-y-3 overflow-y-auto p-4 text-sm" aria-live="polite">
                {msgs.length === 0 && (
                  <>
                    <p className="leading-relaxed text-slate-300">
                      Ask anything about Ever Harris’s recruiting profile. Answers come only from what is published on this site, and you can print them.
                    </p>
                    <div className="flex flex-col gap-2">
                      {SUGGESTIONS.map((s) => (
                        <button key={s} type="button" onClick={() => void ask(s)} className="min-h-12 rounded-2xl border border-slate-700 px-4 text-left font-semibold text-slate-100 active:bg-slate-800">
                          {s}
                        </button>
                      ))}
                    </div>
                  </>
                )}
                {msgs.map((m, i) => (
                  <p
                    key={i}
                    className={`whitespace-pre-wrap rounded-2xl p-3 leading-relaxed ${m.role === 'user' ? 'ml-8 bg-amber-500 font-semibold text-slate-950' : 'mr-4 bg-slate-800 text-slate-100'}`}
                  >
                    {m.content}
                  </p>
                ))}
                {busy && <p className="text-slate-400">Looking through Ever’s profile…</p>}
                {error && (
                  <p role="alert" className="rounded-xl border border-red-500/50 bg-red-500/10 p-3 text-red-200">
                    {error}
                  </p>
                )}
                <div ref={end} />
              </div>
              {msgs.length > 0 && (
                <div className="flex flex-wrap gap-2 border-t border-slate-800 px-4 py-2">
                  {msgs.some((m) => m.role === 'assistant') && (
                    <button type="button" onClick={() => printConversation(msgs, ai)} aria-label="Print this conversation" className="inline-flex min-h-12 items-center gap-2 rounded-full border border-slate-600 px-4 text-sm font-bold text-slate-100 active:bg-slate-800">
                      <Printer size={16} aria-hidden /> Print
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      setMsgs([])
                      setError('')
                      setText('')
                    }}
                    className="inline-flex min-h-12 items-center gap-2 rounded-full border border-slate-600 px-4 text-sm font-bold text-slate-100 active:bg-slate-800"
                  >
                    <Trash2 size={16} aria-hidden /> Clear conversation
                  </button>
                </div>
              )}
              <form onSubmit={submit} className="flex gap-2 border-t border-slate-800 p-3">
                <input
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  maxLength={600}
                  placeholder="Ask about Ever…"
                  aria-label="Your question"
                  className="h-12 min-w-0 flex-1 rounded-xl border border-slate-600 bg-slate-950 px-3 text-base text-slate-50 placeholder:text-slate-500"
                />
                <button type="submit" disabled={busy || !text.trim()} aria-label="Send question" className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500 text-slate-950 disabled:opacity-40">
                  <Send size={18} aria-hidden />
                </button>
              </form>
            </>
          )}
        </section>
      )}
    </div>
  )
}
