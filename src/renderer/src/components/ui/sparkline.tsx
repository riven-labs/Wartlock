import type { FC } from 'react'
import { cn } from '../../lib/cn'

type SparklineProps = {
  values: number[]
  className?: string
  strokeClassName?: string
  fillClassName?: string
  width?: number
  height?: number
  strokeWidth?: number
}

export const Sparkline: FC<SparklineProps> = ({
  values,
  className,
  strokeClassName = 'text-primary',
  fillClassName = 'text-primary/10',
  width = 160,
  height = 40,
  strokeWidth = 1.5,
}) => {
  if (!values.length) {
    return (
      <div
        className={cn('h-10 w-full rounded bg-white/[0.02]', className)}
        style={{ height }}
      />
    )
  }

  const pad = 2
  const min = Math.min(...values)
  const max = Math.max(...values)
  const range = max - min || 1
  const n = values.length
  const stepX = (width - pad * 2) / Math.max(1, n - 1)

  const points = values.map((v, i) => {
    const x = pad + i * stepX
    const y = pad + (height - pad * 2) * (1 - (v - min) / range)
    return [x, y] as const
  })

  const line = points.map(([x, y]) => `${x},${y}`).join(' ')
  const area =
    points.length > 1
      ? `M ${points[0][0]},${height - pad} L ${line.split(' ').join(' L ')} L ${
          points[points.length - 1][0]
        },${height - pad} Z`
      : ''

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      className={cn('block h-10 w-full', className)}
      aria-hidden="true"
    >
      {area && <path d={area} className={cn('fill-current', fillClassName)} />}
      <polyline
        points={line}
        fill="none"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        className={cn('stroke-current', strokeClassName)}
      />
    </svg>
  )
}
