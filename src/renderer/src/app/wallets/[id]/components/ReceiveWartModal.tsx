import { Button } from '@renderer/components/ui/button'
import {
  Modal,
  ModalBody,
  ModalDescription,
  ModalFooter,
  ModalHeader,
  ModalTitle,
} from '@renderer/components/ui/modal'
import { QRCodeSvg } from '@renderer/components/ui/qrcode'
import { addToast } from '@renderer/components/ui/toast'
import { useDisclosure } from '@renderer/hooks/use-disclosure'
import { buildShareableQrPng, downloadDataUrl } from '@renderer/lib/qr'
import type { FC } from 'react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { LuCheck, LuDownload, LuQrCode, LuShare2 } from 'react-icons/lu'
import { MdOutlineContentCopy } from 'react-icons/md'

type Props = {
  address: string | undefined
}

export const ReceiveWartModal: FC<Props> = ({ address }) => {
  const { isOpen, onOpen, onClose, onOpenChange } = useDisclosure()
  const { t } = useTranslation()
  const [copied, setCopied] = useState(false)
  const [downloading, setDownloading] = useState(false)

  const handleCopy = async (): Promise<void> => {
    if (!address) return
    await navigator.clipboard.writeText(address)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
    addToast({
      title: t('walletDetails.copied'),
      description: t('walletDetails.addressCopied'),
      color: 'success',
    })
  }

  const handleDownload = async (): Promise<void> => {
    if (!address) return
    try {
      setDownloading(true)
      const png = await buildShareableQrPng(address)
      downloadDataUrl(png, `wartlock-${address.slice(0, 8)}.png`)
      addToast({
        title: t('receive.exported'),
        description: t('receive.exportedDescription'),
        color: 'success',
      })
    } catch {
      addToast({
        title: t('receive.exportFailed'),
        description: t('receive.exportFailedDescription'),
        color: 'danger',
      })
    } finally {
      setDownloading(false)
    }
  }

  return (
    <>
      <Button
        variant="outline"
        startContent={<LuDownload size={14} />}
        onClick={onOpen}
      >
        {t('walletDetails.receiveWART')}
      </Button>

      <Modal isOpen={isOpen} onOpenChange={onOpenChange} size="md">
        <ModalHeader icon={<LuQrCode size={18} className="text-primary" />}>
          <ModalTitle>{t('walletDetails.receiveWART')}</ModalTitle>
          <ModalDescription>
            {t('walletDetails.receiveDescription')}
          </ModalDescription>
        </ModalHeader>

        <ModalBody className="flex flex-col items-center gap-6">
          <QRCodeSvg value={address || ''} size={192} />

          <div className="w-full">
            <p className="text-[11px] uppercase tracking-wider text-riven-muted">
              Address
            </p>
            <button
              type="button"
              onClick={handleCopy}
              className="mt-2 flex w-full items-center gap-2 rounded-lg border border-riven-border bg-black/30 p-3 text-left font-mono text-xs text-foreground transition-colors hover:border-riven-border-strong hover:bg-black/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
              title="Click to copy"
            >
              <span className="flex-1 break-all">{address}</span>
              {copied ? (
                <LuCheck size={14} className="shrink-0 text-success" />
              ) : (
                <MdOutlineContentCopy
                  size={14}
                  className="shrink-0 text-riven-muted"
                />
              )}
            </button>
          </div>
        </ModalBody>

        <ModalFooter>
          <Button variant="ghost" onClick={onClose}>
            {t('passwordModal.cancel')}
          </Button>
          <Button
            variant="outline"
            startContent={<LuShare2 size={14} />}
            onClick={handleDownload}
            isLoading={downloading}
          >
            {t('receive.downloadQr')}
          </Button>
          <Button
            variant="primary"
            startContent={
              copied ? (
                <LuCheck size={14} />
              ) : (
                <MdOutlineContentCopy size={14} />
              )
            }
            onClick={handleCopy}
          >
            {copied ? t('walletDetails.copied') : t('walletDetails.copy')}
          </Button>
        </ModalFooter>
      </Modal>
    </>
  )
}
