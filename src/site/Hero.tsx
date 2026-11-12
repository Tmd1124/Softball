import type { ReactNode } from 'react'

interface Props {
  image: string
  kicker: string
  title: ReactNode
  text: string
  children?: ReactNode
}

export default function Hero({ image, kicker, title, text, children }: Props) {
  return (
    <section aria-labelledby="hero-title" className="relative isolate overflow-hidden border-b border-slate-800">
      <img src={image} alt="" className="absolute inset-0 -z-10 h-full w-full object-cover" />
      <div className="absolute inset-0 -z-10 bg-gradient-to-t from-slate-950 via-slate-950/60 to-slate-950/10" />
      <div className="mx-auto flex min-h-[26rem] max-w-5xl flex-col justify-end px-4 pb-10 pt-20 sm:min-h-[32rem] sm:px-6 sm:pb-14">
        <p className="text-xs font-bold uppercase tracking-[0.28em] text-amber-400">{kicker}</p>
        <h1
          id="hero-title"
          className="mt-3 max-w-2xl text-5xl font-extrabold leading-[0.98] tracking-tight text-slate-50 sm:text-7xl"
        >
          {title}
        </h1>
        <p className="mt-4 max-w-xl text-base leading-relaxed text-slate-300 sm:text-lg">{text}</p>
        {children && <div className="mt-7 flex flex-wrap gap-3">{children}</div>}
      </div>
    </section>
  )
}

export function CtaLink({ href, children, primary = false }: { href: string; children: ReactNode; primary?: boolean }) {
  return (
    <a
      href={href}
      className={`inline-flex min-h-12 items-center justify-center gap-2 rounded-full px-6 text-sm font-bold transition-colors ${
        primary
          ? 'bg-amber-500 text-slate-950 hover:bg-amber-400 active:bg-amber-400'
          : 'border border-slate-600 text-slate-100 hover:bg-slate-800 active:bg-slate-800'
      }`}
    >
      {children}
    </a>
  )
}
