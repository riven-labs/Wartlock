import type { FC, ReactNode } from 'react'
import { cn } from '../../lib/cn'

export type MetricAccent =
  | 'success'
  | 'danger'
  | 'primary'
  | 'warning'
  | 'neutral'

const accentStyles: Record<
  MetricAccent,
  { bar: string; iconBg: string; iconFg: string; value: string; sub: string }
> = {
  success: {
    bar: 'bg-gradient-to-b from-success/80 to-success/20',
    iconBg: 'bg-success/10 ring-1 ring-inset ring-success/20',
    iconFg: 'text-success',
    value: 'text-foreground',
    sub: 'text-success',
  },
  danger: {
    bar: 'bg-gradient-to-b from-danger/80 to-danger/20',
    iconBg: 'bg-danger/10 ring-1 ring-inset ring-danger/20',
    iconFg: 'text-danger',
    value: 'text-foreground',
    sub: 'text-danger',
  },
  primary: {
    bar: 'bg-gradient-to-b from-primary/80 to-primary/20',
    iconBg: 'bg-primary/10 ring-1 ring-inset ring-primary/20',
    iconFg: 'text-primary',
    value: 'text-foreground',
    sub: 'text-primary',
  },
  warning: {
    bar: 'bg-gradient-to-b from-warning/80 to-warning/20',
    iconBg: 'bg-warning/10 ring-1 ring-inset ring-warning/20',
    iconFg: 'text-warning',
    value: 'text-foreground',
    sub: 'text-warning',
  },
  neutral: {
    bar: 'bg-gradient-to-b from-white/40 to-white/10',
    iconBg: 'bg-white/[0.04] ring-1 ring-inset ring-white/10',
    iconFg: 'text-riven-muted-soft',
    value: 'text-foreground',
    sub: 'text-riven-muted',
  },
}

type MetricCardProps = {
  label: string
  value: ReactNode
  valueSuffix?: string
  icon?: ReactNode
  accent?: MetricAccent
  sub?: ReactNode
  subIcon?: ReactNode
  trend?: ReactNode
  className?: string
}

export const MetricCard: FC<MetricCardProps> = ({
  label,
  value,
  valueSuffix,
  icon,
  accent = 'neutral',
  sub,
  subIcon,
  trend,
  className,
}) => {
  const s = accentStyles[accent]
  return (
    <div
      className={cn(
        'group relative overflow-hidden rounded-xl border border-riven-border bg-riven-surface transition-colors hover:border-riven-border-strong',
        className,
      )}
    >
      {/* colored left accent */}
      <span
        aria-hidden
        className={cn(
          'absolute left-0 top-2 h-[calc(100%-1rem)] w-[2px] rounded-full',
          s.bar,
        )}
      />
      <div className="flex items-start justify-between gap-3 px-5 pt-5">
        <p className="text-[11px] font-medium uppercase tracking-wider text-riven-muted">
          {label}
        </p>
        {icon && (
          <span
            className={cn(
              'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-transform group-hover:scale-105',
              s.iconBg,
              s.iconFg,
            )}
          >
            {icon}
          </span>
        )}
      </div>
      <div className="px-5 pb-5 pt-3">
        <p
          className={cn(
            'text-[26px] font-semibold tabular-nums leading-none tracking-tight',
            s.value,
          )}
        >
          {value}
          {valueSuffix && (
            <span className="ml-1 text-sm font-normal text-riven-muted">
              {valueSuffix}
            </span>
          )}
        </p>
        {sub && (
          <p
            className={cn(
              'mt-3 inline-flex items-center gap-1.5 text-xs',
              s.sub,
            )}
          >
            {subIcon && <span>{subIcon}</span>}
            <span>{sub}</span>
          </p>
        )}
        {trend}
      </div>
    </div>
  )
}
