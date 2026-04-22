import { Button } from '@renderer/components/ui/button'
import { Input } from '@renderer/components/ui/input'
import { Select, SelectItem } from '@renderer/components/ui/select'
import { addToast } from '@renderer/components/ui/toast'
import { useEffect, useMemo, useState, type FC } from 'react'
import { useTranslation } from 'react-i18next'
import { LuShieldAlert } from 'react-icons/lu'
import { useNavigate } from 'react-router'
import { LanguageDropdown } from './LanguageDropdown'

type PublicNode = { label: string; url: string }

const CUSTOM_KEY = '__custom__'
const LOCAL_URL = 'http://localhost:3000'
const LOCAL_NODE: PublicNode = {
  label: 'Local node (recommended)',
  url: LOCAL_URL,
}

export const SettingsForm: FC = () => {
  const [currentUrl, setCurrentUrl] = useState('')
  const [publicNodes, setPublicNodes] = useState<PublicNode[]>([])
  const [selectedKey, setSelectedKey] = useState<string>(LOCAL_URL)
  const [customUrl, setCustomUrl] = useState('')
  const navigate = useNavigate()
  const { t } = useTranslation()

  useEffect(() => {
    let isMounted = true
    const load = async (): Promise<void> => {
      const [peer, nodes] = await Promise.all([
        window.dbAPI.getPeer(),
        window.dbAPI.getPublicNodes(),
      ])
      if (!isMounted) return

      const list = (nodes as PublicNode[]) || []
      setPublicNodes(list)
      setCurrentUrl(peer)
      setCustomUrl(peer)

      if (peer === LOCAL_URL) setSelectedKey(LOCAL_URL)
      else if (list.some((n) => n.url === peer)) setSelectedKey(peer)
      else setSelectedKey(CUSTOM_KEY)
    }
    load()
    return (): void => {
      isMounted = false
    }
  }, [])

  const options = useMemo<PublicNode[]>(
    () => [LOCAL_NODE, ...publicNodes],
    [publicNodes],
  )

  const resolvedUrl = useMemo(() => {
    if (selectedKey === CUSTOM_KEY) return customUrl.trim()
    return selectedKey
  }, [selectedKey, customUrl])

  const isLocal = resolvedUrl === LOCAL_URL
  const showPrivacyWarning = !isLocal && !!resolvedUrl

  const handleCancel = (): void => {
    navigate('/')
  }

  const handleConfirm = async (): Promise<void> => {
    const url = resolvedUrl
    if (!url) {
      addToast({
        title: t('settings.error'),
        description: t('settings.peerRequired'),
        color: 'danger',
      })
      return
    }

    try {
      await window.dbAPI.updatePeer(url)
      setCurrentUrl(url)
      addToast({
        title: t('settings.saved'),
        description: t('settings.peerUpdated'),
        color: 'success',
      })
    } catch {
      addToast({
        title: t('settings.error'),
        description: t('settings.updateFailed'),
        color: 'danger',
      })
    }
  }

  const renderSelectValue = (val: string | undefined): React.ReactNode => {
    if (val === CUSTOM_KEY) {
      return (
        <div className="flex flex-col text-left">
          <span className="text-sm text-foreground">
            {t('settings.customNode')}
          </span>
          <span className="truncate font-mono text-xs text-riven-muted">
            {customUrl || LOCAL_URL}
          </span>
        </div>
      )
    }
    const node = options.find((o) => o.url === val)
    if (!node) return null
    return (
      <div className="flex flex-col text-left">
        <span className="text-sm text-foreground">{node.label}</span>
        <span className="truncate font-mono text-xs text-riven-muted">
          {node.url}
        </span>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <section className="rounded-xl border border-riven-border bg-riven-surface p-8">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-riven-muted">
          {t('settings.preferences')}
        </h2>

        <div className="mt-6 space-y-6">
          <LanguageDropdown />

          <Select
            label={t('settings.nodeSource')}
            value={selectedKey}
            onValueChange={setSelectedKey}
            renderValue={renderSelectValue}
            aria-label={t('settings.nodeSource')}
          >
            {options.map((n) => (
              <SelectItem key={n.url} value={n.url}>
                <div className="flex flex-col">
                  <span className="text-sm">{n.label}</span>
                  <span className="font-mono text-[11px] text-riven-muted">
                    {n.url}
                  </span>
                </div>
              </SelectItem>
            ))}
            <SelectItem value={CUSTOM_KEY}>
              <div className="flex flex-col">
                <span className="text-sm">{t('settings.customNode')}</span>
                <span className="text-[11px] text-riven-muted">
                  {t('settings.localNodeHint')}
                </span>
              </div>
            </SelectItem>
          </Select>

          {selectedKey === CUSTOM_KEY && (
            <Input
              label={t('settings.peer')}
              placeholder={t('settings.customNodePlaceholder')}
              value={customUrl}
              onValueChange={setCustomUrl}
            />
          )}

          {showPrivacyWarning && (
            <div className="flex gap-3 rounded-lg border border-warning/30 bg-warning/5 p-4">
              <LuShieldAlert
                size={18}
                className="mt-0.5 shrink-0 text-warning"
              />
              <div className="space-y-1">
                <p className="text-sm font-medium text-warning">
                  {t('settings.privacyWarningTitle')}
                </p>
                <p className="text-xs leading-relaxed text-riven-muted">
                  {t('settings.privacyWarningBody')}
                </p>
              </div>
            </div>
          )}

          {currentUrl && currentUrl !== resolvedUrl && (
            <p className="text-xs text-riven-muted">
              Currently using: <span className="font-mono">{currentUrl}</span>
            </p>
          )}
        </div>
      </section>

      <div className="flex items-center justify-end gap-2">
        <Button variant="ghost" onClick={handleCancel}>
          {t('passwordModal.cancel')}
        </Button>
        <Button variant="primary" onClick={handleConfirm}>
          {t('passwordModal.confirm')}
        </Button>
      </div>
    </div>
  )
}
