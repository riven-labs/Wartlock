import { createContext, FC, useContext, useEffect } from 'react'

export type Theme = 'dark'

type ThemeContextType = {
  theme: Theme
}

export const ThemeContext = createContext<ThemeContextType | undefined>(
  undefined,
)

export const ThemeProvider: FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  useEffect(() => {
    document.body.classList.add('dark')
    document.body.classList.remove('light')
    localStorage.setItem('theme', 'dark')
  }, [])

  return (
    <ThemeContext.Provider value={{ theme: 'dark' }}>
      {children}
    </ThemeContext.Provider>
  )
}

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}
