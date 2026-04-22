import { FC, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { LuWallet } from 'react-icons/lu'
import { ConnectionBanner } from './components/ConnectionBanner'
import { DashboardHero } from './components/DashboardHero'
import { WalletsNavbar } from './components/WalletsNavbar'
import { WalletsTable } from './components/WalletsTable'
import { useLiveBalances } from './useLiveBalances'
import { useWallet, WalletProvider } from './WalletContext'

const SectionHeader: FC<{
  icon: ReactNode
  title: string
  subtitle?: ReactNode
}> = ({ icon, title, subtitle }) => (
  <div className="flex items-center gap-3">
    <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-riven-border bg-white/[0.03] text-primary">
      {icon}
    </span>
    <div>
      <h2 className="text-sm font-semibold tracking-tight text-foreground">
        {title}
      </h2>
      {subtitle && (
        <p className="mt-0.5 text-xs text-riven-muted">{subtitle}</p>
      )}
    </div>
  </div>
)

const Dashboard: FC = () => {
  const { wallets } = useWallet()
  const live = useLiveBalances(wallets)
  const { t } = useTranslation()

  return (
    <main className="mx-auto max-w-7xl space-y-8 py-2">
      <WalletsNavbar />
      <ConnectionBanner live={live} />
      <DashboardHero live={live} walletCount={wallets.length} />

      <section className="space-y-4">
        <SectionHeader
          icon={<LuWallet size={16} />}
          title={t('dashboard.section.wallets')}
          subtitle={
            wallets.length === 1
              ? t('dashboard.section.walletsSubSingular')
              : t('dashboard.section.walletsSubPlural', {
                  count: wallets.length,
                })
          }
        />
        <WalletsTable live={live} />
      </section>
    </main>
  )
}

const Wallets: FC = () => {
  return (
    <WalletProvider>
      <Dashboard />
    </WalletProvider>
  )
}

export default Wallets
