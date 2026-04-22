import type { FC } from 'react'
import { cn } from '../../lib/cn'

type SpinnerProps = {
  size?: 'xs' | 'sm' | 'md' | 'lg'
  className?: string
  label?: string
}

const sizes = {
  xs: 'h-3 w-3 border',
  sm: 'h-4 w-4 border-[1.5px]',
  md: 'h-5 w-5 border-2',
  lg: 'h-7 w-7 border-2',
}

export const Spinner: FC<SpinnerProps> = ({
  size = 'md',
  className,
  label,
}) => {
  return (
    <span role="status" className="inline-flex items-center gap-2">
      <span
        className={cn(
          'animate-spin rounded-full border-transparent border-t-current',
          sizes[size],
          className,
        )}
        aria-hidden="true"
      />
      {label && <span className="text-xs text-riven-muted">{label}</span>}
    </span>
  )
}
