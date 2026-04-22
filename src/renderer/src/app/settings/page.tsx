import type { FC } from 'react'
import { WalletProvider } from '../wallets/WalletContext'
import { SettingsForm } from './components/SettingsForm'
import { SettingsNavbar } from './components/SettingsNavbar'

const Settings: FC = () => {
  return (
    <WalletProvider>
      <main className="mx-auto max-w-3xl py-2">
        <SettingsNavbar />
        <section className="mt-8">
          <SettingsForm />
        </section>
      </main>
    </WalletProvider>
  )
}

export default Settings
