import QRCode from 'qrcode'
import { useEffect, useState, type FC } from 'react'
import { cn } from '../../lib/cn'

type Props = {
  value: string
  size?: number
  className?: string
}

export const QRCodeSvg: FC<Props> = ({ value, size = 176, className }) => {
  const [svg, setSvg] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    if (!value) {
      setSvg(null)
      return
    }
    QRCode.toString(value, {
      type: 'svg',
      margin: 1,
      errorCorrectionLevel: 'M',
      color: {
        dark: '#FAFAFA',
        light: '#00000000',
      },
    })
      .then((result) => {
        if (!cancelled) setSvg(result)
      })
      .catch(() => {
        if (!cancelled) setSvg(null)
      })
    return (): void => {
      cancelled = true
    }
  }, [value])

  return (
    <div
      style={{ width: size, height: size }}
      className={cn(
        'flex items-center justify-center rounded-lg border border-riven-border bg-black/30 p-3',
        className,
      )}
      aria-label={`QR code for ${value}`}
    >
      {svg ? (
        <div
          className="h-full w-full [&>svg]:h-full [&>svg]:w-full"
          dangerouslySetInnerHTML={{ __html: svg }}
        />
      ) : (
        <div className="h-full w-full animate-pulse rounded bg-white/[0.03]" />
      )}
    </div>
  )
}
