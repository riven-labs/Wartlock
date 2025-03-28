import { useState, type FC } from 'react'
import { TransactionsTable } from './components/TransactionsTable'
import { WalletNavbar } from './components/WalletNavbar'

const Wallet: FC = () => {
  const [filterValue, setFilterValue] = useState('')
  const [page, setPage] = useState(1)

  return (
    <main className="space-y-10">
      <WalletNavbar
        filterValue={filterValue}
        setFilterValue={setFilterValue}
        setPage={setPage}
      />
      <section className="h-page rounded-[20px] bg-default-100 p-5">
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
