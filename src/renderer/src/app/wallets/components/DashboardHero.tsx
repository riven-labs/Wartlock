import { Sparkline } from '@renderer/components/ui/sparkline'
import { cn } from '@renderer/lib/cn'
import { useRequest } from 'ahooks'
import { useMemo, type FC } from 'react'
import { useTranslation } from 'react-i18next'
import {
  LuArrowDownRight,
  LuArrowUpRight,
  LuSparkles,
  LuTrendingUp,
  LuWallet,
} from 'react-icons/lu'
import type { LiveBalances } from '../useLiveBalances'

type Market = {
  priceUsd: number
  change24hPct: number | null
  change7dPct: number | null
  volume24h: number | null
  marketCap: number | null
  high24h: number | null
  low24h: number | null
  ath: number | null
  athChangePct: number | null
}

type Props = {
  live: LiveBalances
  walletCount: number
}

const formatCompact = (n: number | null | undefined): string => {
  if (n == null || Number.isNaN(n)) return '—'
  if (n >= 1e9) return `$${(n / 1e9).toFixed(2)}B`
  if (n >= 1e6) return `$${(n / 1e6).toFixed(2)}M`
  if (n >= 1e3) return `$${(n / 1e3).toFixed(2)}K`
  return `$${n.toFixed(2)}`
}

const formatPrice = (n: number | null | undefined): string => {
  if (n == null || Number.isNaN(n)) return '—'
  if (n >= 1) return `$${n.toFixed(2)}`
  if (n >= 0.01) return `$${n.toFixed(4)}`
  return `$${n.toFixed(6)}`
}

export const DashboardHero: FC<Props> = ({ live, walletCount }) => {
  const { t } = useTranslation()

  const { data: market } = useRequest<Market | null, Error[]>(
    () => window.walletAPI.fetchWarthogMarket(),
    {
      cacheKey: 'wart-market',
      pollingInterval: 5 * 60_000,
      staleTime: 5 * 60_000,
    },
  )

  const { data: priceHistory = [] } = useRequest<
    Array<{ t: number; p: number }>,
    Error[]
  >(() => window.walletAPI.fetchWarthogPriceHistory(7), {
    cacheKey: 'wart-history-7d',
    staleTime: 15 * 60_000,
  })

  const totalWart = useMemo(() => {
    let sum = 0
    for (const b of Object.values(live.balances)) {
      if (b.current != null) sum += b.current
    }
    return sum
  }, [live.balances])

  const totalUsd = totalWart * live.priceUsd
  const change24h = market?.change24hPct
  const change7d = market?.change7dPct
  const positive24h = (change24h ?? 0) >= 0
  const positive7d = (change7d ?? 0) >= 0

  // Imputed portfolio 24h change: how the same WART holdings would have been
  // valued 24h ago. Not a real account-level P&L, just a sentiment indicator.
  const portfolio24hDeltaUsd =
    change24h != null && totalUsd > 0
      ? totalUsd - totalUsd / (1 + change24h / 100)
      : null

  return (
    <section
      className={cn(
        'relative overflow-hidden rounded-2xl border border-primary/20',
        'bg-[linear-gradient(135deg,rgba(47,111,235,0.12)_0%,rgba(47,111,235,0.02)_45%,rgba(0,0,0,0.4)_100%)]',
      )}
    >
      {/* Ambient grid texture */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.035]"
        style={{
          backgroundImage:
            'linear-gradient(to right, #fff 1px, transparent 1px), linear-gradient(to bottom, #fff 1px, transparent 1px)',
          backgroundSize: '32px 32px',
        }}
      />

      <div className="relative grid grid-cols-1 divide-riven-border lg:grid-cols-[1.15fr_1fr] lg:divide-x">
        {/* Portfolio panel */}
        <div className="p-8">
          <div className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wider text-primary">
            <span className="relative flex h-1.5 w-1.5">
              {live.refreshing && (
                <span className="absolute inset-0 animate-ping rounded-full bg-primary/50" />
              )}
              <span className="relative inline-flex h-full w-full rounded-full bg-primary" />
            </span>
            {t('dashboard.hero.portfolio')}
          </div>

          <div className="mt-3 flex items-baseline gap-3">
            <p className="font-mono text-[56px] font-semibold tabular-nums leading-none tracking-tight text-foreground">
              {totalUsd > 0 ? `$${totalUsd.toFixed(2)}` : '$0.00'}
            </p>
            {portfolio24hDeltaUsd != null &&
              Math.abs(portfolio24hDeltaUsd) > 0.01 && (
                <span
                  className={cn(
                    'inline-flex items-center gap-0.5 rounded-full border px-2 py-0.5 text-xs font-medium tabular-nums',
                    positive24h
                      ? 'border-success/30 bg-success/10 text-success'
                      : 'border-danger/30 bg-danger/10 text-danger',
                  )}
                >
                  {positive24h ? (
                    <LuArrowUpRight size={11} />
                  ) : (
                    <LuArrowDownRight size={11} />
                  )}
                  ${Math.abs(portfolio24hDeltaUsd).toFixed(2)}
                </span>
              )}
          </div>

          <p className="mt-2 text-sm text-riven-muted">
            <span className="tabular-nums text-foreground">
              {totalWart.toFixed(4)}
            </span>{' '}
            WART ·{' '}
            <span className="tabular-nums text-foreground">{walletCount}</span>{' '}
            {walletCount === 1
              ? t('dashboard.hero.walletSingular')
              : t('dashboard.hero.walletPlural')}
          </p>

          <div className="mt-6 grid grid-cols-3 gap-4 border-t border-riven-border pt-5 text-xs">
            <MiniStat
              icon={<LuWallet size={12} />}
              label={t('dashboard.totalWallets')}
              value={walletCount}
            />
            <MiniStat
              icon={<LuTrendingUp size={12} />}
              label={`WART ${t('dashboard.hero.change24h')}`}
              value={change24h != null ? `${change24h.toFixed(2)}%` : '—'}
              accent={
                change24h == null
                  ? 'neutral'
                  : positive24h
                    ? 'success'
                    : 'danger'
              }
            />
            <MiniStat
              icon={<LuSparkles size={12} />}
              label={`WART ${t('dashboard.hero.change7d')}`}
              value={change7d != null ? `${change7d.toFixed(2)}%` : '—'}
              accent={
                change7d == null ? 'neutral' : positive7d ? 'success' : 'danger'
              }
            />
          </div>
        </div>

        {/* Market panel */}
        <div className="relative p-8">
          <p className="text-[11px] font-medium uppercase tracking-wider text-riven-muted">
            {t('dashboard.hero.wartPrice')}
          </p>
          <div className="mt-3 flex items-baseline gap-3">
            <p className="font-mono text-4xl font-semibold tabular-nums leading-none tracking-tight text-foreground">
              {formatPrice(market?.priceUsd)}
            </p>
            {change24h != null && (
              <span
                className={cn(
                  'inline-flex items-center gap-0.5 text-xs font-medium tabular-nums',
                  positive24h ? 'text-success' : 'text-danger',
                )}
              >
                {positive24h ? (
                  <LuArrowUpRight size={11} />
                ) : (
                  <LuArrowDownRight size={11} />
                )}
                {Math.abs(change24h).toFixed(2)}%
              </span>
            )}
          </div>

          {priceHistory.length > 0 ? (
            <div className="mt-5">
              <Sparkline
                values={priceHistory.map((p) => p.p)}
                strokeClassName={positive24h ? 'text-primary' : 'text-danger'}
                fillClassName={
                  positive24h ? 'text-primary/15' : 'text-danger/15'
                }
                width={340}
                height={72}
                strokeWidth={1.75}
                className="h-[72px] w-full"
              />
              <p className="mt-1 text-[10px] uppercase tracking-wider text-riven-muted">
                7-day price
              </p>
            </div>
          ) : (
            <div className="mt-5 h-[72px] animate-pulse rounded-lg bg-white/[0.03]" />
          )}

          <div className="mt-6 grid grid-cols-2 gap-4 border-t border-riven-border pt-5 text-xs">
            <MiniStat
              label={t('analytics.volume24h')}
              value={formatCompact(market?.volume24h)}
            />
            <MiniStat
              label={t('analytics.marketCap')}
              value={formatCompact(market?.marketCap)}
            />
          </div>
        </div>
      </div>
    </section>
  )
}

const MiniStat: FC<{
  icon?: React.ReactNode
  label: string
  value: React.ReactNode
  accent?: 'success' | 'danger' | 'neutral'
}> = ({ icon, label, value, accent = 'neutral' }) => (
  <div>
    <p className="flex items-center gap-1 text-[10px] uppercase tracking-wider text-riven-muted">
      {icon}
      {label}
    </p>
    <p
      className={cn(
        'mt-0.5 font-mono text-sm tabular-nums',
        accent === 'success' && 'text-success',
        accent === 'danger' && 'text-danger',
        accent === 'neutral' && 'text-foreground',
      )}
    >
      {value}
    </p>
  </div>
)
