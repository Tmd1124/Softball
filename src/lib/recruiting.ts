import { useEffect, useState } from 'react'
import { api } from './api'
import { defaultSite, defaultSports } from '../data/recruitingData'
import type { RecruitingData, SiteData, SportData, SportId } from '../data/recruitingData'

export interface StoredContent {
  site: SiteData | null
  softball: SportData | null
  basketball: SportData | null
}

export function merge(c: StoredContent): RecruitingData {
  return {
    ...(c.site ?? defaultSite),
    softball: c.softball ?? defaultSports.softball,
    basketball: c.basketball ?? defaultSports.basketball,
  }
}

export const sectionOf = (c: StoredContent, id: 'site' | SportId) => c[id]

let pending: Promise<RecruitingData> | null = null

function load(): Promise<RecruitingData> {
  pending ??= api<{ content: StoredContent }>('recruiting.php')
    .then((r) => merge(r.content))
    .catch(() => merge({ site: null, softball: null, basketball: null }))
  return pending
}

export function useRecruiting(): RecruitingData | null {
  const [data, setData] = useState<RecruitingData | null>(null)
  useEffect(() => {
    let live = true
    void load().then((d) => live && setData(d))
    return () => {
      live = false
    }
  }, [])
  return data
}
