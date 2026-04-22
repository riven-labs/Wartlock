import { Input } from '@renderer/components/ui/input'
import { Select, SelectItem } from '@renderer/components/ui/select'
import { Switch } from '@renderer/components/ui/switch'
import { useState, type FC, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import {
  LuChevronDown,
  LuChevronRight,
  LuCpu,
  LuHandHeart,
  LuWallet,
} from 'react-icons/lu'
import {
  DONATION_DEV_ADDRESS,
  DONATION_POOL,
  type MinerConfig,
  type MinerOptions,
} from '../types'
import { BzminerDownload } from './BzminerDownload'
import { IntensitySelector } from './IntensitySelector'

type Wallet = {
  id: string
  name: string
  address: string
}

type Props = {
  config: MinerConfig
  options: MinerOptions
  onConfigChange: (patch: Partial<MinerConfig>) => void
  onOptionsChange: (patch: Partial<MinerOptions>) => void
  wallets: Wallet[]
  disabled: boolean
  onPickBinary: () => void
  running: boolean
}

const Section: FC<{
  step: string
  title: string
  icon: ReactNode
  children: ReactNode
}> = ({ step, title, icon, children }) => (
  <section className="rounded-xl border border-riven-border bg-riven-surface">
    <header className="flex items-center gap-3 border-b border-riven-border bg-[radial-gradient(ellipse_at_top_left,rgba(47,111,235,0.06),transparent_65%)] px-6 py-4">
      <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-riven-border bg-white/[0.03] text-primary">
        {icon}
      </span>
      <div>
        <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-riven-muted">
          {step}
        </p>
        <h3 className="text-sm font-semibold tracking-tight text-foreground">
          {title}
        </h3>
      </div>
    </header>
    <div className="p-6">{children}</div>
  </section>
)

export const MinerConfigCard: FC<Props> = ({
  config,
  options,
  onConfigChange,
  onOptionsChange,
  wallets,
  disabled,
  onPickBinary,
  running,
}) => {
  const { t } = useTranslation()
  const [advancedOpen, setAdvancedOpen] = useState(false)

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

  return (
    <div className="space-y-5">
      <Section
        step={t('mining.step1')}
        title={t('mining.miner')}
        icon={<LuCpu size={16} />}
      >
        <BzminerDownload
          binaryPath={config.binaryPath}
          onBinaryPathChange={(p) => onConfigChange({ binaryPath: p })}
          onPickBinary={onPickBinary}
          disabled={disabled}
        />
      </Section>

      <Section
        step={t('mining.step2')}
        title={t('mining.payout')}
        icon={<LuWallet size={16} />}
      >
        <div className="space-y-5">
          <Select
            label={t('mining.miningWallet')}
            value={config.walletAddress}
            onValueChange={(v) => onConfigChange({ walletAddress: v })}
            renderValue={renderWalletValue}
            aria-label={t('mining.miningWallet')}
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
          <p className="-mt-3 text-[11px] text-riven-muted">
            {t('mining.miningWalletHelp')}
          </p>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <Input
              label={t('mining.pool')}
              value={config.pool}
              onValueChange={(v) => onConfigChange({ pool: v })}
              placeholder={t('mining.poolPlaceholder')}
              disabled={disabled}
            />
            <Input
              label={t('mining.worker')}
              value={config.worker}
              onValueChange={(v) => onConfigChange({ worker: v })}
              placeholder={t('mining.workerPlaceholder')}
              disabled={disabled}
            />
          </div>
        </div>
      </Section>

      <Section
        step={t('mining.step3')}
        title={t('mining.tuning')}
        icon={<LuHandHeart size={16} />}
      >
        <div className="space-y-6">
          <IntensitySelector
            value={options.intensity}
            onChange={(v) => onOptionsChange({ intensity: v })}
            disabled={running}
          />

          <Input
            label={t('mining.sessionDuration')}
            description={t('mining.sessionDurationHelp')}
            type="number"
            min={0}
            step="1"
            value={options.sessionMinutes ?? ''}
            onValueChange={(v) => {
              const n = parseInt(v, 10)
              onOptionsChange({
                sessionMinutes: Number.isFinite(n) && n > 0 ? n : null,
              })
            }}
            placeholder="0 (run indefinitely)"
            endContent={
              <span className="text-xs text-riven-muted">minutes</span>
            }
            disabled={running}
          />

          <div className="rounded-lg border border-riven-border">
            <button
              type="button"
              onClick={() => setAdvancedOpen((v) => !v)}
              className="flex w-full items-center justify-between px-4 py-3 text-left transition-colors hover:bg-white/[0.02]"
            >
              <span className="text-xs font-medium uppercase tracking-wider text-riven-muted">
                {t('mining.advanced')}
              </span>
              {advancedOpen ? (
                <LuChevronDown size={14} className="text-riven-muted" />
              ) : (
                <LuChevronRight size={14} className="text-riven-muted" />
              )}
            </button>
            {advancedOpen && (
              <div className="space-y-5 border-t border-riven-border px-4 py-4">
                <Input
                  label={t('mining.algo')}
                  value={config.algo}
                  onValueChange={(v) => onConfigChange({ algo: v })}
                  description={t('mining.algoHelp')}
                  disabled={disabled}
                />
                <Input
                  label={t('mining.extraArgs')}
                  value={config.extraArgs}
                  onValueChange={(v) => onConfigChange({ extraArgs: v })}
                  placeholder={t('mining.extraArgsPlaceholder')}
                  description={t('mining.extraArgsHelp')}
                  disabled={disabled}
                />
              </div>
            )}
          </div>
        </div>
      </Section>

      <div className="rounded-xl border border-primary/20 bg-[linear-gradient(180deg,rgba(47,111,235,0.05)_0%,rgba(47,111,235,0.015)_100%)] p-5">
        <div className="flex items-start gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/15 ring-1 ring-inset ring-primary/30">
            <LuHandHeart size={17} className="text-primary" />
          </span>
          <div className="flex flex-1 items-start justify-between gap-4">
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-foreground">
                {t('mining.donationTitle')}
              </h3>
              <p className="mt-1 text-xs leading-relaxed text-riven-muted">
                {t('mining.donationBody')}
              </p>
              <dl className="mt-3 space-y-1 text-[11px]">
                <div className="flex gap-2">
                  <dt className="w-20 shrink-0 uppercase tracking-wider text-riven-muted">
                    Schedule
                  </dt>
                  <dd className="text-foreground">
                    5 minutes every 1 hour, while mining
                  </dd>
                </div>
                <div className="flex gap-2">
                  <dt className="w-20 shrink-0 uppercase tracking-wider text-riven-muted">
                    Pool
                  </dt>
                  <dd className="font-mono text-foreground">{DONATION_POOL}</dd>
                </div>
                <div className="flex gap-2">
                  <dt className="w-20 shrink-0 uppercase tracking-wider text-riven-muted">
                    Wallet
                  </dt>
                  <dd
                    className="font-mono text-foreground"
                    title={DONATION_DEV_ADDRESS}
                  >
                    {DONATION_DEV_ADDRESS.slice(0, 10)}…
                    {DONATION_DEV_ADDRESS.slice(-8)}
                  </dd>
                </div>
              </dl>
            </div>
            <Switch
              isSelected={options.donation}
              onValueChange={(v) => onOptionsChange({ donation: v })}
              size="sm"
              aria-label={t('mining.donationTitle')}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
