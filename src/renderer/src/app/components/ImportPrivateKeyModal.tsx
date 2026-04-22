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
import { LuKey } from 'react-icons/lu'
import { useWallet } from '../wallets/WalletContext'

const PRIVATE_KEY_REGEX = /^[0-9a-fA-F]{64}$/
const WALLET_PASSWORD_REGEX = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}/

type Props = {
  isOpen: boolean
  onClose: () => void
}

export const ImportPrivateKeyModal: FC<Props> = ({ isOpen, onClose }) => {
  const { refreshAsync } = useWallet()
  const { t } = useTranslation()
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const onSubmit = async (
    e: React.FormEvent<HTMLFormElement>,
  ): Promise<void> => {
    e.preventDefault()
    const data = Object.fromEntries(new FormData(e.currentTarget)) as {
      name: string
      privateKey: string
      password: string
      confirmPassword: string
    }

    if (!PRIVATE_KEY_REGEX.test(data.privateKey.trim())) {
      addToast({
        title: t('importWallet.importFailed'),
        description: t('importWallet.invalidPrivateKey'),
        color: 'danger',
      })
      return
    }
    if (!WALLET_PASSWORD_REGEX.test(data.password)) {
      addToast({
        title: t('toasts.invalidPassword.title'),
        description: t('toasts.invalidPassword.description'),
        color: 'danger',
      })
      return
    }
    if (data.password !== data.confirmPassword) {
      addToast({
        title: t('toasts.passwordMismatch.title'),
        description: t('toasts.passwordMismatch.description'),
        color: 'danger',
      })
      return
    }

    try {
      setSubmitting(true)
      const { address, privateKey } = await window.walletAPI.walletFromPkHex(
        data.privateKey.trim(),
      )
      const { encrypted, salt } = await window.cryptoAPI.encryptPrivateKey(
        privateKey,
        data.password,
      )
      await window.dbAPI.insertWallet(data.name, address, encrypted, salt)

      addToast({
        title: t('importWallet.imported'),
        description: t('importWallet.importedDescription'),
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
          title: t('importWallet.importFailed'),
          description: t('importWallet.importFailedDescription'),
          color: 'danger',
        })
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <ModalHeader icon={<LuKey size={18} className="text-primary" />}>
        <ModalTitle>{t('importWallet.byPrivateKey')}</ModalTitle>
        <ModalDescription>
          {t('importWallet.byPrivateKeyDescription')}
        </ModalDescription>
      </ModalHeader>

      <ModalBody>
        <Form id="import-pk-form" onSubmit={onSubmit}>
          <Input
            name="name"
            label={t('common.walletName')}
            isRequired
            autoFocus
          />
          <Input
            name="privateKey"
            label={t('importWallet.privateKey')}
            placeholder="64-character hex string"
            isRequired
            className="font-mono"
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
        <Button
          type="submit"
          form="import-pk-form"
          variant="primary"
          isLoading={submitting}
        >
          {t('common.continue')}
        </Button>
      </ModalFooter>
    </Modal>
  )
}
