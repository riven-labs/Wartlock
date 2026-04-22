import { ExplorerLink } from '@renderer/components/ExplorerLink'
import { Button } from '@renderer/components/ui/button'
import { QRCodeSvg } from '@renderer/components/ui/qrcode'
import { addToast } from '@renderer/components/ui/toast'
import { useDisclosure } from '@renderer/hooks/use-disclosure'
import { buildShareableQrPng, downloadDataUrl } from '@renderer/lib/qr'
import { useState, type FC } from 'react'
import { useTranslation } from 'react-i18next'
import {
  LuCheck,
  LuHandHeart,
  LuHeartHandshake,
  LuShare2,
  LuShieldCheck,
  LuSparkles,
} from 'react-icons/lu'
import { MdOutlineContentCopy } from 'react-icons/md'
import { DonateToWarthogModal } from './DonateToWarthogModal'

const WARTHOG_DEV_ADDRESS = '257edaceb6cb5ded59afd2051b93c5244053da527fc28d6a'

const Support: FC = () => {
  const { t } = useTranslation()
  const donateModal = useDisclosure()
  const [copied, setCopied] = useState(false)
  const [exporting, setExporting] = useState(false)

  const handleCopy = async (): Promise<void> => {
    await navigator.clipboard.writeText(WARTHOG_DEV_ADDRESS)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
    addToast({
      title: t('walletDetails.copied'),
      description: t('walletDetails.addressCopied'),
      color: 'success',
    })
  }

  const handleDownloadQr = async (): Promise<void> => {
    try {
      setExporting(true)
      const png = await buildShareableQrPng(WARTHOG_DEV_ADDRESS)
      downloadDataUrl(png, `warthog-donation.png`)
      addToast({
        title: t('receive.exported'),
        description: t('receive.exportedDescription'),
        color: 'success',
      })
    } finally {
      setExporting(false)
    }
  }

  return (
    <main className="mx-auto max-w-5xl space-y-6 py-2">
      <header className="py-8">
        <h1 className="flex items-center gap-2.5 text-[28px] font-semibold tracking-tight text-foreground">
          <LuHeartHandshake size={24} className="text-primary" />
          {t('support.title')}
        </h1>
        <p className="mt-1 max-w-2xl text-sm leading-relaxed text-riven-muted">
          {t('support.subtitle')}
        </p>
      </header>

      <section className="relative overflow-hidden rounded-2xl border border-primary/20 bg-[linear-gradient(135deg,rgba(47,111,235,0.12)_0%,rgba(47,111,235,0.02)_55%)] p-8">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              'linear-gradient(to right, #fff 1px, transparent 1px), linear-gradient(to bottom, #fff 1px, transparent 1px)',
            backgroundSize: '32px 32px',
          }}
        />
        <div className="relative grid grid-cols-1 gap-8 lg:grid-cols-[1fr_auto] lg:items-center">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/40 bg-primary/10 px-2.5 py-1 text-[11px] font-medium text-primary">
              <LuSparkles size={11} />
              {t('support.officialBadge')}
            </span>
            <h2 className="mt-4 text-2xl font-semibold tracking-tight text-foreground">
              {t('support.keepItRunning')}
            </h2>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-riven-muted">
              {t('support.keepItRunningBody')}
            </p>

            <div className="mt-5 flex flex-wrap gap-3">
              <Button
                variant="primary"
                startContent={<LuHandHeart size={16} />}
                onClick={donateModal.onOpen}
              >
                {t('support.donate')}
              </Button>
              <Button
                variant="outline"
                startContent={
                  copied ? (
                    <LuCheck size={14} />
                  ) : (
                    <MdOutlineContentCopy size={14} />
                  )
                }
                onClick={handleCopy}
              >
                {copied ? t('walletDetails.copied') : t('support.copyAddress')}
              </Button>
              <Button
                variant="outline"
                startContent={<LuShare2 size={14} />}
                onClick={handleDownloadQr}
                isLoading={exporting}
              >
                {t('receive.downloadQr')}
              </Button>
            </div>
          </div>

          <div className="justify-self-center lg:justify-self-end">
            <QRCodeSvg value={WARTHOG_DEV_ADDRESS} size={200} />
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-riven-border bg-riven-surface p-6">
        <p className="text-[11px] font-medium uppercase tracking-wider text-riven-muted">
          {t('support.devAddress')}
        </p>
        <div className="mt-2 flex items-center gap-2 rounded-lg border border-riven-border bg-black/30 p-3">
          <span className="flex-1 break-all font-mono text-xs text-foreground">
            {WARTHOG_DEV_ADDRESS}
          </span>
          <ExplorerLink value={WARTHOG_DEV_ADDRESS} kind="address" showIcon />
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <ReasonCard
          icon={<LuShieldCheck size={16} />}
          title={t('support.reason1Title')}
          body={t('support.reason1Body')}
        />
        <ReasonCard
          icon={<LuSparkles size={16} />}
          title={t('support.reason2Title')}
          body={t('support.reason2Body')}
        />
        <ReasonCard
          icon={<LuHeartHandshake size={16} />}
          title={t('support.reason3Title')}
          body={t('support.reason3Body')}
        />
      </section>

      <DonateToWarthogModal
        isOpen={donateModal.isOpen}
        onClose={donateModal.onClose}
        recipientAddress={WARTHOG_DEV_ADDRESS}
      />
    </main>
  )
}

const ReasonCard: FC<{
  icon: React.ReactNode
  title: string
  body: string
}> = ({ icon, title, body }) => (
  <div className="rounded-xl border border-riven-border bg-riven-surface p-5">
    <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-riven-border bg-white/[0.03] text-primary">
      {icon}
    </span>
    <h3 className="mt-3 text-sm font-semibold tracking-tight text-foreground">
      {title}
    </h3>
    <p className="mt-1 text-xs leading-relaxed text-riven-muted">{body}</p>
  </div>
)

export default Support
