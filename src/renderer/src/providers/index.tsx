import { ToastProvider } from '@renderer/components/ui/toast'
import React, { FC } from 'react'
import { ThemeProvider } from './ThemeProvider'

const Providers: FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <ThemeProvider>
      <ToastProvider>{children}</ToastProvider>
    </ThemeProvider>
  )
}

export default Providers
