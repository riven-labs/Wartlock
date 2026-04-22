import { cn } from '@renderer/lib/cn'
import { useEffect, useState, type FC } from 'react'
import { useTranslation } from 'react-i18next'
import { LuHandHeart, LuPickaxe } from 'react-icons/lu'
import type { MinerMode, MinerStats } from '../types'

type Props = {
  running: boolean
  mode: MinerMode
  startedAt: number | null
  stats: MinerStats
  pool: string
}

const formatHashrate = (hps: number | null, unit: string | null): string => {
  if (hps == null) return '—'
  if (unit) {
    const mult =
      unit[0] === 'T'
        ? 1e12
        : unit[0] === 'G'
          ? 1e9
          : unit[0] === 'M'
            ? 1e6
            : unit[0] === 'k' || unit[0] === 'K'
              ? 1e3
              : 1
    return (hps / mult).toFixed(2)
  }
  if (hps >= 1e12) return (hps / 1e12).toFixed(2)
  if (hps >= 1e9) return (hps / 1e9).toFixed(2)
  if (hps >= 1e6) return (hps / 1e6).toFixed(2)
  if (hps >= 1e3) return (hps / 1e3).toFixed(2)
  return hps.toFixed(0)
}

const hashrateUnit = (hps: number | null, unit: string | null): string => {
  if (unit) return unit
  if (hps == null) return ''
  if (hps >= 1e12) return 'TH/s'
  if (hps >= 1e9) return 'GH/s'
  if (hps >= 1e6) return 'MH/s'
  if (hps >= 1e3) return 'kH/s'
  return 'H/s'
}

const formatUptime = (ms: number): string => {
  const total = Math.max(0, Math.floor(ms / 1000))
  const h = Math.floor(total / 3600)
  const m = Math.floor((total % 3600) / 60)
  const s = total % 60
  if (h > 0)
    return `${h}h ${m.toString().padStart(2, '0')}m ${s.toString().padStart(2, '0')}s`
  if (m > 0) return `${m}m ${s.toString().padStart(2, '0')}s`
  return `${s}s`
}

export const MinerHero: FC<Props> = ({
  running,
  mode,
  startedAt,
  stats,
  pool,
}) => {
  const { t } = useTranslation()
  const [now, setNow] = useState(Date.now())

  useEffect(() => {
    if (!running) return
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [running])

  if (!running) return null

  const uptime = startedAt ? formatUptime(now - startedAt) : '—'
  const hr = formatHashrate(stats.hashrateHps, stats.unit)
  const unit = hashrateUnit(stats.hashrateHps, stats.unit)
  const isDonation = mode === 'donation'

  return (
    <section
      className={cn(
        'relative overflow-hidden rounded-2xl border p-6',
        isDonation
          ? 'border-primary/30 bg-[linear-gradient(135deg,rgba(47,111,235,0.12)_0%,rgba(47,111,235,0.02)_60%)]'
          : 'border-success/30 bg-[linear-gradient(135deg,rgba(34,197,94,0.1)_0%,rgba(34,197,94,0.015)_55%)]',
      )}
    >
      {/* ambient grid */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            'linear-gradient(to right, #fff 1px, transparent 1px), linear-gradient(to bottom, #fff 1px, transparent 1px)',
          backgroundSize: '32px 32px',
        }}
      />

      <div className="relative flex flex-wrap items-end justify-between gap-8">
        <div>
          <div className="flex items-center gap-2">
            <span
              className={cn(
                'relative flex h-2 w-2',
                'after:absolute after:inset-0 after:animate-ping after:rounded-full',
                isDonation ? 'after:bg-primary/50' : 'after:bg-success/50',
              )}
            >
              <span
                className={cn(
                  'relative inline-flex h-full w-full rounded-full',
                  isDonation ? 'bg-primary' : 'bg-success',
                )}
              />
            </span>
            <span
              className={cn(
                'inline-flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wider',
                isDonation ? 'text-primary' : 'text-success',
              )}
            >
              {isDonation ? <LuHandHeart size={11} /> : <LuPickaxe size={11} />}
              {isDonation ? t('mining.modeDonation') : t('mining.modeUser')}
            </span>
          </div>

          <div className="mt-3 flex items-baseline gap-3">
            <p className="font-mono text-6xl font-semibold tabular-nums leading-none tracking-tight text-foreground">
              {hr}
            </p>
            <p className="text-lg font-medium text-riven-muted">{unit}</p>
          </div>
          <p className="mt-1 text-xs text-riven-muted">
            {t('mining.heroSubtitle')}
          </p>
        </div>

        <dl className="grid grid-cols-3 gap-6 text-right">
          <HeroStat label={t('mining.uptime')} value={uptime} mono />
          <HeroStat
            label={t('mining.accepted')}
            value={stats.accepted ?? 0}
            accent="success"
          />
          <HeroStat
            label={t('mining.rejected')}
            value={stats.rejected ?? 0}
            accent={stats.rejected && stats.rejected > 0 ? 'danger' : undefined}
          />
        </dl>
      </div>

      {pool && (
        <p className="relative mt-5 border-t border-white/[0.06] pt-4 text-[11px] text-riven-muted">
          <span className="uppercase tracking-wider">Pool</span>{' '}
          <span className="ml-2 font-mono text-foreground">{pool}</span>
        </p>
      )}
    </section>
  )
}

const HeroStat: FC<{
  label: string
  value: React.ReactNode
  accent?: 'success' | 'danger'
  mono?: boolean
}> = ({ label, value, accent, mono }) => (
  <div>
    <dt className="text-[10px] font-medium uppercase tracking-wider text-riven-muted">
      {label}
    </dt>
    <dd
      className={cn(
        'mt-1 text-lg font-semibold tabular-nums',
        mono && 'font-mono text-base',
        accent === 'success' && 'text-success',
        accent === 'danger' && 'text-danger',
        !accent && 'text-foreground',
      )}
    >
      {value}
    </dd>
  </div>
)
