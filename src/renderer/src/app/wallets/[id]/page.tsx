import { useState, type FC } from 'react'
import { TransactionsTable } from './components/TransactionsTable'
import { WalletActivity } from './components/WalletActivity'
import { WalletHeader, WalletToolbar } from './components/WalletNavbar'

const Wallet: FC = () => {
  const [filterValue, setFilterValue] = useState('')
  const [page, setPage] = useState(1)

  return (
    <main className="mx-auto max-w-7xl space-y-6 py-2">
      <WalletHeader />
      <WalletActivity />
      <WalletToolbar
        filterValue={filterValue}
        setFilterValue={setFilterValue}
        setPage={setPage}
      />
      <section>
        <TransactionsTable
          filterValue={filterValue}
          page={page}
          setPage={setPage}
        />
      </section>
    </main>
  )
}

export default Wallet
