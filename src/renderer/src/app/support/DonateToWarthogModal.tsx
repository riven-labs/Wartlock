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
import { Select, SelectItem } from '@renderer/components/ui/select'
import { addToast } from '@renderer/components/ui/toast'
import { useEffect, useState, type FC } from 'react'
import { useTranslation } from 'react-i18next'
import { LuHandHeart } from 'react-icons/lu'

type Wallet = {
  id: string
  name: string
  address: string
}

type Props = {
  isOpen: boolean
  onClose: () => void
  recipientAddress: string
}

/**
 * "Pick a wallet → enter amount → enter password → sign & broadcast."
 * Keeps the UI focused: nothing else to tweak. Recipient is locked to the
 * Warthog dev address so users can't accidentally send elsewhere.
 */
export const DonateToWarthogModal: FC<Props> = ({
  isOpen,
  onClose,
  recipientAddress,
}) => {
  const { t } = useTranslation()
  const [wallets, setWallets] = useState<Wallet[]>([])
  const [walletAddress, setWalletAddress] = useState('')
  const [amount, setAmount] = useState('')
  const [password, setPassword] = useState('')
  const [sending, setSending] = useState(false)

  useEffect(() => {
    if (!isOpen) return
    let cancelled = false
    window.dbAPI.getWallets().then((rows) => {
      if (cancelled) return
      setWallets((rows || []) as Wallet[])
    })
    return (): void => {
      cancelled = true
    }
  }, [isOpen])

  const reset = (): void => {
    setWalletAddress('')
    setAmount('')
    setPassword('')
  }

  const handleClose = (): void => {
    if (sending) return
    reset()
    onClose()
  }

  const renderWalletValue = (val: string | undefined): React.ReactNode => {
    const w = wallets.find((x) => x.address === val)
    if (!w) return <span className="text-riven-muted">Select a wallet</span>
    return (
      <div className="flex min-w-0 flex-col text-left">
        <span className="truncate text-sm text-foreground">{w.name}</span>
        <span className="truncate font-mono text-[11px] text-riven-muted">
          {w.address}
        </span>
      </div>
    )
  }

  const onSubmit = async (
    e: React.FormEvent<HTMLFormElement>,
  ): Promise<void> => {
    e.preventDefault()
    const amountNum = parseFloat(amount)
    if (!walletAddress) {
      addToast({
        title: t('support.pickWalletTitle'),
        description: t('support.pickWalletBody'),
        color: 'danger',
      })
      return
    }
    if (!Number.isFinite(amountNum) || amountNum <= 0) {
      addToast({
        title: t('transaction.invalidAmount'),
        description: t('transaction.invalidAmountDescription'),
        color: 'danger',
      })
      return
    }
    if (!password) {
      addToast({
        title: t('passwordModal.error'),
        description: t('passwordModal.invalidPasswordError'),
        color: 'danger',
      })
      return
    }

    try {
      setSending(true)
      const wallet = wallets.find((w) => w.address === walletAddress)
      if (!wallet) throw new Error('wallet not found')

      // Decrypt the wallet's private key using the password the user just
      // typed. We purposely don't persist it — this keeps the donation flow
      // self-contained and doesn't affect the stored key state.
      const data = await window.dbAPI.getWalletById(Number(wallet.id))
      const decrypted = await window.cryptoAPI.decryptPrivateKey(
        data.pk,
        password,
        data.salt,
      )
      if (!decrypted) {
        addToast({
          title: t('passwordModal.error'),
          description: t('passwordModal.invalidPasswordError'),
          color: 'danger',
        })
        return
      }

      const peerUrl = await window.dbAPI.getPeer()
      await window.walletAPI.sendTransaction(
        recipientAddress,
        amountNum,
        0.00000001,
        decrypted,
        peerUrl,
      )

      addToast({
        title: t('support.thanks'),
        description: t('support.thanksDescription', {
          amount: amountNum,
        }),
        color: 'success',
      })
      handleClose()
    } catch {
      addToast({
        title: t('walletDetails.transactionFailed'),
        description: t('walletDetails.transactionError'),
        color: 'danger',
      })
    } finally {
      setSending(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="md">
      <ModalHeader icon={<LuHandHeart size={18} className="text-primary" />}>
        <ModalTitle>{t('support.donateTitle')}</ModalTitle>
        <ModalDescription>{t('support.donateSubtitle')}</ModalDescription>
      </ModalHeader>

      <ModalBody>
        <Form id="donate-warthog-form" onSubmit={onSubmit}>
          <div>
            <label className="mb-2 block text-xs uppercase tracking-wider text-riven-muted">
              {t('support.recipient')}
            </label>
            <div className="rounded-lg border border-riven-border bg-black/30 p-3 font-mono text-xs text-foreground">
              <span className="break-all">{recipientAddress}</span>
            </div>
            <p className="mt-1 text-[11px] text-riven-muted">
              {t('support.recipientLocked')}
            </p>
          </div>

          <Select
            label={t('support.fromWallet')}
            value={walletAddress}
            onValueChange={setWalletAddress}
            renderValue={renderWalletValue}
            aria-label={t('support.fromWallet')}
          >
            {wallets.map((w) => (
              <SelectItem key={w.address} value={w.address}>
                <div className="flex min-w-0 flex-col">
                  <span className="text-sm">{w.name}</span>
                  <span className="truncate font-mono text-[11px] text-riven-muted">
                    {w.address}
                  </span>
                </div>
              </SelectItem>
            ))}
          </Select>

          <Input
            label={t('walletDetails.amount')}
            type="number"
            min={0}
            step="any"
            value={amount}
            onValueChange={setAmount}
            endContent={<span className="text-xs text-riven-muted">WART</span>}
            placeholder="1.0"
            isRequired
          />

          <PasswordInput
            label={t('common.password')}
            value={password}
            onValueChange={setPassword}
            isRequired
          />
        </Form>
      </ModalBody>

      <ModalFooter>
        <Button variant="ghost" onClick={handleClose}>
          {t('passwordModal.cancel')}
        </Button>
        <Button
          type="submit"
          form="donate-warthog-form"
          variant="primary"
          isLoading={sending}
          startContent={<LuHandHeart size={14} />}
        >
          {t('support.send')}
        </Button>
      </ModalFooter>
    </Modal>
  )
}
