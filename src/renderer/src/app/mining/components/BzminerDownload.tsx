import { Button } from '@renderer/components/ui/button'
import { Input } from '@renderer/components/ui/input'
import { addToast } from '@renderer/components/ui/toast'
import { cn } from '@renderer/lib/cn'
import { useEffect, useState, type FC } from 'react'
import { useTranslation } from 'react-i18next'
import { LuCircleCheck, LuCloudDownload, LuFolderSearch } from 'react-icons/lu'
import { BZMINER_VERSION_STORAGE_KEY, type DownloadProgress } from '../types'

type Props = {
  binaryPath: string
  onBinaryPathChange: (path: string) => void
  onPickBinary: () => void
  disabled: boolean
}

export const BzminerDownload: FC<Props> = ({
  binaryPath,
  onBinaryPathChange,
  onPickBinary,
  disabled,
}) => {
  const { t } = useTranslation()
  const [progress, setProgress] = useState<DownloadProgress | null>(null)
  const [busy, setBusy] = useState(false)
  const [version, setVersion] = useState<string>(
    () => localStorage.getItem(BZMINER_VERSION_STORAGE_KEY) ?? '',
  )
  const [defaultVersion, setDefaultVersion] = useState<string>('v22.3.0')

  useEffect(() => {
    localStorage.setItem(BZMINER_VERSION_STORAGE_KEY, version)
  }, [version])

  useEffect(() => {
    let cancelled = false
    window.minerAPI.defaultVersion().then((v) => {
      if (cancelled) return
      setDefaultVersion(v)
      // Seed the version field from the shipped default on first mount
      if (!localStorage.getItem(BZMINER_VERSION_STORAGE_KEY)) {
        setVersion(v)
      }
    })
    return (): void => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    // Rehydrate: if the main process already has a downloaded binary on disk
    // (from a previous session), discover and pre-fill the path.
    if (binaryPath) return
    let cancelled = false
    window.minerAPI.getStoredBinary().then((p) => {
      if (cancelled) return
      if (p) onBinaryPathChange(p)
    })
    return (): void => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const off = window.minerAPI.onDownloadProgress((p) => setProgress(p))
    return off
  }, [])

  const handleDownload = async (): Promise<void> => {
    try {
      setBusy(true)
      setProgress({ phase: 'resolving', percent: 0 })
      const trimmed = version.trim()
      const target =
        trimmed && trimmed.toLowerCase() !== 'latest' ? trimmed : null
      const { binaryPath: bin, version: resolved } =
        await window.minerAPI.download(target)
      onBinaryPathChange(bin)
      addToast({
        title: t('mining.downloadSuccess'),
        description: t('mining.downloadSuccessDescription', {
          version: resolved,
        }),
        color: 'success',
      })
    } catch (err) {
      addToast({
        title: t('mining.downloadFailed'),
        description:
          err instanceof Error
            ? err.message
            : t('mining.downloadFailedDescription'),
        color: 'danger',
      })
    } finally {
      setBusy(false)
      setTimeout(() => setProgress(null), 1500)
    }
  }

  const phaseLabel =
    progress?.phase === 'resolving'
      ? 'Fetching release info…'
      : progress?.phase === 'downloading'
        ? `Downloading · ${Math.round((progress.percent || 0) * 100)}%`
        : progress?.phase === 'extracting'
          ? 'Extracting…'
          : progress?.phase === 'done'
            ? 'Ready'
            : progress?.phase === 'failed'
              ? 'Failed'
              : null

  return (
    <div className="space-y-3">
      <div className="flex items-start gap-3 rounded-lg border border-riven-border bg-black/20 p-4">
        {binaryPath ? (
          <LuCircleCheck size={18} className="mt-0.5 shrink-0 text-success" />
        ) : (
          <LuCloudDownload size={18} className="mt-0.5 shrink-0 text-primary" />
        )}
        <div className="flex-1">
          <p className="text-sm font-medium text-foreground">
            {binaryPath
              ? t('mining.binaryReady')
              : t('mining.binaryNotInstalled')}
          </p>
          <p className="mt-1 break-all font-mono text-[11px] text-riven-muted">
            {binaryPath || t('mining.binaryInstallHint')}
          </p>
          {progress && (
            <div className="mt-3">
              <div className="h-1 w-full overflow-hidden rounded-full bg-white/[0.05]">
                <div
                  className={cn(
                    'h-full transition-all',
                    progress.phase === 'failed' ? 'bg-danger' : 'bg-primary',
                  )}
                  style={{
                    width:
                      progress.phase === 'extracting' ||
                      progress.phase === 'done'
                        ? '100%'
                        : progress.phase === 'resolving'
                          ? '5%'
                          : `${Math.max(5, (progress.percent || 0) * 100)}%`,
                  }}
                />
              </div>
              <div className="mt-1 flex items-center justify-between text-[11px] text-riven-muted">
                <span>{phaseLabel}</span>
                {progress.note && (
                  <span className="truncate font-mono">{progress.note}</span>
                )}
              </div>
            </div>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Button
            variant="primary"
            startContent={<LuCloudDownload size={14} />}
            onClick={handleDownload}
            isLoading={busy}
            isDisabled={disabled}
          >
            {binaryPath ? t('mining.updateBzminer') : t('mining.autoDownload')}
          </Button>
          <Button
            variant="outline"
            startContent={<LuFolderSearch size={14} />}
            onClick={onPickBinary}
            isDisabled={disabled || busy}
          >
            {t('mining.pickBinary')}
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <div className="w-full sm:max-w-[220px]">
          <Input
            label={t('mining.bzminerVersion')}
            value={version}
            onValueChange={setVersion}
            placeholder={defaultVersion}
            disabled={disabled || busy}
          />
        </div>
        <p className="flex-1 text-[11px] leading-relaxed text-riven-muted">
          {t('mining.bzminerVersionHelp', { default: defaultVersion })}
        </p>
      </div>
    </div>
  )
}
