import * as DropdownPrimitive from '@radix-ui/react-dropdown-menu'
import {
  forwardRef,
  type ComponentPropsWithoutRef,
  type ElementRef,
  type ReactNode,
} from 'react'
import { cn } from '../../lib/cn'

export const Dropdown = DropdownPrimitive.Root
export const DropdownTrigger = DropdownPrimitive.Trigger

export const DropdownContent = forwardRef<
  ElementRef<typeof DropdownPrimitive.Content>,
  ComponentPropsWithoutRef<typeof DropdownPrimitive.Content>
>(function DropdownContent(
  { className, sideOffset = 6, align = 'end', ...props },
  ref,
) {
  return (
    <DropdownPrimitive.Portal>
      <DropdownPrimitive.Content
        ref={ref}
        sideOffset={sideOffset}
        align={align}
        className={cn(
          'z-50 min-w-[220px] overflow-hidden rounded-lg border border-riven-border bg-riven-surface p-1 shadow-[0_0_0_1px_rgba(255,255,255,0.02),0_20px_40px_-12px_rgba(0,0,0,0.6)]',
          'data-[state=closed]:animate-scale-out data-[state=open]:animate-scale-in',
          className,
        )}
        {...props}
      />
    </DropdownPrimitive.Portal>
  )
})

type DropdownItemProps = ComponentPropsWithoutRef<
  typeof DropdownPrimitive.Item
> & {
  description?: ReactNode
  startContent?: ReactNode
}

export const DropdownItem = forwardRef<
  ElementRef<typeof DropdownPrimitive.Item>,
  DropdownItemProps
>(function DropdownItem(
  { className, description, startContent, children, ...props },
  ref,
) {
  return (
    <DropdownPrimitive.Item
      ref={ref}
      className={cn(
        'group relative flex cursor-default select-none items-start gap-2.5 rounded-md px-3 py-2 text-sm outline-none',
        'data-[highlighted]:bg-white/[0.06]',
        'data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
        className,
      )}
      {...props}
    >
      {startContent && (
        <span className="mt-0.5 text-riven-muted group-data-[highlighted]:text-foreground">
          {startContent}
        </span>
      )}
      <span className="flex flex-col gap-0.5">
        <span className="text-foreground">{children}</span>
        {description && (
          <span className="text-xs text-riven-muted">{description}</span>
        )}
      </span>
    </DropdownPrimitive.Item>
  )
})

export const DropdownSeparator = (): JSX.Element => (
  <DropdownPrimitive.Separator className="my-1 h-px bg-riven-border" />
)

export const DropdownLabel = forwardRef<
  ElementRef<typeof DropdownPrimitive.Label>,
  ComponentPropsWithoutRef<typeof DropdownPrimitive.Label>
>(function DropdownLabel({ className, ...props }, ref) {
  return (
    <DropdownPrimitive.Label
      ref={ref}
      className={cn(
        'px-3 pb-1 pt-2 text-[10px] uppercase tracking-wider text-riven-muted',
        className,
      )}
      {...props}
    />
  )
})
