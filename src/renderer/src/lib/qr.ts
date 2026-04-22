import { LOGO } from '@renderer/constants/images'
import jsQR from 'jsqr'
import QRCode from 'qrcode'

/**
 * Compose a branded "shareable" PNG: white card, "Wartlock" title, QR code
 * with the logo inlaid in the center, and the full address in monospace
 * underneath. Returns a data URL.
 */
export async function buildShareableQrPng(address: string): Promise<string> {
  const W = 640
  const H = 780
  const canvas = document.createElement('canvas')
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext('2d')!

  ctx.fillStyle = '#FFFFFF'
  ctx.fillRect(0, 0, W, H)

  // Title
  ctx.fillStyle = '#0A0A0C'
  ctx.font =
    '600 32px "Inter", -apple-system, "Segoe UI", system-ui, sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText('Wartlock', W / 2, 70)

  ctx.fillStyle = '#6B6B72'
  ctx.font = '400 15px "Inter", system-ui, sans-serif'
  ctx.fillText('Scan to send WART to this wallet', W / 2, 100)

  // QR — error correction 'H' (~30%) so the centered logo doesn't break scans.
  const qrSize = 420
  const qrCanvas = document.createElement('canvas')
  await QRCode.toCanvas(qrCanvas, address, {
    margin: 2,
    width: qrSize,
    color: { dark: '#0A0A0C', light: '#FFFFFF' },
    errorCorrectionLevel: 'H',
  })
  const qrX = (W - qrSize) / 2
  const qrY = 140
  ctx.drawImage(qrCanvas, qrX, qrY)

  // Soft rounded outline around QR
  ctx.strokeStyle = '#E5E5E8'
  ctx.lineWidth = 1
  roundedRect(ctx, qrX - 12, qrY - 12, qrSize + 24, qrSize + 24, 12)
  ctx.stroke()

  // Center-inlaid Wartlock logo. ~18% of QR side leaves enough redundancy.
  try {
    const logoImg = await loadImage(LOGO)
    const logoSize = Math.round(qrSize * 0.18)
    const logoX = qrX + (qrSize - logoSize) / 2
    const logoY = qrY + (qrSize - logoSize) / 2
    const pad = 8
    // white rounded backdrop so the logo's dark chip sits on clear ground
    ctx.fillStyle = '#FFFFFF'
    roundedRect(
      ctx,
      logoX - pad,
      logoY - pad,
      logoSize + pad * 2,
      logoSize + pad * 2,
      14,
    )
    ctx.fill()
    ctx.drawImage(logoImg, logoX, logoY, logoSize, logoSize)
  } catch {
    // If logo load fails, the bare QR is still valid — just skip the overlay.
  }

  // Address label
  ctx.fillStyle = '#8A8A8A'
  ctx.font = '600 10px "Inter", system-ui, sans-serif'
  ctx.letterSpacing = '0.08em'
  ctx.fillText('WALLET ADDRESS', W / 2, qrY + 420 + 56)

  // Address value (monospace, wrap at midpoint so it fits)
  ctx.fillStyle = '#0A0A0C'
  ctx.font = '500 16px "SFMono-Regular", "Menlo", "Consolas", monospace'
  const half = Math.ceil(address.length / 2)
  ctx.fillText(address.slice(0, half), W / 2, qrY + 420 + 86)
  ctx.fillText(address.slice(half), W / 2, qrY + 420 + 110)

  return canvas.toDataURL('image/png')
}

function roundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
): void {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.lineTo(x + w - r, y)
  ctx.quadraticCurveTo(x + w, y, x + w, y + r)
  ctx.lineTo(x + w, y + h - r)
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h)
  ctx.lineTo(x + r, y + h)
  ctx.quadraticCurveTo(x, y + h, x, y + h - r)
  ctx.lineTo(x, y + r)
  ctx.quadraticCurveTo(x, y, x + r, y)
  ctx.closePath()
}

/**
 * Decode a QR code from an image File. Returns the decoded string, or null if
 * no QR was found.
 *
 * Note: we read the file as a data URL rather than URL.createObjectURL — the
 * renderer's CSP whitelists `data:` but not `blob:`, so an <img> loaded from a
 * blob URL never fires onload, and the whole decode silently fails.
 */
export async function decodeQrFromFile(file: File): Promise<string | null> {
  const img = await loadImageFromFile(file)
  const canvas = document.createElement('canvas')
  // Cap size to avoid pathological memory use on huge photos.
  const maxSide = 1600
  const scale = Math.min(1, maxSide / Math.max(img.width, img.height))
  canvas.width = Math.round(img.width * scale)
  canvas.height = Math.round(img.height * scale)
  const ctx = canvas.getContext('2d')!
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
  const result = jsQR(imageData.data, imageData.width, imageData.height, {
    inversionAttempts: 'attemptBoth',
  })
  return result?.data ?? null
}

function loadImageFromFile(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(new Error('file read failed'))
    reader.onload = () => {
      const img = new Image()
      img.onload = () => resolve(img)
      img.onerror = () => reject(new Error('image decode failed'))
      img.src = String(reader.result)
    }
    reader.readAsDataURL(file)
  })
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('image load failed'))
    img.src = src
  })
}

export function downloadDataUrl(dataUrl: string, filename: string): void {
  const a = document.createElement('a')
  a.href = dataUrl
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
}
