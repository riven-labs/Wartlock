import { PasswordInput } from '@renderer/components/PasswordInput'
import { Button } from '@renderer/components/ui/button'
import { Form } from '@renderer/components/ui/form'
import { Input } from '@renderer/components/ui/input'
import {
  Modal,
  ModalBody,
  ModalDescription,
  ModalFooter,
  ModalHeader,
  ModalTitle,
} from '@renderer/components/ui/modal'
import { addToast } from '@renderer/components/ui/toast'
import { useState, type FC } from 'react'
import { useTranslation } from 'react-i18next'
import { LuKeyRound } from 'react-icons/lu'
import { useWallet } from '../wallets/WalletContext'

const WALLET_PASSWORD_REGEX = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}/

type Props = {
  isOpen: boolean
  onClose: () => void
}

export const RecoverWalletModal: FC<Props> = ({ isOpen, onClose }) => {
  const { refreshAsync } = useWallet()
  const [password, setPassword] = useState('')
  const { t } = useTranslation()

  const onSubmit = async (
    e: React.FormEvent<HTMLFormElement>,
  ): Promise<void> => {
    e.preventDefault()
    const formData = Object.fromEntries(new FormData(e.currentTarget)) as {
      wallet: string
      mnemonic: string
      password: string
      confirmPassword: string
    }

    const { wallet, mnemonic, password, confirmPassword } = formData

    if (!WALLET_PASSWORD_REGEX.test(password)) {
      addToast({
        title: t('toasts.invalidPassword.title'),
        description: t('toasts.invalidPassword.description'),
        color: 'danger',
      })
      return
    }

    if (password !== confirmPassword) {
      addToast({
        title: t('toasts.passwordMismatch.title'),
        description: t('toasts.passwordMismatch.description'),
        color: 'danger',
      })
      return
    }

    try {
      const { address, privateKey } =
        await window.walletAPI.walletFromSeed(mnemonic)
      const { encrypted, salt } = await window.cryptoAPI.encryptPrivateKey(
        privateKey,
        password,
      )
      await window.dbAPI.insertWallet(wallet, address, encrypted, salt)

      addToast({
        title: t('toasts.walletRecovered.title'),
        description: t('toasts.walletRecovered.description'),
        color: 'success',
      })

      await refreshAsync()
      onClose()
    } catch (error) {
      if (
        error instanceof Error &&
        error?.message?.includes('UNIQUE constraint failed')
      ) {
        addToast({
          title: t('toasts.duplicateWallet.title'),
          description: t('toasts.duplicateWallet.description'),
          color: 'warning',
        })
      } else {
        addToast({
          title: t('toasts.recoveryError.title'),
          description: t('toasts.recoveryError.description'),
          color: 'danger',
        })
      }
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <ModalHeader icon={<LuKeyRound size={18} className="text-primary" />}>
        <ModalTitle>{t('recoverWallet.title')}</ModalTitle>
        <ModalDescription>{t('recoverWallet.description')}</ModalDescription>
      </ModalHeader>

      <ModalBody>
        <Form onSubmit={onSubmit} id="recover-wallet-modal">
          <Input
            name="wallet"
            label={t('common.walletName')}
            errorMessage={t('recoverWallet.errorWalletName')}
            isRequired
            autoFocus
          />
          <Input
            name="mnemonic"
            label={t('common.mnemonic')}
            errorMessage={t('recoverWallet.errorMnemonic')}
            isRequired
          />
          <PasswordInput
            name="password"
            label={t('common.password')}
            isRequired
            onValueChange={setPassword}
            validate={(v) =>
              !WALLET_PASSWORD_REGEX.test(v)
                ? t('recoverWallet.errorPassword')
                : undefined
            }
          />
          <PasswordInput
            name="confirmPassword"
            label={t('common.confirmPassword')}
            isRequired
            validate={(v) =>
              v !== password
                ? t('toasts.passwordMismatch.description')
                : undefined
            }
          />
        </Form>
      </ModalBody>

      <ModalFooter>
        <Button variant="ghost" onClick={onClose}>
          {t('passwordModal.cancel')}
        </Button>
        <Button type="submit" form="recover-wallet-modal" variant="primary">
          {t('common.recoverWallet')}
        </Button>
      </ModalFooter>
    </Modal>
  )
}
