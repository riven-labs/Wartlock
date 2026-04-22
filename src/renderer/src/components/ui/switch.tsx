import * as SwitchPrimitive from '@radix-ui/react-switch'
import {
  forwardRef,
  type ComponentPropsWithoutRef,
  type ElementRef,
} from 'react'
import { cn } from '../../lib/cn'

type SwitchProps = Omit<
  ComponentPropsWithoutRef<typeof SwitchPrimitive.Root>,
  'checked' | 'onCheckedChange'
> & {
  isSelected?: boolean
  onValueChange?: (value: boolean) => void
  size?: 'sm' | 'md'
}

export const Switch = forwardRef<
  ElementRef<typeof SwitchPrimitive.Root>,
  SwitchProps
>(function Switch(
  { className, isSelected, onValueChange, size = 'md', ...props },
  ref,
) {
  const dims =
    size === 'sm'
      ? 'h-4 w-7 after:h-3 after:w-3 data-[state=checked]:after:translate-x-3'
      : 'h-5 w-9 after:h-4 after:w-4 data-[state=checked]:after:translate-x-4'

  return (
    <SwitchPrimitive.Root
      ref={ref}
      checked={isSelected}
      onCheckedChange={onValueChange}
      className={cn(
        'relative inline-flex shrink-0 cursor-pointer items-center rounded-full border border-transparent transition-colors',
        'bg-white/[0.08] data-[state=checked]:bg-primary',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background',
        'disabled:cursor-not-allowed disabled:opacity-50',
        dims,
        "after:absolute after:left-0.5 after:top-1/2 after:-translate-y-1/2 after:rounded-full after:bg-white after:shadow-sm after:transition-transform after:content-['']",
        className,
      )}
      {...props}
    />
  )
})
