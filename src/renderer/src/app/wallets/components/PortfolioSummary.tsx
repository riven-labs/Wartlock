import { Spinner } from '@renderer/components/ui/spinner'
import type { FC } from 'react'
import { useTranslation } from 'react-i18next'
import { LuWallet } from 'react-icons/lu'
import type { LiveBalances } from '../useLiveBalances'

type Props = {
  live: LiveBalances
  walletCount: number
}

export const PortfolioSummary: FC<Props> = ({ live, walletCount }) => {
  const { t } = useTranslation()

  let totalWart = 0
  for (const b of Object.values(live.balances)) {
    if (b.current != null) totalWart += b.current
  }
  const totalUsd = totalWart * live.priceUsd

  return (
    <section className="grid grid-cols-1 gap-3 sm:grid-cols-3">
      <Card
        label={t('dashboard.totalWallets')}
        value={walletCount}
        icon={<LuWallet size={14} />}
      />
      <Card
        label={t('dashboard.totalWart')}
        value={totalWart.toFixed(4)}
        suffix="WART"
      />
      <Card
        label={t('dashboard.totalUsd')}
        value={`$${totalUsd.toFixed(2)}`}
        refreshing={live.refreshing && totalWart === 0}
      />
    </section>
  )
}

const Card: FC<{
  label: string
  value: React.ReactNode
  suffix?: string
  icon?: React.ReactNode
  refreshing?: boolean
}> = ({ label, value, suffix, icon, refreshing }) => (
  <div className="rounded-xl border border-riven-border bg-riven-surface p-5">
    <div className="flex items-center gap-2">
      {icon && <span className="text-riven-muted">{icon}</span>}
      <p className="text-[11px] font-medium uppercase tracking-wider text-riven-muted">
        {label}
      </p>
    </div>
    <p className="mt-2 text-2xl font-semibold tabular-nums tracking-tight text-foreground">
      {refreshing ? <Spinner size="sm" className="text-primary" /> : value}{' '}
      {suffix && (
        <span className="text-sm font-normal text-riven-muted">{suffix}</span>
      )}
    </p>
  </div>
)
