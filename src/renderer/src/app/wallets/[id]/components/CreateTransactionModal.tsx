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
import { Switch } from '@renderer/components/ui/switch'
import { addToast } from '@renderer/components/ui/toast'
import { useDisclosure } from '@renderer/hooks/use-disclosure'
import { decodeQrFromFile } from '@renderer/lib/qr'
import { useEffect, useRef, useState, type FC } from 'react'
import { useTranslation } from 'react-i18next'
import { LuQrCode, LuSend } from 'react-icons/lu'
import { useParams } from 'react-router'

/** Strip leading "-" and any extra signs so a number input can't go negative. */
function sanitizePositive(v: string): string {
  if (!v) return v
  // Allow '0', '0.', '1e5', etc.; just reject negatives
  return v.replace(/^-+/, '')
}

export const CreateTransactionModal: FC = () => {
  const { isOpen, onOpen, onClose, onOpenChange } = useDisclosure()
  const { walletId } = useParams<{ walletId: string }>()
  const { t } = useTranslation()

  const [amount, setAmount] = useState('')
  const [networkFee, setNetworkFee] = useState('0.00000001')
  const [developerFee, setDeveloperFee] = useState('0')
  const [recipient, setRecipient] = useState('')
  const [walletAddress, setWalletAddress] = useState<string | null>(null)
  const [payDevFee, setPayDevFee] = useState(false)
  const [sending, setSending] = useState(false)
  const [scanning, setScanning] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleScanQr = (): void => {
    fileInputRef.current?.click()
  }

  const handleFile = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ): Promise<void> => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    try {
      setScanning(true)
      const decoded = await decodeQrFromFile(file)
      if (!decoded) {
        addToast({
          title: t('transaction.qrFailed'),
          description: t('transaction.qrFailedDescription'),
          color: 'danger',
        })
        return
      }
      // Accept "wartlock:<address>" URIs too, fall back to raw string.
      const address = decoded.replace(/^(wartlock|warthog):/i, '').trim()
      setRecipient(address)
      addToast({
        title: t('transaction.qrDetected'),
        description: t('transaction.qrDetectedDescription'),
        color: 'success',
      })
    } catch {
      addToast({
        title: t('transaction.qrFailed'),
        description: t('transaction.qrFailedDescription'),
        color: 'danger',
      })
    } finally {
      setScanning(false)
    }
  }

  useEffect(() => {
    const fetch = async (): Promise<void> => {
      if (!walletId) return
      const walletData = await window.dbAPI.getWalletById(Number(walletId))
      if (walletData?.address) setWalletAddress(walletData.address)
    }
    fetch()
  }, [walletId])

  useEffect(() => {
    if (amount && payDevFee) {
      setDeveloperFee((parseFloat(amount) * 0.05).toFixed(8))
    } else if (!payDevFee) {
      setDeveloperFee('0')
    }
  }, [amount, payDevFee])

  const onSubmit = async (
    e: React.FormEvent<HTMLFormElement>,
  ): Promise<void> => {
    e.preventDefault()
    if (!walletAddress) {
      addToast({
        title: t('walletDetails.error'),
        description: t('walletDetails.walletNotFound'),
        color: 'danger',
      })
      return
    }

    const amountNum = parseFloat(amount)
    const feeNum = parseFloat(networkFee)
    const devFeeNum = payDevFee ? parseFloat(developerFee) : 0
    if (!Number.isFinite(amountNum) || amountNum <= 0) {
      addToast({
        title: t('transaction.invalidAmount'),
        description: t('transaction.invalidAmountDescription'),
        color: 'danger',
      })
      return
    }
    if (!Number.isFinite(feeNum) || feeNum < 0) {
      addToast({
        title: t('transaction.invalidFee'),
        description: t('transaction.invalidFeeDescription'),
        color: 'danger',
      })
      return
    }
    if (devFeeNum < 0) {
      addToast({
        title: t('transaction.invalidFee'),
        description: t('transaction.invalidFeeDescription'),
        color: 'danger',
      })
      return
    }

    try {
      setSending(true)
      const privateKey = await window.storageAPI.getPrivateKey(walletAddress)
      const peerUrl = await window.dbAPI.getPeer()

      await window.walletAPI.sendTransaction(
        recipient,
        amountNum,
        feeNum,
        String(privateKey),
        peerUrl,
      )

      if (devFeeNum > 0) {
        await window.walletAPI.sendTransaction(
          'aca4916c89b8fb47784d37ad592d378897f616569d3ee0d4',
          devFeeNum,
          0,
          String(privateKey),
          peerUrl,
        )
      }

      addToast({
        title: t('walletDetails.transactionSent'),
        description: t('walletDetails.transactionSuccess'),
        color: 'success',
      })
      onClose()
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
    <>
      <Button
        variant="primary"
        startContent={<LuSend size={14} />}
        onClick={onOpen}
      >
        {t('walletDetails.makeTransaction')}
      </Button>

      <Modal isOpen={isOpen} onOpenChange={onOpenChange} size="lg">
        <ModalHeader icon={<LuSend size={18} className="text-primary" />}>
          <ModalTitle>{t('walletDetails.makeTransaction')}</ModalTitle>
          <ModalDescription>
            {t('walletDetails.sendDescription')}
          </ModalDescription>
        </ModalHeader>

        <ModalBody>
          <Form id="create-tx-form" onSubmit={onSubmit}>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs uppercase tracking-wider text-riven-muted">
                  {t('walletDetails.recipient')}
                  <span className="ml-0.5 text-danger">*</span>
                </label>
                <button
                  type="button"
                  onClick={handleScanQr}
                  disabled={scanning}
                  className="inline-flex items-center gap-1.5 rounded-md border border-riven-border bg-transparent px-2 py-1 text-[11px] font-medium text-riven-muted transition-colors hover:border-riven-border-strong hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 disabled:opacity-50"
                >
                  <LuQrCode size={12} />
                  {scanning
                    ? t('transaction.scanning')
                    : t('transaction.scanQr')}
                </button>
              </div>
              <Input
                name="recipient"
                placeholder="0x…"
                isRequired
                autoFocus
                value={recipient}
                onValueChange={setRecipient}
              />
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFile}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Input
                name="amount"
                type="number"
                label={t('walletDetails.amount')}
                isRequired
                value={amount}
                onValueChange={(v) => setAmount(sanitizePositive(v))}
                min={0}
                step="any"
                endContent={
                  <span className="text-xs text-riven-muted">WART</span>
                }
              />
              <Input
                name="networkFee"
                type="number"
                label={t('walletDetails.networkFee')}
                isRequired
                value={networkFee}
                onValueChange={(v) => setNetworkFee(sanitizePositive(v))}
                min={0}
                step="any"
              />
            </div>

            <div className="rounded-lg border border-riven-border p-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {t('walletDetails.payDevFee')}
                  </p>
                  <p className="mt-0.5 text-xs text-riven-muted">
                    Optional tip to support development.
                  </p>
                </div>
                <Switch
                  isSelected={payDevFee}
                  onValueChange={setPayDevFee}
                  size="sm"
                />
              </div>
              {payDevFee && (
                <div className="mt-4">
                  <Input
                    name="developerFee"
                    type="number"
                    label="Fee"
                    value={developerFee}
                    onValueChange={(v) => setDeveloperFee(sanitizePositive(v))}
                    min={0}
                    step="any"
                  />
                </div>
              )}
            </div>
          </Form>
        </ModalBody>

        <ModalFooter>
          <Button variant="ghost" onClick={onClose}>
            {t('passwordModal.cancel')}
          </Button>
          <Button
            type="submit"
            form="create-tx-form"
            variant="primary"
            isLoading={sending}
          >
            {t('walletDetails.confirm')}
          </Button>
        </ModalFooter>
      </Modal>
    </>
  )
}
