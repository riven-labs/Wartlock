import * as SelectPrimitive from '@radix-ui/react-select'
import {
  forwardRef,
  type ComponentPropsWithoutRef,
  type ElementRef,
  type ReactNode,
} from 'react'
import { LuCheck, LuChevronDown } from 'react-icons/lu'
import { cn } from '../../lib/cn'

type SelectProps = {
  label?: ReactNode
  value?: string
  defaultValue?: string
  onValueChange?: (value: string) => void
  placeholder?: ReactNode
  children: ReactNode
  className?: string
  triggerClassName?: string
  renderValue?: (value: string | undefined) => ReactNode
  'aria-label'?: string
}

export const Select = ({
  label,
  value,
  defaultValue,
  onValueChange,
  placeholder,
  children,
  className,
  triggerClassName,
  renderValue,
  ...props
}: SelectProps): JSX.Element => {
  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      {label && (
        <label className="text-xs uppercase tracking-wider text-riven-muted">
          {label}
        </label>
      )}
      <SelectPrimitive.Root
        value={value}
        defaultValue={defaultValue}
        onValueChange={onValueChange}
      >
        <SelectPrimitive.Trigger
          aria-label={props['aria-label']}
          className={cn(
            'inline-flex w-full items-center justify-between gap-2 rounded-md border border-riven-border bg-transparent px-3 py-2 text-sm transition-colors',
            'hover:border-riven-border-strong focus-visible:border-primary focus-visible:outline-none',
            'data-[placeholder]:text-riven-muted',
            'disabled:cursor-not-allowed disabled:opacity-50',
            triggerClassName,
          )}
        >
          <SelectPrimitive.Value placeholder={placeholder}>
            {renderValue ? renderValue(value) : undefined}
          </SelectPrimitive.Value>
          <SelectPrimitive.Icon asChild>
            <LuChevronDown size={14} className="text-riven-muted" />
          </SelectPrimitive.Icon>
        </SelectPrimitive.Trigger>

        <SelectPrimitive.Portal>
          <SelectPrimitive.Content
            position="popper"
            sideOffset={6}
            className={cn(
              'z-50 overflow-hidden rounded-lg border border-riven-border bg-riven-surface shadow-[0_0_0_1px_rgba(255,255,255,0.02),0_20px_40px_-12px_rgba(0,0,0,0.6)]',
              'data-[state=closed]:animate-scale-out data-[state=open]:animate-scale-in',
              'min-w-[var(--radix-select-trigger-width)]',
            )}
          >
            <SelectPrimitive.Viewport className="max-h-[300px] p-1">
              {children}
            </SelectPrimitive.Viewport>
          </SelectPrimitive.Content>
        </SelectPrimitive.Portal>
      </SelectPrimitive.Root>
    </div>
  )
}

export const SelectItem = forwardRef<
  ElementRef<typeof SelectPrimitive.Item>,
  ComponentPropsWithoutRef<typeof SelectPrimitive.Item>
>(function SelectItem({ className, children, ...props }, ref) {
  return (
    <SelectPrimitive.Item
      ref={ref}
      className={cn(
        'relative flex w-full cursor-default select-none items-center gap-2 rounded-md py-2 pl-3 pr-8 text-sm outline-none',
        'data-[highlighted]:bg-white/[0.06] data-[state=checked]:text-foreground',
        'data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
        className,
      )}
      {...props}
    >
      <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
      <SelectPrimitive.ItemIndicator className="absolute right-2 inline-flex items-center">
        <LuCheck size={14} className="text-primary" />
      </SelectPrimitive.ItemIndicator>
    </SelectPrimitive.Item>
  )
})

export const SelectSeparator = (): JSX.Element => (
  <SelectPrimitive.Separator className="my-1 h-px bg-riven-border" />
)
