import { ExplorerLink } from '@renderer/components/ExplorerLink'
import { Button } from '@renderer/components/ui/button'
import { Input } from '@renderer/components/ui/input'
import { useRequest } from 'ahooks'
import { useCallback, type FC } from 'react'
import { useTranslation } from 'react-i18next'
import { LuSearch } from 'react-icons/lu'
import { RiLogoutCircleRLine } from 'react-icons/ri'
import { useNavigate, useParams } from 'react-router'
import { CreateTransactionModal } from './CreateTransactionModal'
import { ReceiveWartModal } from './ReceiveWartModal'

type Wallet = {
  name: string
  address: string
}

export const WalletHeader: FC = () => {
  const { walletId } = useParams<{ walletId: string }>()
  const navigate = useNavigate()
  const { t } = useTranslation()

  const { data: walletData, loading: walletLoading } = useRequest<
    Wallet,
    Error[]
  >(
    async () => {
      if (!walletId) throw new Error('Wallet ID is missing from the URL')
      return (await window.dbAPI.getWalletById(Number(walletId))) as Wallet
    },
    { cacheKey: walletId, refreshDeps: [walletId], ready: !!walletId },
  )

  const { data: balanceData } = useRequest<
    { balanceWART: string | null; balanceUSD: number },
    Error[]
  >(
    async () => {
      if (!walletData) throw new Error('Wallet Data is missing')
      const peer = await window.dbAPI.getPeer()
      const balanceWART = await window.walletAPI.getBalance(
        peer,
        walletData.address,
      )
      const wartPrice = await window.walletAPI.fetchWarthogPrice()
      const num = balanceWART ? parseFloat(balanceWART) : 0
      const balanceUSD = num * wartPrice
      if (balanceWART != null) {
        await window.dbAPI.updateBalance(
          walletData.address,
          String(balanceWART),
        )
      }
      return { balanceWART, balanceUSD }
    },
    {
      cacheKey: `${walletId}-balance`,
      refreshDeps: [walletId],
      pollingInterval: 30_000,
      ready: !!walletData,
    },
  )

  const handleLogout = async (): Promise<void> => {
    if (walletData?.address) {
      await window.storageAPI.deletePrivateKey(String(walletData.address))
    }
    navigate('/')
  }

  const wart = balanceData?.balanceWART
  const usd = balanceData?.balanceUSD

  return (
    <div className="space-y-6 py-6">
      <div className="flex items-start justify-between gap-6">
        <div className="min-w-0">
          <p className="text-xs uppercase tracking-wider text-riven-muted">
            {t('walletDetails.wallet')}
          </p>
          <h1 className="mt-1 truncate text-[28px] font-semibold tracking-tight">
            {walletLoading
              ? t('walletDetails.loading')
              : walletData?.name || t('walletDetails.walletNotFound')}
          </h1>
          {walletData?.address && (
            <div className="mt-1">
              <ExplorerLink
                value={walletData.address}
                kind="address"
                showIcon
              />
            </div>
          )}
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleLogout}
          aria-label="Logout"
          className="hover:text-danger"
        >
          <RiLogoutCircleRLine size={16} />
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="rounded-xl border border-riven-border bg-riven-surface p-5">
          <p className="text-[11px] font-medium uppercase tracking-wider text-riven-muted">
            {t('walletDetails.balanceWART')}
          </p>
          <p className="mt-2 text-2xl font-semibold tabular-nums tracking-tight">
            {wart ?? '—'}{' '}
            <span className="text-sm font-normal text-riven-muted">WART</span>
          </p>
        </div>
        <div className="rounded-xl border border-riven-border bg-riven-surface p-5">
          <p className="text-[11px] font-medium uppercase tracking-wider text-riven-muted">
            {t('walletDetails.balanceUSD')}
          </p>
          <p className="mt-2 text-2xl font-semibold tabular-nums tracking-tight">
            {usd !== undefined ? `$${usd.toFixed(2)}` : '—'}
          </p>
        </div>
      </div>
    </div>
  )
}

type WalletToolbarProps = {
  filterValue: string
  setFilterValue: (value: string) => void
  setPage: (value: number) => void
}

export const WalletToolbar: FC<WalletToolbarProps> = ({
  filterValue,
  setFilterValue,
  setPage,
}) => {
  const { walletId } = useParams<{ walletId: string }>()
  const { t } = useTranslation()

  const { data: walletData } = useRequest<Wallet, Error[]>(
    async () => {
      if (!walletId) throw new Error('Wallet ID is missing from the URL')
      return (await window.dbAPI.getWalletById(Number(walletId))) as Wallet
    },
    { cacheKey: walletId, refreshDeps: [walletId], ready: !!walletId },
  )

  const onClear = useCallback(() => {
    setFilterValue('')
    setPage(1)
  }, [setFilterValue, setPage])

  const onSearchChange = useCallback(
    (value: string) => {
      setFilterValue(value)
      setPage(1)
    },
    [setFilterValue, setPage],
  )

  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="w-full sm:max-w-sm">
        <Input
          placeholder={t('walletDetails.searchBySender')}
          startContent={<LuSearch size={14} className="text-riven-muted" />}
          value={filterValue}
          isClearable
          onClear={onClear}
          onValueChange={onSearchChange}
        />
      </div>
      <div className="flex items-center gap-2">
        <ReceiveWartModal address={walletData?.address} />
        <CreateTransactionModal />
      </div>
    </div>
  )
}
