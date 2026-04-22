import { cn } from '@renderer/lib/cn'
import type { FC, ReactNode } from 'react'
import { LuArrowUpRight } from 'react-icons/lu'

const EXPLORER_ACCOUNT = 'https://wartscan.io/account/'
const EXPLORER_TX = 'https://wartscan.io/tx/'

const truncate = (s: string, head = 8, tail = 6): string =>
  s && s.length > head + tail + 3 ? `${s.slice(0, head)}…${s.slice(-tail)}` : s

type Props = {
  value: string
  kind: 'address' | 'tx'
  children?: ReactNode
  className?: string
  showIcon?: boolean
}

export const ExplorerLink: FC<Props> = ({
  value,
  kind,
  children,
  className,
  showIcon,
}) => {
  if (!value) return <span className="text-riven-muted">—</span>

  const href = (kind === 'address' ? EXPLORER_ACCOUNT : EXPLORER_TX) + value

  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      title={value}
      className={cn(
        'group inline-flex items-center gap-1 font-mono text-xs text-riven-muted transition-colors hover:text-primary focus-visible:text-primary focus-visible:outline-none',
        className,
      )}
    >
      <span className="truncate">{children ?? truncate(value)}</span>
      {showIcon && (
        <LuArrowUpRight
          size={11}
          className="opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100"
        />
      )}
    </a>
  )
}
