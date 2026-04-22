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
import { useDisclosure } from '@renderer/hooks/use-disclosure'
import { useState, type FC } from 'react'
import { useTranslation } from 'react-i18next'
import { GoPlus } from 'react-icons/go'
import { IoIosEye, IoIosEyeOff } from 'react-icons/io'
import { LuSparkles, LuWallet } from 'react-icons/lu'
import { MdOutlineContentCopy } from 'react-icons/md'
import { useWallet } from '../wallets/WalletContext'

const WALLET_PASSWORD_REGEX = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}/

type CreateWalletData = {
  name: string
  password: string
  passwordConfirm: string
}

export const CreateWalletModal: FC = () => {
  const { refreshAsync } = useWallet()
  const { isOpen, onClose, onOpen, onOpenChange } = useDisclosure()
  const [password, setPassword] = useState('')
  const [walletName, setWalletName] = useState('')
  const [mnemonic, setMnemonic] = useState('')
  const [showMnemonic, setShowMnemonic] = useState(false)
  const { t } = useTranslation()

  const reset = (): void => {
    setMnemonic('')
    setWalletName('')
    setPassword('')
    setShowMnemonic(false)
  }

  const onSubmit = async (
    e: React.FormEvent<HTMLFormElement>,
  ): Promise<void> => {
    e.preventDefault()
    const formData = Object.fromEntries(new FormData(e.currentTarget))
    const { name, password, passwordConfirm } = formData as CreateWalletData

    if (password !== passwordConfirm) {
      addToast({
        title: t('toasts.passwordMismatch.title'),
        description: t('toasts.passwordMismatch.description'),
        color: 'danger',
      })
      return
    }

    try {
      const generatedMnemonic = await window.mnemoAPI.generateMnemonic()
      setMnemonic(generatedMnemonic)
      setWalletName(name)
      setPassword(password)
    } catch {
      addToast({
        title: t('toasts.generateError.title'),
        description: t('toasts.generateError.description'),
        color: 'danger',
      })
    }
  }

  const handleCopy = async (): Promise<void> => {
    await navigator.clipboard.writeText(mnemonic)
    addToast({
      title: t('toasts.copied.title'),
      description: t('toasts.copied.description'),
      color: 'success',
    })
  }

  const finalize = async (): Promise<void> => {
    try {
      const { address, privateKey } =
        await window.walletAPI.walletFromSeed(mnemonic)
      const { encrypted, salt } = await window.cryptoAPI.encryptPrivateKey(
        privateKey,
        password,
      )
      await window.dbAPI.insertWallet(walletName, address, encrypted, salt)

      addToast({
        title: t('toasts.walletCreated.title'),
        description: t('toasts.walletCreated.description'),
        color: 'success',
      })
      reset()
      await refreshAsync()
      onClose()
    } catch {
      addToast({
        title: t('toasts.creationFailed.title'),
        description: t('toasts.creationFailed.description'),
        color: 'danger',
      })
    }
  }

  return (
    <>
      <Button
        variant="primary"
        startContent={<GoPlus size={16} />}
        onClick={onOpen}
      >
        {t('common.createWallet')}
      </Button>

      <Modal
        isOpen={isOpen}
        onOpenChange={(o) => {
          onOpenChange(o)
          if (!o) reset()
        }}
        size="lg"
      >
        <ModalHeader
          icon={
            mnemonic ? (
              <LuSparkles size={18} className="text-primary" />
            ) : (
              <LuWallet size={18} className="text-primary" />
            )
          }
        >
          <ModalTitle>
            {mnemonic
              ? t('createWallet.storeMnemonic')
              : t('createWallet.title')}
          </ModalTitle>
          <ModalDescription>
            {mnemonic
              ? 'Write these 12 words down offline. This is the only way to recover your wallet.'
              : t('createWallet.description')}
          </ModalDescription>
        </ModalHeader>

        {!mnemonic ? (
          <>
            <ModalBody>
              <Form onSubmit={onSubmit} id="create-wallet-modal">
                <Input
                  name="name"
                  label={t('common.walletName')}
                  isRequired
                  autoFocus
                />
                <PasswordInput
                  name="password"
                  label={t('common.password')}
                  isRequired
                  validate={(v) =>
                    !WALLET_PASSWORD_REGEX.test(v)
                      ? t('createWallet.invalidPassword')
                      : undefined
                  }
                />
                <PasswordInput
                  name="passwordConfirm"
                  label={t('common.confirmPassword')}
                  isRequired
                />
              </Form>
            </ModalBody>
            <ModalFooter>
              <Button
                type="submit"
                form="create-wallet-modal"
                variant="primary"
                fullWidth
              >
                {t('common.createWallet')}
              </Button>
            </ModalFooter>
          </>
        ) : (
          <>
            <ModalBody>
              <div className="flex gap-2">
                <div className="flex-1 rounded-lg border border-riven-border bg-black/40 p-4 font-mono text-sm leading-relaxed text-foreground shadow-inner">
                  {showMnemonic
                    ? mnemonic.split(' ').map((w, i) => (
                        <span key={i}>
                          <span className="mr-2 text-[10px] text-riven-muted">
                            {i + 1}
                          </span>
                          <span className="mr-4">{w}</span>
                        </span>
                      ))
                    : mnemonic.replaceAll(/\w/g, '•')}
                </div>
                <div className="flex flex-col gap-2">
                  <Button
                    variant="secondary"
                    size="icon"
                    onClick={handleCopy}
                    aria-label="Copy"
                  >
                    <MdOutlineContentCopy size={16} />
                  </Button>
                  <Button
                    variant="secondary"
                    size="icon"
                    onClick={() => setShowMnemonic((v) => !v)}
                    aria-label="Toggle visibility"
                  >
                    {showMnemonic ? (
                      <IoIosEyeOff size={18} />
                    ) : (
                      <IoIosEye size={18} />
                    )}
                  </Button>
                </div>
              </div>
              <div className="mt-4 rounded-lg border border-warning/30 bg-warning/5 p-3">
                <p className="text-xs leading-relaxed text-warning">
                  {t('common.warning')}
                </p>
              </div>
            </ModalBody>
            <ModalFooter>
              <Button variant="primary" fullWidth onClick={finalize}>
                {t('common.continue')}
              </Button>
            </ModalFooter>
          </>
        )}
      </Modal>
    </>
  )
}
