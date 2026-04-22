import { Button } from '@renderer/components/ui/button'
import { cn } from '@renderer/lib/cn'
import { useEffect, useRef, type FC } from 'react'
import { useTranslation } from 'react-i18next'
import { LuTerminal, LuTrash2 } from 'react-icons/lu'
import type { LogLine } from '../types'

type Props = {
  logs: LogLine[]
  onClear: () => void
}

const formatTime = (ts: number): string => {
  const d = new Date(ts)
  return d.toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  })
}

export const MinerLogs: FC<Props> = ({ logs, onClear }) => {
  const { t } = useTranslation()
  const scrollRef = useRef<HTMLDivElement>(null)
  const stickToBottomRef = useRef(true)

  // Stick-to-bottom behavior: stay pinned to the bottom on new lines,
  // but if the user scrolls up, stop auto-following until they scroll back.
  const handleScroll = (): void => {
    const el = scrollRef.current
    if (!el) return
    const distance = el.scrollHeight - (el.scrollTop + el.clientHeight)
    stickToBottomRef.current = distance < 40
  }

  useEffect(() => {
    const el = scrollRef.current
    if (!el || !stickToBottomRef.current) return
    el.scrollTop = el.scrollHeight
  }, [logs])

  return (
    <section className="rounded-xl border border-riven-border bg-riven-surface">
      <div className="flex items-center justify-between border-b border-riven-border px-5 py-3">
        <h2 className="inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-riven-muted">
          <LuTerminal size={14} />
          {t('mining.logs')}
        </h2>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClear}
          startContent={<LuTrash2 size={12} />}
          isDisabled={logs.length === 0}
        >
          {t('mining.clearLogs')}
        </Button>
      </div>
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="scroll-sm h-[320px] overflow-y-auto bg-black/40 p-4 font-mono text-xs leading-relaxed"
      >
        {logs.length === 0 ? (
          <p className="text-riven-muted">{t('mining.logsEmpty')}</p>
        ) : (
          logs.map((l, i) => (
            <div key={i} className="flex gap-3">
              <span className="shrink-0 tabular-nums text-riven-muted/60">
                {formatTime(l.ts)}
              </span>
              <span
                className={cn(
                  'break-all',
                  l.stream === 'stderr' ? 'text-warning' : 'text-foreground',
                )}
              >
                {l.text}
              </span>
            </div>
          ))
        )}
      </div>
    </section>
  )
}
