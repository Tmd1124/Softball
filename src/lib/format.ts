export function formatPhone(v: string): string {
  let d = v.replace(/\D/g, '')
  if (d.length > 10 && d[0] === '1') d = d.slice(1)
  d = d.slice(0, 10)
  if (d.length === 0) return ''
  if (d.length <= 3) return `(${d}`
  if (d.length <= 6) return `(${d.slice(0, 3)}) ${d.slice(3)}`
  return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`
}
