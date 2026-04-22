import { PasswordInput } from '@renderer/components/PasswordInput'
import { Button } from '@renderer/components/ui/button'
import { Form } from '@renderer/components/ui/form'
import {
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  ModalTitle,
} from '@renderer/components/ui/modal'
import { addToast } from '@renderer/components/ui/toast'
import { Tooltip } from '@renderer/components/ui/tooltip'
import { useDisclosure } from '@renderer/hooks/use-disclosure'
import type { FC } from 'react'
import { useTranslation } from 'react-i18next'
import { LuEye, LuLock } from 'react-icons/lu'
import { useNavigate } from 'react-router'

interface PasswordModalProps {
  walletId: string
}

export const PasswordModal: FC<PasswordModalProps> = ({ walletId }) => {
  const { isOpen, onOpen, onClose, onOpenChange } = useDisclosure()
  const navigate = useNavigate()
  const { t } = useTranslation()

  const onSubmit = async (
    e: React.FormEvent<HTMLFormElement>,
  ): Promise<void> => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const password = formData.get('password') as string

    try {
      const walletData = await window.dbAPI.getWalletById(Number(walletId))
      const decrypted = await window.cryptoAPI.decryptPrivateKey(
        walletData.pk,
        password,
        walletData.salt,
      )

      if (!decrypted) {
        addToast({
          title: t('passwordModal.error'),
          description: t('passwordModal.invalidPasswordError'),
          color: 'danger',
        })
        return
      }

      await window.storageAPI.storePrivateKey(walletData.address, decrypted)

      addToast({
        title: t('passwordModal.success'),
        description: t('passwordModal.successMessage'),
        color: 'success',
      })

      navigate(`/wallet/${walletId}`, { viewTransition: true })
      onClose()
    } catch {
      addToast({
        title: t('passwordModal.error'),
        description: t('passwordModal.errorMessage'),
        color: 'danger',
      })
    }
  }

  return (
    <>
      <Tooltip content={t('passwordModal.viewDetails')}>
        <button
          onClick={onOpen}
          className="rounded-md p-2 text-riven-muted transition-colors hover:bg-white/5 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
          aria-label={t('passwordModal.viewDetails')}
        >
          <LuEye size={18} />
        </button>
      </Tooltip>

      <Modal isOpen={isOpen} onOpenChange={onOpenChange} size="md">
        <ModalHeader icon={<LuLock size={18} className="text-primary" />}>
          <ModalTitle>{t('passwordModal.title')}</ModalTitle>
          <p className="text-sm leading-relaxed text-riven-muted">
            Enter your password to unlock and view wallet details.
          </p>
        </ModalHeader>

        <ModalBody>
          <Form onSubmit={onSubmit} id="password-modal">
            <PasswordInput
              name="password"
              label={t('common.password')}
              isRequired
              autoFocus
            />
          </Form>
        </ModalBody>

        <ModalFooter>
          <Button variant="ghost" onClick={onClose}>
            {t('passwordModal.cancel')}
          </Button>
          <Button type="submit" form="password-modal" variant="primary">
            {t('passwordModal.confirm')}
          </Button>
        </ModalFooter>
      </Modal>
    </>
  )
}
