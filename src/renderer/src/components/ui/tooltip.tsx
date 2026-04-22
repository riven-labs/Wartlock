import * as TooltipPrimitive from '@radix-ui/react-tooltip'
import { type FC, type ReactNode } from 'react'
import { cn } from '../../lib/cn'

type TooltipProps = {
  content: ReactNode
  children: ReactNode
  side?: 'top' | 'right' | 'bottom' | 'left'
  delayDuration?: number
  className?: string
}

export const Tooltip: FC<TooltipProps> = ({
  content,
  children,
  side = 'top',
  delayDuration = 200,
  className,
}) => {
  return (
    <TooltipPrimitive.Provider delayDuration={delayDuration}>
      <TooltipPrimitive.Root>
        <TooltipPrimitive.Trigger asChild>{children}</TooltipPrimitive.Trigger>
        <TooltipPrimitive.Portal>
          <TooltipPrimitive.Content
            side={side}
            sideOffset={6}
            className={cn(
              'z-50 rounded-md border border-riven-border bg-riven-surface-2 px-2.5 py-1.5 text-xs text-foreground shadow-md',
              'data-[state=closed]:animate-fade-out data-[state=delayed-open]:animate-fade-in',
              className,
            )}
          >
            {content}
          </TooltipPrimitive.Content>
        </TooltipPrimitive.Portal>
      </TooltipPrimitive.Root>
    </TooltipPrimitive.Provider>
  )
}
