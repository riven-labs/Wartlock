import { Button } from '@renderer/components/ui/button'
import { addToast } from '@renderer/components/ui/toast'
import { cn } from '@renderer/lib/cn'
import { useRequest } from 'ahooks'
import { useCallback, useEffect, useMemo, useState, type FC } from 'react'
import { useTranslation } from 'react-i18next'
import {
  LuCirclePlay,
  LuCircleStop,
  LuHandHeart,
  LuPickaxe,
} from 'react-icons/lu'
import { MinerConfigCard } from './components/MinerConfigCard'
import { MinerHero } from './components/MinerHero'
import { MinerLogs } from './components/MinerLogs'
import {
  CONFIG_STORAGE_KEY,
  DEFAULT_CONFIG,
  DEFAULT_OPTIONS,
  OPTIONS_STORAGE_KEY,
  type LogLine,
  type MinerConfig,
  type MinerMode,
  type MinerOptions,
  type MinerState,
  type MinerStats as Stats,
} from './types'

type DbWallet = {
  id: string
  name: string
  address: string
}

const loadJson = <T,>(key: string, fallback: T): T => {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return fallback
    return { ...fallback, ...JSON.parse(raw) }
  } catch {
    return fallback
  }
}

const saveJson = (key: string, value: unknown): void => {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    /* noop */
  }
}

const formatCountdown = (ms: number): string => {
  const total = Math.max(0, Math.floor(ms / 1000))
  const h = Math.floor(total / 3600)
  const m = Math.floor((total % 3600) / 60)
  const s = total % 60
  if (h > 0) return `${h}h ${m.toString().padStart(2, '0')}m`
  return `${m}:${s.toString().padStart(2, '0')}`
}

const Mining: FC = () => {
  const { t } = useTranslation()
  const [config, setConfig] = useState<MinerConfig>(() => {
    const loaded = loadJson(CONFIG_STORAGE_KEY, DEFAULT_CONFIG)
    // One-time migration: the original default `wart` is not a real bzminer
    // algo name for Warthog — flip it to `warthog` for anyone upgrading.
    if (loaded.algo === 'wart') loaded.algo = 'warthog'
    return loaded
  })
  const [options, setOptions] = useState<MinerOptions>(() =>
    loadJson(OPTIONS_STORAGE_KEY, DEFAULT_OPTIONS),
  )
  const [running, setRunning] = useState(false)
  const [startedAt, setStartedAt] = useState<number | null>(null)
  const [mode, setMode] = useState<MinerMode>('user')
  const [nextSwapAt, setNextSwapAt] = useState<number | null>(null)
  const [autoStopAt, setAutoStopAt] = useState<number | null>(null)
  const [logs, setLogs] = useState<LogLine[]>([])
  const [stats, setStats] = useState<Stats>({
    hashrateHps: null,
    unit: null,
    accepted: null,
    rejected: null,
    gpus: null,
    lastUpdate: 0,
  })
  const [now, setNow] = useState(Date.now())
  const [busy, setBusy] = useState(false)

  // Live clock (for countdowns)
  useEffect(() => {
    if (!running) return
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [running])

  // Rehydrate from main
  useEffect(() => {
    let cancelled = false
    window.minerAPI.getState().then((s) => {
      if (cancelled || !s) return
      setRunning(s.running)
      setStartedAt(s.startedAt)
      setMode((s.mode as MinerMode) ?? 'user')
      setNextSwapAt(s.nextSwapAt)
      setAutoStopAt(s.autoStopAt)
      setLogs(s.logs as LogLine[])
      setStats(s.stats as Stats)
    })
    return (): void => {
      cancelled = true
    }
  }, [])

  // Subscribe to live events
  useEffect(() => {
    const offLog = window.minerAPI.onLog((line) => {
      setLogs((prev) => {
        const next = prev.length > 500 ? prev.slice(-500) : prev.slice()
        next.push(line as LogLine)
        return next
      })
    })
    const offStats = window.minerAPI.onStats((s) => setStats(s as Stats))
    const offStarted = window.minerAPI.onStarted(({ startedAt }) => {
      setRunning(true)
      setStartedAt(startedAt)
    })
    const offExit = window.minerAPI.onExit(({ code }) => {
      setRunning(false)
      setStartedAt(null)
      setNextSwapAt(null)
      setAutoStopAt(null)
      setMode('user')
      addToast({
        title: t('mining.stoppedToast'),
        description: t('mining.minerExited', { code: code ?? 'n/a' }),
        color: code === 0 || code == null ? 'default' : 'warning',
      })
    })
    const offState = window.minerAPI.onState((s) => {
      const state = s as MinerState
      setMode(state.mode)
      setNextSwapAt(state.nextSwapAt)
      setAutoStopAt(state.autoStopAt)
      setRunning(state.running)
      setStartedAt(state.startedAt)
    })
    return (): void => {
      offLog()
      offStats()
      offStarted()
      offExit()
      offState()
    }
  }, [t])

  useEffect(() => saveJson(CONFIG_STORAGE_KEY, config), [config])
  useEffect(() => saveJson(OPTIONS_STORAGE_KEY, options), [options])

  // Donation toggle mid-session — ask main to apply without restart.
  useEffect(() => {
    if (!running) return
    window.minerAPI.setDonation(options.donation)
  }, [options.donation, running])

  const { data: wallets = [] } = useRequest<DbWallet[], Error[]>(
    () => window.dbAPI.getWallets() as Promise<DbWallet[]>,
    { cacheKey: 'dashboard-wallets-mining' },
  )

  const ready = useMemo(
    () =>
      !!config.binaryPath.trim() &&
      !!config.walletAddress.trim() &&
      !!config.pool.trim(),
    [config],
  )

  const handleConfigChange = useCallback((patch: Partial<MinerConfig>) => {
    setConfig((c) => ({ ...c, ...patch }))
  }, [])

  const handleOptionsChange = useCallback((patch: Partial<MinerOptions>) => {
    setOptions((o) => ({ ...o, ...patch }))
  }, [])

  const handlePickBinary = useCallback(async () => {
    const p = await window.minerAPI.pickBinary()
    if (p) setConfig((c) => ({ ...c, binaryPath: p }))
  }, [])

  const handleStart = useCallback(async () => {
    try {
      setBusy(true)
      const state = (await window.minerAPI.start(config, options)) as MinerState
      setRunning(state.running)
      setStartedAt(state.startedAt)
      setLogs(state.logs)
      setMode(state.mode)
      setNextSwapAt(state.nextSwapAt)
      setAutoStopAt(state.autoStopAt)
    } catch (err) {
      addToast({
        title: t('mining.launchFailed'),
        description:
          err instanceof Error
            ? err.message
            : t('mining.launchFailedDescription'),
        color: 'danger',
      })
    } finally {
      setBusy(false)
    }
  }, [config, options, t])

  const handleStop = useCallback(async () => {
    try {
      setBusy(true)
      await window.minerAPI.stop()
    } catch {
      addToast({
        title: t('mining.stopFailed'),
        description: '',
        color: 'danger',
      })
    } finally {
      setBusy(false)
    }
  }, [t])

  const donationCountdown =
    running && nextSwapAt ? Math.max(0, nextSwapAt - now) : null
  const autoStopCountdown =
    running && autoStopAt ? Math.max(0, autoStopAt - now) : null

  return (
    <main className="mx-auto max-w-7xl space-y-6 py-2">
      <header className="flex flex-wrap items-end justify-between gap-4 py-8">
        <div>
          <h1 className="flex items-center gap-2.5 text-[28px] font-semibold tracking-tight text-foreground">
            <LuPickaxe size={24} className="text-primary" />
            {t('mining.title')}
          </h1>
          <p className="mt-1 text-sm text-riven-muted">
            {t('mining.subtitle')}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {running && mode === 'donation' && (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/40 bg-primary/10 px-2.5 py-1 text-[11px] font-medium text-primary">
              <LuHandHeart size={11} />
              {t('mining.donationActive')}
              {donationCountdown != null && (
                <span className="text-primary/80">
                  {formatCountdown(donationCountdown)}
                </span>
              )}
            </span>
          )}

          <span
            className={cn(
              'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium',
              running
                ? mode === 'donation'
                  ? 'border-primary/40 bg-primary/10 text-primary'
                  : 'border-success/40 bg-success/10 text-success'
                : 'border-riven-border bg-white/[0.03] text-riven-muted',
            )}
          >
            <span
              className={cn(
                'inline-block h-1.5 w-1.5 rounded-full',
                running
                  ? mode === 'donation'
                    ? 'animate-pulse bg-primary'
                    : 'animate-pulse bg-success'
                  : 'bg-riven-muted',
              )}
            />
            {running
              ? mode === 'donation'
                ? t('mining.modeDonation')
                : t('mining.modeUser')
              : t('mining.stopped')}
          </span>

          {running ? (
            <Button
              variant="danger"
              startContent={<LuCircleStop size={16} />}
              onClick={handleStop}
              isLoading={busy}
            >
              {t('mining.stop')}
            </Button>
          ) : (
            <Button
              variant="primary"
              startContent={<LuCirclePlay size={16} />}
              onClick={handleStart}
              isLoading={busy}
              isDisabled={!ready}
              title={
                !ready ? 'Configure binary, wallet, and pool first' : undefined
              }
            >
              {t('mining.start')}
            </Button>
          )}
        </div>
      </header>

      {!ready && !running && (
        <div className="rounded-lg border border-primary/30 bg-primary/[0.04] p-4">
          <p className="text-sm font-medium text-foreground">
            {t('mining.notConfigured')}
          </p>
          <p className="mt-1 text-xs leading-relaxed text-riven-muted">
            {t('mining.notConfiguredBody')}
          </p>
        </div>
      )}

      {running && (donationCountdown != null || autoStopCountdown != null) && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {donationCountdown != null && (
            <CountdownCard
              icon={<LuHandHeart size={14} className="text-primary" />}
              label={
                mode === 'donation'
                  ? t('mining.donationEndsIn')
                  : t('mining.nextDonationIn')
              }
              value={formatCountdown(donationCountdown)}
            />
          )}
          {autoStopCountdown != null && (
            <CountdownCard
              icon={<LuCircleStop size={14} className="text-warning" />}
              label={t('mining.autoStopIn')}
              value={formatCountdown(autoStopCountdown)}
            />
          )}
        </div>
      )}

      <MinerHero
        running={running}
        mode={mode}
        startedAt={startedAt}
        stats={stats}
        pool={config.pool}
      />

      <MinerConfigCard
        config={config}
        options={options}
        onConfigChange={handleConfigChange}
        onOptionsChange={handleOptionsChange}
        wallets={wallets}
        disabled={running}
        running={running}
        onPickBinary={handlePickBinary}
      />

      <MinerLogs logs={logs} onClear={() => setLogs([])} />
    </main>
  )
}

const CountdownCard: FC<{
  icon: React.ReactNode
  label: string
  value: string
}> = ({ icon, label, value }) => (
  <div className="flex items-center gap-3 rounded-lg border border-riven-border bg-riven-surface px-4 py-3">
    {icon}
    <div className="flex-1">
      <p className="text-[10px] uppercase tracking-wider text-riven-muted">
        {label}
      </p>
      <p className="mt-0.5 font-mono text-sm tabular-nums text-foreground">
        {value}
      </p>
    </div>
  </div>
)

export default Mining
