import type { FC, FormHTMLAttributes, ReactNode } from 'react'
import { cn } from '../../lib/cn'

type FormProps = FormHTMLAttributes<HTMLFormElement> & {
  children: ReactNode
}

export const Form: FC<FormProps> = ({ className, children, ...props }) => (
  <form className={cn('space-y-6', className)} {...props}>
    {children}
  </form>
)
