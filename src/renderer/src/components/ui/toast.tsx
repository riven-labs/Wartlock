import * as ToastPrimitive from '@radix-ui/react-toast'
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type FC,
  type ReactNode,
} from 'react'
import { LuCircleAlert, LuCircleCheck, LuCircleX, LuInfo } from 'react-icons/lu'
import { cn } from '../../lib/cn'

type ToastColor = 'success' | 'danger' | 'warning' | 'default'

type ToastInput = {
  title: ReactNode
  description?: ReactNode
  color?: ToastColor
  timeout?: number
}

type ToastRecord = ToastInput & {
  id: string
  open: boolean
}

type ToastContextValue = {
  toast: (input: ToastInput) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

const iconByColor: Record<ToastColor, ReactNode> = {
  success: <LuCircleCheck size={18} className="text-success" />,
  danger: <LuCircleX size={18} className="text-danger" />,
  warning: <LuCircleAlert size={18} className="text-warning" />,
  default: <LuInfo size={18} className="text-riven-muted" />,
}

export const ToastProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastRecord[]>([])

  const toast = useCallback((input: ToastInput) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
    setToasts((prev) => [
      ...prev,
      { ...input, id, open: true, timeout: input.timeout ?? 4000 },
    ])
  }, [])

  const setOpen = useCallback((id: string, open: boolean) => {
    setToasts((prev) => prev.map((t) => (t.id === id ? { ...t, open } : t)))
  }, [])

  const prune = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const value = useMemo(() => ({ toast }), [toast])

  // Register the toast fn globally so non-hook callers can use addToast()
  if (typeof window !== 'undefined') {
    ;(window as unknown as { __toast?: (i: ToastInput) => void }).__toast =
      toast
  }

  return (
    <ToastContext.Provider value={value}>
      <ToastPrimitive.Provider swipeDirection="right" duration={4000}>
        {children}
        {toasts.map((t) => {
          const color = t.color || 'default'
          return (
            <ToastPrimitive.Root
              key={t.id}
              open={t.open}
              duration={t.timeout}
              onOpenChange={(o) => {
                setOpen(t.id, o)
                if (!o) setTimeout(() => prune(t.id), 250)
              }}
              className={cn(
                'pointer-events-auto relative flex w-[360px] gap-3 rounded-lg border border-riven-border bg-riven-surface-2 p-4 shadow-lg',
                'data-[state=closed]:animate-toast-out data-[state=open]:animate-toast-in',
              )}
            >
              <span className="mt-0.5 shrink-0">{iconByColor[color]}</span>
              <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                <ToastPrimitive.Title className="text-sm font-medium text-foreground">
                  {t.title}
                </ToastPrimitive.Title>
                {t.description && (
                  <ToastPrimitive.Description className="text-xs leading-relaxed text-riven-muted">
                    {t.description}
                  </ToastPrimitive.Description>
                )}
              </div>
              <ToastPrimitive.Close
                aria-label="Dismiss"
                className="absolute right-2 top-2 rounded-md p-1 text-riven-muted transition-colors hover:bg-white/5 hover:text-foreground"
              >
                <LuCircleX size={14} />
              </ToastPrimitive.Close>
            </ToastPrimitive.Root>
          )
        })}
        <ToastPrimitive.Viewport className="pointer-events-none fixed right-4 top-4 z-[100] flex w-[360px] flex-col gap-2 outline-none" />
      </ToastPrimitive.Provider>
    </ToastContext.Provider>
  )
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx
}

// Imperative shortcut for non-hook callers (matches the previous HeroUI API surface).
export function addToast(input: ToastInput): void {
  const fn = (window as unknown as { __toast?: (i: ToastInput) => void })
    .__toast
  if (fn) fn(input)
}
