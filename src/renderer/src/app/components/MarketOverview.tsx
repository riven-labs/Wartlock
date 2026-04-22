import { Sparkline } from '@renderer/components/ui/sparkline'
import { cn } from '@renderer/lib/cn'
import { useRequest } from 'ahooks'
import type { FC } from 'react'
import { useTranslation } from 'react-i18next'
import { LuArrowDownRight, LuArrowUpRight } from 'react-icons/lu'

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

const ChangePill: FC<{ pct: number | null | undefined; label?: string }> = ({
  pct,
  label,
}) => {
  if (pct == null) return null
  const positive = pct >= 0
  const Icon = positive ? LuArrowUpRight : LuArrowDownRight
  return (
    <span
      className={cn(
        'inline-flex items-center gap-0.5 text-xs font-medium tabular-nums',
        positive ? 'text-success' : 'text-danger',
      )}
    >
      <Icon size={12} />
      {Math.abs(pct).toFixed(2)}%
      {label && (
        <span className="ml-1 text-[10px] text-riven-muted">{label}</span>
      )}
    </span>
  )
}

export const MarketOverview: FC = () => {
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

  const change24h = market?.change24hPct
  const change7d = market?.change7dPct
  const positive = (change24h ?? 0) >= 0
  const sparkColor = positive ? 'text-primary' : 'text-danger'
  const sparkFill = positive ? 'text-primary/10' : 'text-danger/10'

  return (
    <section className="rounded-2xl border border-riven-border bg-riven-surface p-6">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex-1">
          <p className="text-[11px] font-medium uppercase tracking-wider text-riven-muted">
            {t('analytics.wartPrice')}
          </p>
          <div className="mt-1 flex items-baseline gap-3">
            <p className="text-4xl font-semibold tabular-nums tracking-tight text-foreground">
              {formatPrice(market?.priceUsd)}
            </p>
            <div className="flex items-center gap-3">
              <ChangePill pct={change24h} label="24h" />
              <ChangePill pct={change7d} label="7d" />
            </div>
          </div>
          <div className="mt-5 grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
            <Metric
              label={t('analytics.volume24h')}
              value={formatCompact(market?.volume24h)}
            />
            <Metric
              label={t('analytics.marketCap')}
              value={formatCompact(market?.marketCap)}
            />
            <Metric
              label={t('analytics.high24h')}
              value={formatPrice(market?.high24h)}
            />
            <Metric
              label={t('analytics.ath')}
              value={formatPrice(market?.ath)}
              sub={
                market?.athChangePct != null
                  ? `${market.athChangePct.toFixed(1)}% from ATH`
                  : undefined
              }
            />
          </div>
        </div>

        <div className="w-full lg:w-[260px]">
          {priceHistory.length > 0 ? (
            <Sparkline
              values={priceHistory.map((p) => p.p)}
              strokeClassName={sparkColor}
              fillClassName={sparkFill}
              height={80}
              width={260}
              strokeWidth={1.75}
              className="h-20"
            />
          ) : (
            <div className="h-20 animate-pulse rounded-lg bg-white/[0.03]" />
          )}
          <p className="mt-2 text-[10px] uppercase tracking-wider text-riven-muted">
            7-day price
          </p>
        </div>
      </div>
    </section>
  )
}

const Metric: FC<{ label: string; value: string; sub?: string }> = ({
  label,
  value,
  sub,
}) => (
  <div>
    <p className="text-[10px] uppercase tracking-wider text-riven-muted">
      {label}
    </p>
    <p className="mt-0.5 font-medium tabular-nums text-foreground">{value}</p>
    {sub && <p className="mt-0.5 text-[10px] text-riven-muted">{sub}</p>}
  </div>
)
