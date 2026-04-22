import { Spinner } from '@renderer/components/ui/spinner'
import { cn } from '@renderer/lib/cn'
import { useRequest } from 'ahooks'
import { useMemo, type FC, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import {
  LuCpu,
  LuHardDrive,
  LuMemoryStick,
  LuMonitorCog,
  LuMonitorSmartphone,
  LuThermometer,
} from 'react-icons/lu'

type HardwareSnapshot = Awaited<ReturnType<typeof window.hardwareAPI.get>>

const formatBytes = (b: number | null | undefined, digits = 2): string => {
  if (b == null || !Number.isFinite(b) || b <= 0) return '—'
  const u = ['B', 'KB', 'MB', 'GB', 'TB', 'PB']
  let i = 0
  let v = b
  while (v >= 1024 && i < u.length - 1) {
    v /= 1024
    i++
  }
  return `${v.toFixed(digits)} ${u[i]}`
}

const Section: FC<{
  icon: ReactNode
  title: string
  subtitle?: string
  right?: ReactNode
  children: ReactNode
}> = ({ icon, title, subtitle, right, children }) => (
  <section className="rounded-xl border border-riven-border bg-riven-surface">
    <header className="flex items-center justify-between gap-3 border-b border-riven-border px-6 py-4">
      <div className="flex items-center gap-3">
        <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-riven-border bg-white/[0.03] text-primary">
          {icon}
        </span>
        <div>
          <h3 className="text-sm font-semibold tracking-tight text-foreground">
            {title}
          </h3>
          {subtitle && (
            <p className="mt-0.5 text-xs text-riven-muted">{subtitle}</p>
          )}
        </div>
      </div>
      {right}
    </header>
    <div className="p-6">{children}</div>
  </section>
)

const Row: FC<{
  label: ReactNode
  value: ReactNode
  mono?: boolean
}> = ({ label, value, mono }) => (
  <div className="flex items-start justify-between gap-4 py-2 first:pt-0 last:pb-0">
    <span className="text-xs uppercase tracking-wider text-riven-muted">
      {label}
    </span>
    <span
      className={cn(
        'text-right text-sm text-foreground',
        mono && 'font-mono text-xs',
      )}
    >
      {value}
    </span>
  </div>
)

const TempBadge: FC<{ celsius: number | null | undefined }> = ({ celsius }) => {
  if (celsius == null) return null
  const color =
    celsius >= 85
      ? 'text-danger border-danger/40 bg-danger/10'
      : celsius >= 70
        ? 'text-warning border-warning/40 bg-warning/10'
        : 'text-success border-success/40 bg-success/10'
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium',
        color,
      )}
    >
      <LuThermometer size={11} />
      {celsius.toFixed(0)}°C
    </span>
  )
}

const Hardware: FC = () => {
  const { t } = useTranslation()
  const { data, loading } = useRequest<HardwareSnapshot | null, Error[]>(
    () => window.hardwareAPI.get(),
    { pollingInterval: 30_000 },
  )

  const memPct = useMemo(() => {
    if (!data) return 0
    const used = data.memory.totalBytes - data.memory.availableBytes
    return data.memory.totalBytes > 0
      ? Math.round((used / data.memory.totalBytes) * 100)
      : 0
  }, [data])

  const miningReady = useMemo(() => {
    if (!data) return { ok: false, reason: 'Detecting…' }
    const totalGB = data.memory.totalBytes / 1024 ** 3
    if (totalGB < 2) {
      return {
        ok: false,
        reason: `Only ${totalGB.toFixed(1)} GB RAM — Warthog needs at least 2 GB.`,
      }
    }
    if (!data.gpus.some((g) => (g.vramBytes ?? 0) >= 2 * 1024 ** 3)) {
      return {
        ok: false,
        reason:
          'No GPU with ≥2 GB VRAM found. Warthog mining requires a discrete GPU.',
      }
    }
    return {
      ok: true,
      reason: `${data.cpu.cores} threads · ${totalGB.toFixed(1)} GB RAM · ${data.gpus.length} GPU${data.gpus.length === 1 ? '' : 's'} detected.`,
    }
  }, [data])

  return (
    <main className="mx-auto max-w-7xl space-y-6 py-2">
      <header className="flex flex-wrap items-end justify-between gap-4 py-8">
        <div>
          <h1 className="flex items-center gap-2.5 text-[28px] font-semibold tracking-tight text-foreground">
            <LuMonitorCog size={24} className="text-primary" />
            {t('hardware.title')}
          </h1>
          <p className="mt-1 text-sm text-riven-muted">
            {t('hardware.subtitle')}
          </p>
        </div>
        {loading && !data && <Spinner size="sm" className="text-primary" />}
      </header>

      {data && (
        <div
          className={cn(
            'flex items-start gap-3 rounded-xl border p-4',
            miningReady.ok
              ? 'border-success/30 bg-success/[0.04]'
              : 'border-warning/30 bg-warning/[0.04]',
          )}
        >
          <span
            className={cn(
              'mt-0.5 inline-block h-2 w-2 rounded-full',
              miningReady.ok ? 'bg-success' : 'bg-warning',
            )}
          />
          <div>
            <p className="text-sm font-medium text-foreground">
              {miningReady.ok
                ? t('hardware.miningReady')
                : t('hardware.miningNotReady')}
            </p>
            <p className="mt-0.5 text-xs leading-relaxed text-riven-muted">
              {miningReady.reason}
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <Section
          icon={<LuCpu size={16} />}
          title={t('hardware.cpu')}
          subtitle={data?.cpu.brand || '—'}
          right={<TempBadge celsius={data?.cpu.temperatureC ?? null} />}
        >
          {data ? (
            <div className="divide-y divide-riven-border">
              <Row
                label={t('hardware.manufacturer')}
                value={data.cpu.manufacturer || '—'}
              />
              <Row
                label={t('hardware.family')}
                value={data.cpu.family || '—'}
              />
              <Row
                label={t('hardware.coresThreads')}
                value={`${data.cpu.physicalCores} cores · ${data.cpu.cores} threads`}
              />
              <Row
                label={t('hardware.speed')}
                value={`${data.cpu.speedGHz.toFixed(2)} GHz`}
              />
              <Row
                label={t('hardware.l3Cache')}
                value={
                  data.cpu.cacheL3KB
                    ? `${(data.cpu.cacheL3KB / 1024).toFixed(1)} MB`
                    : '—'
                }
              />
            </div>
          ) : (
            <LoadingLines />
          )}
        </Section>

        <Section
          icon={<LuMemoryStick size={16} />}
          title={t('hardware.memory')}
          subtitle={
            data ? formatBytes(data.memory.totalBytes, 1) + ' total' : '—'
          }
        >
          {data ? (
            <>
              <div className="mb-4">
                <div className="flex items-baseline justify-between">
                  <span className="text-xs uppercase tracking-wider text-riven-muted">
                    {t('hardware.memoryInUse')}
                  </span>
                  <span className="font-mono text-xs tabular-nums text-foreground">
                    {formatBytes(
                      data.memory.totalBytes - data.memory.availableBytes,
                      1,
                    )}{' '}
                    · {memPct}%
                  </span>
                </div>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/[0.05]">
                  <span
                    className={cn(
                      'block h-full',
                      memPct >= 90
                        ? 'bg-danger'
                        : memPct >= 70
                          ? 'bg-warning'
                          : 'bg-primary',
                    )}
                    style={{ width: `${memPct}%` }}
                  />
                </div>
              </div>
              <div className="divide-y divide-riven-border">
                <Row
                  label={t('hardware.available')}
                  value={formatBytes(data.memory.availableBytes, 1)}
                />
                <Row
                  label={t('hardware.swap')}
                  value={formatBytes(data.memory.swapTotalBytes, 1)}
                />
                {data.memory.sticks.length > 0 && (
                  <Row
                    label={t('hardware.sticks')}
                    value={`${data.memory.sticks.length} × ${data.memory.sticks[0].type ?? ''} ${
                      data.memory.sticks[0].speedMHz
                        ? `@ ${data.memory.sticks[0].speedMHz} MHz`
                        : ''
                    }`.trim()}
                  />
                )}
              </div>
            </>
          ) : (
            <LoadingLines />
          )}
        </Section>
      </div>

      <Section
        icon={<LuMonitorSmartphone size={16} />}
        title={t('hardware.gpus')}
        subtitle={data ? `${data.gpus.length} detected` : '—'}
      >
        {!data ? (
          <LoadingLines />
        ) : data.gpus.length === 0 ? (
          <p className="text-sm text-riven-muted">{t('hardware.noGpus')}</p>
        ) : (
          <div className="space-y-3">
            {data.gpus.map((g, i) => (
              <div
                key={i}
                className="rounded-lg border border-riven-border bg-black/20 p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {g.model}
                    </p>
                    <p className="mt-0.5 text-xs text-riven-muted">
                      {g.vendor || '—'}
                    </p>
                  </div>
                  <TempBadge celsius={g.temperatureC} />
                </div>
                <div className="mt-3 grid grid-cols-2 gap-3 text-xs sm:grid-cols-4">
                  <Metric
                    label={t('hardware.vram')}
                    value={formatBytes(g.vramBytes, 1)}
                  />
                  <Metric
                    label={t('hardware.driver')}
                    value={g.driverVersion || '—'}
                    mono
                  />
                  <Metric
                    label={t('hardware.utilization')}
                    value={
                      g.utilizationGpu != null
                        ? `${g.utilizationGpu.toFixed(0)}%`
                        : '—'
                    }
                  />
                  <Metric
                    label={t('hardware.vramUsed')}
                    value={formatBytes(g.memoryUsedBytes, 1)}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </Section>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <Section
          icon={<LuMonitorCog size={16} />}
          title={t('hardware.os')}
          subtitle={data ? `${data.os.distro} ${data.os.release}` : '—'}
        >
          {data ? (
            <div className="divide-y divide-riven-border">
              <Row label={t('hardware.platform')} value={data.os.platform} />
              <Row label={t('hardware.arch')} value={data.os.arch} />
              <Row label={t('hardware.kernel')} value={data.os.kernel} mono />
              <Row
                label={t('hardware.hostname')}
                value={data.os.hostname}
                mono
              />
            </div>
          ) : (
            <LoadingLines />
          )}
        </Section>

        <Section
          icon={<LuHardDrive size={16} />}
          title={t('hardware.storage')}
          subtitle={data ? `${data.disks.length} drives` : '—'}
        >
          {!data ? (
            <LoadingLines />
          ) : data.disks.length === 0 ? (
            <p className="text-sm text-riven-muted">No disks reported.</p>
          ) : (
            <div className="space-y-2">
              {data.disks.map((d, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between rounded-lg border border-riven-border bg-black/20 px-4 py-3"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm text-foreground">
                      {d.name || 'Disk'}
                    </p>
                    <p className="mt-0.5 text-[11px] text-riven-muted">
                      {d.vendor || '—'} · {d.type || '—'}
                    </p>
                  </div>
                  <span className="font-mono text-xs tabular-nums text-riven-muted">
                    {formatBytes(d.sizeBytes, 1)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </Section>
      </div>
    </main>
  )
}

const Metric: FC<{ label: string; value: ReactNode; mono?: boolean }> = ({
  label,
  value,
  mono,
}) => (
  <div>
    <p className="text-[10px] uppercase tracking-wider text-riven-muted">
      {label}
    </p>
    <p
      className={cn(
        'mt-0.5 text-sm text-foreground',
        mono && 'font-mono text-xs',
      )}
    >
      {value}
    </p>
  </div>
)

const LoadingLines: FC = () => (
  <div className="space-y-2">
    {[0, 1, 2].map((i) => (
      <div
        key={i}
        className="h-4 w-full animate-pulse rounded bg-white/[0.03]"
      />
    ))}
  </div>
)

export default Hardware
