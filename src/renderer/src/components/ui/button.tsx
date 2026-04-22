import { Slot } from '@radix-ui/react-slot'
import {
  forwardRef,
  type ButtonHTMLAttributes,
  type ForwardedRef,
  type ReactNode,
} from 'react'
import { cn } from '../../lib/cn'
import { Spinner } from './spinner'

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'outline' | 'danger'
type ButtonSize = 'sm' | 'md' | 'lg' | 'icon'

export type ButtonProps = Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  'disabled'
> & {
  variant?: ButtonVariant
  size?: ButtonSize
  isLoading?: boolean
  isDisabled?: boolean
  startContent?: ReactNode
  endContent?: ReactNode
  asChild?: boolean
  fullWidth?: boolean
}

const base =
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50'

const variants: Record<ButtonVariant, string> = {
  primary:
    'bg-primary text-primary-foreground hover:bg-primary/90 active:bg-primary/80',
  secondary:
    'bg-white/[0.06] text-foreground hover:bg-white/[0.1] active:bg-white/[0.14]',
  ghost: 'text-riven-muted hover:bg-white/5 hover:text-foreground',
  outline:
    'border border-riven-border bg-transparent text-foreground hover:border-riven-border-strong hover:bg-white/[0.03]',
  danger:
    'bg-danger text-danger-foreground hover:bg-danger/90 active:bg-danger/80',
}

const sizes: Record<ButtonSize, string> = {
  sm: 'h-8 px-3 text-xs',
  md: 'h-9 px-4',
  lg: 'h-10 px-5',
  icon: 'h-9 w-9',
}

export const Button = forwardRef(function Button(
  {
    className,
    variant = 'primary',
    size = 'md',
    isLoading = false,
    isDisabled,
    startContent,
    endContent,
    children,
    type = 'button',
    asChild = false,
    fullWidth = false,
    ...props
  }: ButtonProps,
  ref: ForwardedRef<HTMLButtonElement>,
) {
  const Comp = asChild ? Slot : 'button'
  const disabled = isDisabled || isLoading

  return (
    <Comp
      ref={ref}
      type={asChild ? undefined : type}
      disabled={disabled}
      data-disabled={disabled || undefined}
      className={cn(
        base,
        variants[variant],
        sizes[size],
        fullWidth && 'w-full',
        className,
      )}
      {...props}
    >
      {isLoading ? (
        <Spinner size="sm" className="text-current" />
      ) : (
        startContent
      )}
      {children}
      {!isLoading && endContent}
    </Comp>
  )
})
