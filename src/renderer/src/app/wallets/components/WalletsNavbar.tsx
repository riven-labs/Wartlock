import { CreateWalletModal } from '@renderer/app/components/CreateWalletModal'
import { ImportDbModal } from '@renderer/app/components/ImportDbModal'
import { ImportPrivateKeyModal } from '@renderer/app/components/ImportPrivateKeyModal'
import { RecoverWalletModal } from '@renderer/app/components/RecoverWalletModal'
import { Button } from '@renderer/components/ui/button'
import {
  Dropdown,
  DropdownContent,
  DropdownItem,
  DropdownTrigger,
} from '@renderer/components/ui/dropdown'
import { useDisclosure } from '@renderer/hooks/use-disclosure'
import type { FC } from 'react'
import { useTranslation } from 'react-i18next'
import { LuChevronDown } from 'react-icons/lu'

export const WalletsNavbar: FC = () => {
  const { t } = useTranslation()
  const pkModal = useDisclosure()
  const dbModal = useDisclosure()
  const recoverModal = useDisclosure()

  return (
    <header className="flex items-center justify-between py-8">
      <div>
        <h1 className="text-[28px] font-semibold tracking-tight text-foreground">
          {t('dashboard.title')}
        </h1>
        <p className="mt-1 text-sm text-riven-muted">
          {t('dashboard.subtitle')}
        </p>
      </div>
      <div className="flex items-center gap-3">
        <Dropdown>
          <DropdownTrigger asChild>
            <Button variant="outline" endContent={<LuChevronDown size={14} />}>
              {t('importWallet.title')}
            </Button>
          </DropdownTrigger>
          <DropdownContent className="min-w-[260px]">
            <DropdownItem
              description="From a 12/24-word mnemonic"
              onSelect={recoverModal.onOpen}
            >
              {t('common.recoverWallet')}
            </DropdownItem>
            <DropdownItem
              description="Paste a hex-encoded private key"
              onSelect={pkModal.onOpen}
            >
              {t('importWallet.byPrivateKey')}
            </DropdownItem>
            <DropdownItem
              description="Batch import from a Wartlock .db file"
              onSelect={dbModal.onOpen}
            >
              {t('importWallet.fromDbFile')}
            </DropdownItem>
          </DropdownContent>
        </Dropdown>

        <CreateWalletModal />

        <RecoverWalletModal
          isOpen={recoverModal.isOpen}
          onClose={recoverModal.onClose}
        />
        <ImportPrivateKeyModal
          isOpen={pkModal.isOpen}
          onClose={pkModal.onClose}
        />
        <ImportDbModal isOpen={dbModal.isOpen} onClose={dbModal.onClose} />
      </div>
    </header>
  )
}
