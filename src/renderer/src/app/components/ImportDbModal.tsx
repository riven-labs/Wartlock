import { PasswordInput } from '@renderer/components/PasswordInput'
import { Button } from '@renderer/components/ui/button'
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
import { LuDatabase, LuFile, LuFolderSearch } from 'react-icons/lu'
import { useWallet } from '../wallets/WalletContext'

const WALLET_PASSWORD_REGEX = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}/

type Props = {
  isOpen: boolean
  onClose: () => void
}

type DecryptedRow = {
  name: string
  address: string
  pk: string
  salt: string
  last_balance: string | null
  plaintextPk: string
}

type ScanResult = {
  total: number
  decrypted: DecryptedRow[]
}

type Stage = 'pick' | 'scanned'

export const ImportDbModal: FC<Props> = ({ isOpen, onClose }) => {
  const { refreshAsync } = useWallet()
  const { t } = useTranslation()
  const [stage, setStage] = useState<Stage>('pick')
  const [filePath, setFilePath] = useState<string | null>(null)
  const [sourcePassword, setSourcePassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [scanResult, setScanResult] = useState<ScanResult | null>(null)
  const [busy, setBusy] = useState(false)

  const reset = (): void => {
    setStage('pick')
    setFilePath(null)
    setSourcePassword('')
    setNewPassword('')
    setScanResult(null)
    setBusy(false)
  }

  const handleClose = (): void => {
    reset()
    onClose()
  }

  const handlePickFile = async (): Promise<void> => {
    const path = await window.dbAPI.pickWalletDbFile()
    if (path) setFilePath(path)
  }

  const handleScan = async (): Promise<void> => {
    if (!filePath || !sourcePassword) return
    try {
      setBusy(true)
      const result = (await window.dbAPI.importWalletsFromDb(
        filePath,
        sourcePassword,
      )) as ScanResult

      if (!result.decrypted.length) {
        addToast({
          title: t('importWallet.importFailed'),
          description: t('importWallet.nothingToImport'),
          color: 'danger',
        })
        return
      }
      setScanResult(result)
      setStage('scanned')
    } catch {
      addToast({
        title: t('importWallet.importFailed'),
        description: t('importWallet.importFailedDescription'),
        color: 'danger',
      })
    } finally {
      setBusy(false)
    }
  }

  const handleFinalize = async (): Promise<void> => {
    if (!scanResult) return
    if (!WALLET_PASSWORD_REGEX.test(newPassword)) {
      addToast({
        title: t('toasts.invalidPassword.title'),
        description: t('toasts.invalidPassword.description'),
        color: 'danger',
      })
      return
    }

    setBusy(true)
    let imported = 0
    let skipped = 0
    for (const row of scanResult.decrypted) {
      try {
        const { encrypted, salt } = await window.cryptoAPI.encryptPrivateKey(
          row.plaintextPk,
          newPassword,
        )
        await window.dbAPI.insertWallet(
          row.name || 'Imported wallet',
          row.address,
          encrypted,
          salt,
          row.last_balance ?? undefined,
        )
        imported++
      } catch {
        skipped++
      }
    }
    setBusy(false)

    addToast({
      title: t('importWallet.imported'),
      description: t('importWallet.partialImport', {
        imported,
        total: scanResult.total,
        skipped,
      }),
      color: imported > 0 ? 'success' : 'warning',
    })

    await refreshAsync()
    handleClose()
  }

  return (
    <Modal
      isOpen={isOpen}
      onOpenChange={(o) => {
        if (!o) handleClose()
      }}
      size="lg"
    >
      <ModalHeader icon={<LuDatabase size={18} className="text-primary" />}>
        <ModalTitle>{t('importWallet.fromDbFile')}</ModalTitle>
        <ModalDescription>
          {t('importWallet.fromDbFileDescription')}
        </ModalDescription>
      </ModalHeader>

      <ModalBody>
        {stage === 'pick' ? (
          <div className="space-y-6">
            <div>
              <label className="mb-2 block text-xs uppercase tracking-wider text-riven-muted">
                {t('importWallet.selectFile')}
              </label>
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  startContent={<LuFolderSearch size={14} />}
                  onClick={handlePickFile}
                >
                  {t('importWallet.selectFile')}
                </Button>
                <div className="flex min-w-0 items-center gap-2 text-xs text-riven-muted">
                  <LuFile size={14} className="shrink-0" />
                  <span
                    className="truncate font-mono"
                    title={filePath || undefined}
                  >
                    {filePath || t('importWallet.noFileSelected')}
                  </span>
                </div>
              </div>
            </div>

            <PasswordInput
              name="sourcePassword"
              label={t('importWallet.sourceFilePassword')}
              value={sourcePassword}
              onValueChange={setSourcePassword}
            />
          </div>
        ) : (
          <div className="space-y-6">
            <div className="rounded-lg border border-riven-border bg-black/30 p-4">
              <p className="text-sm text-foreground">
                {t('importWallet.importSummary', {
                  decrypted: scanResult?.decrypted.length ?? 0,
                  total: scanResult?.total ?? 0,
                })}
              </p>
              <ul className="scroll-sm mt-3 max-h-40 space-y-1 overflow-y-auto text-xs">
                {scanResult?.decrypted.map((w) => (
                  <li key={w.address} className="flex justify-between gap-3">
                    <span className="truncate text-foreground">
                      {w.name || '(unnamed)'}
                    </span>
                    <span
                      className="truncate font-mono text-riven-muted"
                      title={w.address}
                    >
                      {w.address.slice(0, 8)}…{w.address.slice(-6)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            <PasswordInput
              name="newPassword"
              label={t('importWallet.newVaultPassword')}
              value={newPassword}
              onValueChange={setNewPassword}
              validate={(v) =>
                !WALLET_PASSWORD_REGEX.test(v)
                  ? t('recoverWallet.errorPassword')
                  : undefined
              }
            />
          </div>
        )}
      </ModalBody>

      <ModalFooter>
        <Button variant="ghost" onClick={handleClose}>
          {t('passwordModal.cancel')}
        </Button>
        {stage === 'pick' ? (
          <Button
            variant="primary"
            onClick={handleScan}
            isLoading={busy}
            isDisabled={!filePath || !sourcePassword}
          >
            {t('importWallet.scan')}
          </Button>
        ) : (
          <Button variant="primary" onClick={handleFinalize} isLoading={busy}>
            {t('importWallet.finalize')}
          </Button>
        )}
      </ModalFooter>
    </Modal>
  )
}
