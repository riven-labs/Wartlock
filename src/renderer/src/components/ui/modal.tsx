import * as DialogPrimitive from '@radix-ui/react-dialog'
import {
  forwardRef,
  type ComponentPropsWithoutRef,
  type ElementRef,
  type FC,
  type ReactNode,
} from 'react'
import { LuX } from 'react-icons/lu'
import { cn } from '../../lib/cn'

type ModalSize = 'sm' | 'md' | 'lg' | 'xl' | '2xl'

type ModalProps = {
  isOpen: boolean
  onOpenChange?: (open: boolean) => void
  onClose?: () => void
  children: ReactNode
  size?: ModalSize
  hideCloseButton?: boolean
  className?: string
}

const sizes: Record<ModalSize, string> = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  '2xl': 'max-w-2xl',
}

export const Modal: FC<ModalProps> = ({
  isOpen,
  onOpenChange,
  onClose,
  children,
  size = 'lg',
  hideCloseButton = false,
  className,
}) => {
  return (
    <DialogPrimitive.Root
      open={isOpen}
      onOpenChange={(open) => {
        onOpenChange?.(open)
        if (!open) onClose?.()
      }}
    >
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md data-[state=closed]:animate-fade-out data-[state=open]:animate-fade-in" />
        <DialogPrimitive.Content
          onOpenAutoFocus={(e) => {
            e.preventDefault()
          }}
          className={cn(
            'fixed left-1/2 top-1/2 z-50 w-[calc(100%-2rem)] -translate-x-1/2 -translate-y-1/2',
            'overflow-hidden rounded-2xl border border-riven-border',
            // subtle gradient + soft glow
            'bg-[linear-gradient(180deg,#151519_0%,#101013_100%)]',
            'shadow-[0_0_0_1px_rgba(255,255,255,0.03),0_1px_0_rgba(255,255,255,0.04)_inset,0_40px_80px_-20px_rgba(0,0,0,0.8)]',
            'data-[state=closed]:animate-scale-out data-[state=open]:animate-scale-in',
            sizes[size],
            className,
          )}
        >
          {!hideCloseButton && (
            <DialogPrimitive.Close
              className="absolute right-4 top-4 z-10 rounded-md p-1.5 text-riven-muted transition-colors hover:bg-white/5 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
              aria-label="Close"
            >
              <LuX size={16} />
            </DialogPrimitive.Close>
          )}
          {children}
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}

type ModalHeaderProps = {
  className?: string
  icon?: ReactNode
  children: ReactNode
}

export const ModalHeader: FC<ModalHeaderProps> = ({
  className,
  icon,
  children,
}) => (
  <div
    className={cn(
      'flex items-start gap-4 border-b border-riven-border px-8 pb-5 pt-7',
      'bg-[radial-gradient(ellipse_at_top_left,rgba(47,111,235,0.08),transparent_60%)]',
      className,
    )}
  >
    {icon && (
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-riven-border bg-white/[0.03] text-foreground">
        {icon}
      </div>
    )}
    <div className="flex min-w-0 flex-1 flex-col gap-1">{children}</div>
  </div>
)

export const ModalTitle: FC<{ className?: string; children: ReactNode }> = ({
  className,
  children,
}) => (
  <DialogPrimitive.Title asChild>
    <h3
      className={cn(
        'text-lg font-semibold tracking-tight text-foreground',
        className,
      )}
    >
      {children}
    </h3>
  </DialogPrimitive.Title>
)

export const ModalDescription: FC<{
  className?: string
  children: ReactNode
}> = ({ className, children }) => (
  <DialogPrimitive.Description asChild>
    <p className={cn('text-sm leading-relaxed text-riven-muted', className)}>
      {children}
    </p>
  </DialogPrimitive.Description>
)

export const ModalBody: FC<{ className?: string; children: ReactNode }> = ({
  className,
  children,
}) => <div className={cn('px-8 py-7', className)}>{children}</div>

export const ModalFooter: FC<{ className?: string; children: ReactNode }> = ({
  className,
  children,
}) => (
  <div
    className={cn(
      'flex items-center justify-end gap-2 border-t border-riven-border bg-white/[0.01] px-8 py-4',
      className,
    )}
  >
    {children}
  </div>
)

export const ModalClose = forwardRef<
  ElementRef<typeof DialogPrimitive.Close>,
  ComponentPropsWithoutRef<typeof DialogPrimitive.Close>
>(function ModalClose(props, ref) {
  return <DialogPrimitive.Close ref={ref} {...props} />
})
