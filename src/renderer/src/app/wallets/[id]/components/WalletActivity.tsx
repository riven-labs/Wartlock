import { MetricCard } from '@renderer/components/ui/metric-card'
import { cn } from '@renderer/lib/cn'
import { useRequest } from 'ahooks'
import type { FC } from 'react'
import { useTranslation } from 'react-i18next'
import {
  LuArrowDownLeft,
  LuArrowUpRight,
  LuLayers,
  LuScale,
} from 'react-icons/lu'
import { useParams } from 'react-router'
import type { Transaction } from '../types'

export const WalletActivity: FC = () => {
  const { walletId } = useParams<{ walletId: string }>()
  const { t } = useTranslation()

  const { data: walletAddress } = useRequest<string | null, Error[]>(
    async () => {
      if (!walletId) return null
      const w = await window.dbAPI.getWalletById(Number(walletId))
      return w?.address ?? null
    },
    { cacheKey: `wallet-${walletId}-address`, refreshDeps: [walletId] },
  )

  const { data: transactions = [] } = useRequest<Transaction[], Error[]>(
    async () => {
      if (!walletAddress) return []
      return (await window.walletAPI.getWalletTransactions(walletAddress)) || []
    },
    {
      ready: !!walletAddress,
      cacheKey: `wallet-txs-${walletAddress}`,
      refreshDeps: [walletAddress],
      staleTime: 30_000,
    },
  )

  let sent = 0
  let received = 0
  let countOut = 0
  let countIn = 0
  let feesPaid = 0
  for (const tx of transactions) {
    const amount = parseFloat(String(tx.amount)) || 0
    const fee = parseFloat(String(tx.fee)) || 0
    if (tx.sender === walletAddress) {
      sent += amount
      countOut++
      feesPaid += fee
    } else if (tx.recipient === walletAddress) {
      received += amount
      countIn++
    }
  }
  const txCount = transactions.length
  const net = received - sent
  const netPositive = net >= 0
  const total = received + sent
  const inPct = total > 0 ? (received / total) * 100 : 0
  const outPct = total > 0 ? (sent / total) * 100 : 0

  return (
    <section className="space-y-4">
      <div className="flex items-baseline justify-between">
        <h2 className="text-[11px] font-medium uppercase tracking-wider text-riven-muted">
          {t('analytics.activityHeading')}
        </h2>
        {total > 0 && (
          <p className="text-xs text-riven-muted">
            <span className="tabular-nums text-foreground">
              {countIn + countOut}
            </span>{' '}
            {t('analytics.actionsTotal')}
          </p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <MetricCard
          label={t('analytics.received')}
          value={received.toFixed(4)}
          valueSuffix="WART"
          accent="success"
          icon={<LuArrowDownLeft size={15} />}
          sub={`${countIn} ${t('analytics.incoming')}`}
          subIcon={<LuArrowDownLeft size={11} />}
        />
        <MetricCard
          label={t('analytics.sent')}
          value={sent.toFixed(4)}
          valueSuffix="WART"
          accent="danger"
          icon={<LuArrowUpRight size={15} />}
          sub={`${countOut} ${t('analytics.outgoing')}`}
          subIcon={<LuArrowUpRight size={11} />}
        />
        <MetricCard
          label={t('analytics.netFlow')}
          value={`${netPositive ? '+' : ''}${net.toFixed(4)}`}
          valueSuffix="WART"
          accent={netPositive ? 'primary' : 'warning'}
          icon={<LuScale size={15} />}
          trend={
            total > 0 && (
              <div className="mt-4 space-y-1.5">
                <div className="flex h-1.5 overflow-hidden rounded-full bg-white/[0.05]">
                  <span
                    className="h-full bg-success/70"
                    style={{ width: `${inPct}%` }}
                  />
                  <span
                    className="h-full bg-danger/70"
                    style={{ width: `${outPct}%` }}
                  />
                </div>
                <div className="flex justify-between text-[10px] text-riven-muted">
                  <span>
                    <span className={cn('tabular-nums text-success')}>
                      {inPct.toFixed(0)}%
                    </span>{' '}
                    in
                  </span>
                  <span>
                    out{' '}
                    <span className={cn('tabular-nums text-danger')}>
                      {outPct.toFixed(0)}%
                    </span>
                  </span>
                </div>
              </div>
            )
          }
        />
        <MetricCard
          label={t('analytics.transactions')}
          value={txCount}
          accent="neutral"
          icon={<LuLayers size={15} />}
          sub={`${feesPaid.toFixed(8)} ${t('analytics.feesPaid')}`}
        />
      </div>
    </section>
  )
}
