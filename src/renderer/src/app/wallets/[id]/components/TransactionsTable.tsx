import { ExplorerLink } from '@renderer/components/ExplorerLink'
import { Pagination } from '@renderer/components/ui/pagination'
import { Spinner } from '@renderer/components/ui/spinner'
import { Table } from '@renderer/components/ui/table'
import { useRequest } from 'ahooks'
import { useMemo, type FC } from 'react'
import { useTranslation } from 'react-i18next'
import { useParams } from 'react-router'
import type { Wallet } from '../../types'
import type { Transaction } from '../types'

const PAGE_SIZE = 10

type ColumnKey =
  | 'hash'
  | 'timestamp'
  | 'amount'
  | 'fee'
  | 'sender'
  | 'recipient'

type TransactionsTableProps = {
  filterValue: string
  page: number
  setPage: (value: number) => void
}

export const TransactionsTable: FC<TransactionsTableProps> = ({
  filterValue,
  page,
  setPage,
}) => {
  const { walletId } = useParams<{ walletId: string }>()
  const { t } = useTranslation()

  const columns = useMemo(
    () => [
      { key: 'hash' as ColumnKey, label: t('walletDetails.tableTitles.hash') },
      {
        key: 'timestamp' as ColumnKey,
        label: t('walletDetails.tableTitles.timestamp'),
      },
      {
        key: 'amount' as ColumnKey,
        label: t('walletDetails.tableTitles.amount'),
      },
      { key: 'fee' as ColumnKey, label: t('walletDetails.tableTitles.fee') },
      {
        key: 'sender' as ColumnKey,
        label: t('walletDetails.tableTitles.sender'),
      },
      {
        key: 'recipient' as ColumnKey,
        label: t('walletDetails.tableTitles.recipient'),
      },
    ],
    [t],
  )

  const { data: walletAddress, loading: walletLoading } = useRequest<
    Wallet['address'],
    Error[]
  >(async () => {
    if (!walletId) throw new Error('Wallet ID is missing from the URL')
    const walletData = await window.dbAPI.getWalletById(Number(walletId))
    if (walletData?.address) return walletData.address
    throw new Error('Wallet address not found')
  })

  const { data: transactions = [], loading: transactionsLoading } = useRequest<
    Transaction[],
    Error[]
  >(
    async () => {
      if (!walletAddress) return []
      const txs = await window.walletAPI.getWalletTransactions(walletAddress)
      return txs || []
    },
    {
      ready: Boolean(walletAddress),
      cacheKey: `wallet-txs-${walletAddress}`,
      refreshDeps: [walletAddress],
      pollingInterval: 15_000,
      staleTime: 30_000,
    },
  )

  // Only show the loading state on the very first fetch. Subsequent polls
  // silently refresh the existing rows — no spinner flash every 15s.
  const isInitialLoad =
    (walletLoading || transactionsLoading) && transactions.length === 0

  const filteredItems = useMemo(() => {
    if (!filterValue) return transactions
    return transactions.filter((tx) =>
      tx.sender.toLowerCase().includes(filterValue.toLowerCase()),
    )
  }, [transactions, filterValue])

  const pages = Math.max(1, Math.ceil(filteredItems.length / PAGE_SIZE))

  const items = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE
    return filteredItems.slice(start, start + PAGE_SIZE)
  }, [page, filteredItems])

  const renderCell = (tx: Transaction, key: ColumnKey): React.ReactNode => {
    switch (key) {
      case 'hash':
        return <ExplorerLink value={tx.hash} kind="tx" showIcon />
      case 'timestamp': {
        // Wartscan returns timestamps in seconds. JS Date expects ms — without
        // the ×1000 multiplier everything shows up as Jan 1970.
        const raw = Number(tx.timestamp)
        const ms =
          !Number.isFinite(raw) || raw === 0
            ? NaN
            : raw < 1e12
              ? raw * 1000
              : raw
        return (
          <span className="text-xs text-riven-muted">
            {Number.isNaN(ms)
              ? '—'
              : new Date(ms).toLocaleString(undefined, {
                  year: 'numeric',
                  month: 'short',
                  day: '2-digit',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
          </span>
        )
      }
      case 'amount': {
        const isOutgoing = tx.sender === walletAddress
        return (
          <span
            className={`text-sm font-medium tabular-nums ${
              isOutgoing ? 'text-danger' : 'text-success'
            }`}
          >
            {isOutgoing ? '−' : '+'}
            {tx.amount}{' '}
            <span className="text-xs font-normal text-riven-muted">WART</span>
          </span>
        )
      }
      case 'fee':
        return (
          <span className="text-xs tabular-nums text-riven-muted">
            {tx.fee}
          </span>
        )
      case 'sender':
        return <ExplorerLink value={tx.sender} kind="address" />
      case 'recipient':
        return <ExplorerLink value={tx.recipient} kind="address" />
      default:
        return null
    }
  }

  return (
    <div className="space-y-4">
      <Table<Transaction, ColumnKey>
        aria-label="Transactions"
        columns={columns}
        rows={items}
        rowKey={(tx) => tx.hash}
        renderCell={renderCell}
        isLoading={isInitialLoad}
        loadingContent={<Spinner size="sm" className="text-primary" />}
        emptyContent={
          <span className="text-sm text-riven-muted">
            {t('walletDetails.noTransactions')}
          </span>
        }
      />
      <div className="flex justify-end">
        <Pagination page={page} total={pages} onChange={setPage} />
      </div>
    </div>
  )
}
