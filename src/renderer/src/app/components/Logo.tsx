import { LOGO } from '@renderer/constants/images'
import type { FC } from 'react'
import { Link } from 'react-router'

export const Logo: FC = () => {
  return (
    <Link
      to="/"
      className="flex min-w-0 items-center gap-3 px-1 py-1"
      aria-label="Wartlock"
    >
      <img
        src={LOGO}
        width={28}
        height={28}
        alt=""
        className="h-7 w-7 shrink-0"
        draggable={false}
      />
      <span className="hidden whitespace-nowrap text-[15px] font-semibold tracking-tight text-foreground group-hover/sidebar:inline-block">
        Wartlock
      </span>
    </Link>
  )
}

export const LogoIcon: FC = () => {
  return (
    <Link to="/" className="flex items-center" aria-label="Wartlock">
      <img src={LOGO} width={28} height={28} alt="" className="h-7 w-7" />
    </Link>
  )
}
