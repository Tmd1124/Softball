import qrcode from 'qrcode-generator'

const QUIET = 4

function modules(text: string) {
  const qr = qrcode(0, 'M')
  qr.addData(text)
  qr.make()
  const n = qr.getModuleCount()
  let d = ''
  for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (qr.isDark(r, c)) d += `M${c + QUIET},${r + QUIET}h1v1h-1z`
  return { size: n + QUIET * 2, d }
}

export function qrSvgString(text: string) {
  const { size, d } = modules(text)
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" shape-rendering="crispEdges"><rect width="${size}" height="${size}" fill="#fff"/><path d="${d}" fill="#000"/></svg>`
}

export function qrPngBlob(text: string, px = 1024): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = canvas.height = px
      const ctx = canvas.getContext('2d')!
      ctx.imageSmoothingEnabled = false
      ctx.drawImage(img, 0, 0, px, px)
      canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('png'))), 'image/png')
    }
    img.onerror = () => reject(new Error('svg'))
    img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(qrSvgString(text))}`
  })
}

export default function QrCode({ text, className, label }: { text: string; className?: string; label: string }) {
  const { size, d } = modules(text)
  return (
    <svg role="img" aria-label={label} viewBox={`0 0 ${size} ${size}`} shapeRendering="crispEdges" className={className}>
      <rect width={size} height={size} fill="#fff" />
      <path d={d} fill="#000" />
    </svg>
  )
}
