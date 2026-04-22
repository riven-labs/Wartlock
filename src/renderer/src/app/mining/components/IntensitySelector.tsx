import { cn } from '@renderer/lib/cn'
import type { FC, ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { LuGauge, LuLeaf, LuSettings2, LuZap } from 'react-icons/lu'
import type { MinerIntensity } from '../types'

type Props = {
  value: MinerIntensity
  onChange: (v: MinerIntensity) => void
  disabled?: boolean
}

type ModeMeta = {
  id: MinerIntensity
  icon: ReactNode
  accent: 'success' | 'primary' | 'warning' | 'neutral'
  glyph: string
}

const MODES: ModeMeta[] = [
  {
    id: 'eco',
    icon: <LuLeaf size={20} />,
    accent: 'success',
    glyph: '2T · 15%',
  },
  {
    id: 'balanced',
    icon: <LuGauge size={20} />,
    accent: 'primary',
    glyph: '8T · 30%',
  },
  {
    id: 'performance',
    icon: <LuZap size={20} />,
    accent: 'warning',
    glyph: 'auto · 60%',
  },
  {
    id: 'custom',
    icon: <LuSettings2 size={20} />,
    accent: 'neutral',
    glyph: '—',
  },
]

const accentMap = {
  success: {
    selectedBorder: 'border-success/50',
    selectedBg: 'bg-success/[0.06]',
    selectedGlow: 'shadow-[0_0_0_4px_rgba(34,197,94,0.08)]',
    icon: 'text-success',
    glyph: 'text-success',
  },
  primary: {
    selectedBorder: 'border-primary/50',
    selectedBg: 'bg-primary/[0.06]',
    selectedGlow: 'shadow-[0_0_0_4px_rgba(47,111,235,0.1)]',
    icon: 'text-primary',
    glyph: 'text-primary',
  },
  warning: {
    selectedBorder: 'border-warning/50',
    selectedBg: 'bg-warning/[0.06]',
    selectedGlow: 'shadow-[0_0_0_4px_rgba(245,158,11,0.08)]',
    icon: 'text-warning',
    glyph: 'text-warning',
  },
  neutral: {
    selectedBorder: 'border-riven-border-strong',
    selectedBg: 'bg-white/[0.04]',
    selectedGlow: 'shadow-[0_0_0_4px_rgba(255,255,255,0.03)]',
    icon: 'text-foreground',
    glyph: 'text-riven-muted',
  },
} as const

export const IntensitySelector: FC<Props> = ({ value, onChange, disabled }) => {
  const { t } = useTranslation()

  return (
    <div>
      <div className="mb-3 flex items-baseline justify-between">
        <label className="text-xs uppercase tracking-wider text-riven-muted">
          {t('mining.intensityLabel')}
        </label>
        <span className="text-[11px] text-riven-muted">
          {t('mining.intensitySubtitle')}
        </span>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {MODES.map((mode) => {
          const selected = value === mode.id
          const a = accentMap[mode.accent]
          return (
            <button
              key={mode.id}
              type="button"
              disabled={disabled}
              onClick={() => onChange(mode.id)}
              className={cn(
                'group relative flex flex-col items-start gap-3 rounded-xl border p-4 text-left transition-all',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60',
                'disabled:cursor-not-allowed disabled:opacity-60',
                selected
                  ? cn(a.selectedBorder, a.selectedBg, a.selectedGlow)
                  : 'border-riven-border bg-riven-surface hover:border-riven-border-strong hover:bg-white/[0.02]',
              )}
            >
              <div className="flex w-full items-start justify-between">
                <span
                  className={cn(
                    'flex h-9 w-9 items-center justify-center rounded-lg transition-colors',
                    selected
                      ? cn('bg-white/[0.04]', a.icon)
                      : 'bg-white/[0.03] text-riven-muted group-hover:text-foreground',
                  )}
                >
                  {mode.icon}
                </span>
                <span
                  className={cn(
                    'font-mono text-[11px] tabular-nums',
                    selected ? a.glyph : 'text-riven-muted',
                  )}
                >
                  {mode.glyph}
                </span>
              </div>
              <div className="flex-1">
                <p
                  className={cn(
                    'text-sm font-semibold tracking-tight',
                    selected ? 'text-foreground' : 'text-foreground',
                  )}
                >
                  {t(`mining.intensity.${mode.id}.label`)}
                </p>
                <p className="mt-1 text-xs leading-relaxed text-riven-muted">
                  {t(`mining.intensity.${mode.id}.description`)}
                </p>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
