import { ExplorerLink } from '@renderer/components/ExplorerLink'
import { Pagination } from '@renderer/components/ui/pagination'
import { Table } from '@renderer/components/ui/table'
import { cn } from '@renderer/lib/cn'
import { useMemo, useState, type FC } from 'react'
import { useTranslation } from 'react-i18next'
import { LuArrowDown, LuArrowUp } from 'react-icons/lu'
import { type Wallet } from '../types'
import type { LiveBalances } from '../useLiveBalances'
import { useWallet } from '../WalletContext'
import { PasswordModal } from './PasswordModal'

const PAGE_SIZE = 10

type ColumnKey =
  | 'name'
  | 'address'
  | 'balance'
  | 'balanceUsd'
  | 'lastIdentifiedDate'
  | 'actions'

type Props = {
  live: LiveBalances
}

export const WalletsTable: FC<Props> = ({ live }) => {
  const { wallets, loading } = useWallet()
  const [page, setPage] = useState(1)
  const { t } = useTranslation()

  const columns = useMemo(
    () => [
      {
        key: 'name' as ColumnKey,
        label: t('walletDetails.tableTitles.sender'),
      },
      {
        key: 'address' as ColumnKey,
        label: t('walletDetails.tableTitles.recipient'),
      },
      {
        key: 'balance' as ColumnKey,
        label: t('walletDetails.balanceWART'),
      },
      {
        key: 'balanceUsd' as ColumnKey,
        label: 'USD',
      },
      {
        key: 'lastIdentifiedDate' as ColumnKey,
        label: t('walletDetails.tableTitles.timestamp'),
      },
      {
        key: 'actions' as ColumnKey,
        label: t('walletDetails.tableTitles.actions'),
        align: 'end' as const,
      },
    ],
    [t],
  )

  const pages = Math.max(1, Math.ceil(wallets.length / PAGE_SIZE))

  const items = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE
    return wallets.slice(start, start + PAGE_SIZE)
  }, [page, wallets])

  const renderCell = (wallet: Wallet, key: ColumnKey): React.ReactNode => {
    const entry = live.balances[wallet.address]
    const current = entry?.current ?? null
    const previous = entry?.previous ?? null
    const delta = current != null && previous != null ? current - previous : 0

    switch (key) {
      case 'name':
        return (
          <span className="text-sm font-medium text-foreground">
            {wallet.name}
          </span>
        )
      case 'address':
        return <ExplorerLink value={wallet.address} kind="address" showIcon />
      case 'balance':
        return (
          <div className="flex flex-col">
            <span
              className={cn(
                'text-sm font-medium tabular-nums text-foreground transition-colors',
                delta > 0 && 'text-success',
                delta < 0 && 'text-danger',
              )}
            >
              {current != null ? current.toFixed(4) : '—'}{' '}
              <span className="text-xs font-normal text-riven-muted">WART</span>
            </span>
            {delta !== 0 && current != null && (
              <span
                className={cn(
                  'mt-0.5 inline-flex items-center gap-0.5 text-[11px] tabular-nums',
                  delta > 0 ? 'text-success' : 'text-danger',
                )}
              >
                {delta > 0 ? (
                  <LuArrowUp size={10} />
                ) : (
                  <LuArrowDown size={10} />
                )}
                {delta > 0 ? '+' : ''}
                {delta.toFixed(4)}
              </span>
            )}
          </div>
        )
      case 'balanceUsd':
        return (
          <span className="text-xs tabular-nums text-riven-muted">
            {current != null ? `$${(current * live.priceUsd).toFixed(2)}` : '—'}
          </span>
        )
      case 'lastIdentifiedDate':
        return (
          <span className="text-xs text-riven-muted">
            {new Date(wallet.last_modified).toLocaleDateString(undefined, {
              year: 'numeric',
              month: 'short',
              day: '2-digit',
            })}
          </span>
        )
      case 'actions':
        return (
          <div className="flex justify-end">
            <PasswordModal walletId={wallet.id} />
          </div>
        )
      default:
        return null
    }
  }

  return (
    <div className="space-y-4">
      <Table<Wallet, ColumnKey>
        aria-label="Wallets"
        columns={columns}
        rows={items}
        rowKey={(w) => w.id}
        renderCell={renderCell}
        isLoading={loading}
        emptyContent={
          <span className="text-sm text-riven-muted">
            {t('wallets.noWallets')}
          </span>
        }
      />
      <div className="flex justify-end">
        <Pagination page={page} total={pages} onChange={setPage} />
      </div>
    </div>
  )
}
