import { MetricCard } from '@renderer/components/ui/metric-card'
import { useEffect, useState, type FC } from 'react'
import { useTranslation } from 'react-i18next'
import { LuActivity, LuCircleCheck, LuCircleX, LuClock } from 'react-icons/lu'
import type { MinerStats as Stats } from '../types'

type Props = {
  stats: Stats
  startedAt: number | null
  running: boolean
}

const formatHashrate = (hps: number | null, unit: string | null): string => {
  if (hps == null) return '—'
  // Prefer the unit we parsed if we have it, else pick the best-fit one.
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
    return `${(hps / mult).toFixed(2)} ${unit}`
  }
  if (hps >= 1e12) return `${(hps / 1e12).toFixed(2)} TH/s`
  if (hps >= 1e9) return `${(hps / 1e9).toFixed(2)} GH/s`
  if (hps >= 1e6) return `${(hps / 1e6).toFixed(2)} MH/s`
  if (hps >= 1e3) return `${(hps / 1e3).toFixed(2)} kH/s`
  return `${hps.toFixed(0)} H/s`
}

const formatUptime = (ms: number): string => {
  const total = Math.max(0, Math.floor(ms / 1000))
  const h = Math.floor(total / 3600)
  const m = Math.floor((total % 3600) / 60)
  const s = total % 60
  if (h > 0) return `${h}h ${m}m ${s}s`
  if (m > 0) return `${m}m ${s}s`
  return `${s}s`
}

export const MinerStats: FC<Props> = ({ stats, startedAt, running }) => {
  const { t } = useTranslation()
  const [now, setNow] = useState(Date.now())

  useEffect(() => {
    if (!running) return
    const tick = (): void => setNow(Date.now())
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [running])

  const uptime =
    running && startedAt ? formatUptime(now - startedAt) : running ? '—' : '—'

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      <MetricCard
        label={t('mining.hashrate')}
        value={formatHashrate(stats.hashrateHps, stats.unit)}
        accent={running ? 'primary' : 'neutral'}
        icon={<LuActivity size={15} />}
      />
      <MetricCard
        label={t('mining.accepted')}
        value={stats.accepted ?? 0}
        accent="success"
        icon={<LuCircleCheck size={15} />}
      />
      <MetricCard
        label={t('mining.rejected')}
        value={stats.rejected ?? 0}
        accent={stats.rejected && stats.rejected > 0 ? 'danger' : 'neutral'}
        icon={<LuCircleX size={15} />}
      />
      <MetricCard
        label={t('mining.uptime')}
        value={uptime}
        accent="neutral"
        icon={<LuClock size={15} />}
        sub={
          stats.gpus != null ? `${stats.gpus} ${t('mining.gpus')}` : undefined
        }
      />
    </div>
  )
}
