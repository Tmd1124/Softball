import { useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'

export default function ScrollRow({ label, className = '', children }: { label: string; className?: string; children: ReactNode }) {
  const nav = useRef<HTMLElement>(null)
  const [more, setMore] = useState({ left: false, right: false })
  useEffect(() => {
    const el = nav.current
    if (!el) return
    const check = () => setMore({ left: el.scrollLeft > 4, right: el.scrollLeft + el.clientWidth < el.scrollWidth - 4 })
    check()
    el.addEventListener('scroll', check, { passive: true })
    const ro = new ResizeObserver(check)
    ro.observe(el)
    return () => {
      el.removeEventListener('scroll', check)
      ro.disconnect()
    }
  }, [children])
  const go = (dir: 1 | -1) => nav.current?.scrollBy({ left: dir * nav.current.clientWidth * 0.7, behavior: 'smooth' })
  const arrow = 'absolute top-0 z-10 flex h-12 w-12 items-center justify-center bg-slate-950/90 text-lg font-extrabold text-amber-400'
  return (
    <div className={`relative ${className}`}>
      {more.left && (
        <button type="button" onClick={() => go(-1)} aria-label="Show earlier buttons" className={`${arrow} left-0 rounded-l-full`}>
          «
        </button>
      )}
      {more.right && (
        <button type="button" onClick={() => go(1)} aria-label="Show more buttons" className={`${arrow} right-0 rounded-r-full`}>
          »
        </button>
      )}
      <nav ref={nav} aria-label={label} className="no-scrollbar flex gap-2 overflow-x-auto pb-1">
        {children}
      </nav>
    </div>
  )
}
