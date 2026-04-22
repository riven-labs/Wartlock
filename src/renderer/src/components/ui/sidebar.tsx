import { AnimatePresence, motion } from 'framer-motion'
import React, {
  createContext,
  useContext,
  useState,
  type ComponentProps,
  type FC,
} from 'react'
import { LuMenu, LuX } from 'react-icons/lu'
import { NavLink } from 'react-router'
import { cn } from '../../lib/cn'

interface Links {
  label: string
  href: string
  icon: React.JSX.Element | React.ReactNode
}

interface SidebarContextProps {
  open: boolean
  setOpen: React.Dispatch<React.SetStateAction<boolean>>
  animate: boolean
}

const SidebarContext = createContext<SidebarContextProps | undefined>(undefined)

export const useSidebar = (): SidebarContextProps => {
  const context = useContext(SidebarContext)
  if (!context) {
    throw new Error('useSidebar must be used within a SidebarProvider')
  }
  return context
}

export const SidebarProvider: FC<{
  children: React.ReactNode
  open?: boolean
  setOpen?: React.Dispatch<React.SetStateAction<boolean>>
  animate?: boolean
}> = ({ children, open: openProp, setOpen: setOpenProp, animate = true }) => {
  const [openState, setOpenState] = useState(false)

  const open = openProp !== undefined ? openProp : openState
  const setOpen = setOpenProp !== undefined ? setOpenProp : setOpenState

  return (
    <SidebarContext.Provider value={{ open, setOpen, animate }}>
      {children}
    </SidebarContext.Provider>
  )
}

export const Sidebar: FC<{
  children: React.ReactNode
  open?: boolean
  setOpen?: React.Dispatch<React.SetStateAction<boolean>>
  animate?: boolean
}> = ({ children, open, setOpen, animate }) => {
  return (
    <SidebarProvider open={open} setOpen={setOpen} animate={animate}>
      {children}
    </SidebarProvider>
  )
}

export const SidebarBody: FC<ComponentProps<typeof motion.div>> = (props) => {
  return (
    <>
      <DesktopSidebar {...props} />
      <MobileSidebar {...(props as ComponentProps<'div'>)} />
    </>
  )
}

export const DesktopSidebar: FC<ComponentProps<typeof motion.div>> = ({
  className,
  children,
  ...props
}) => {
  const { open, setOpen, animate } = useSidebar()
  return (
    <motion.div
      className={cn(
        'group/sidebar hidden h-full w-[72px] shrink-0 flex-col md:flex',
        className,
      )}
      animate={{
        width: animate ? (open ? 240 : 72) : 72,
      }}
      transition={{ duration: 0.22, ease: [0.22, 0.61, 0.36, 1] }}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      {...props}
    >
      {children}
    </motion.div>
  )
}

export const MobileSidebar: FC<ComponentProps<'div'>> = ({
  className,
  children,
  ...props
}) => {
  const { open, setOpen } = useSidebar()

  return (
    <div
      className={cn(
        'flex h-12 w-full flex-row items-center justify-between border-b border-riven-border bg-riven-surface px-4 md:hidden',
      )}
      {...props}
    >
      <button className="z-20 flex cursor-pointer">
        <LuMenu size={20} onClick={() => setOpen(!open)} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ x: '-100%', opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: '-100%', opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className={cn(
              'fixed inset-0 z-[100] flex h-full w-full flex-col justify-between bg-riven-surface p-10',
              className,
            )}
          >
            <button
              className="absolute right-6 top-6 z-50 cursor-pointer text-riven-muted hover:text-foreground"
              onClick={() => setOpen(!open)}
            >
              <LuX size={20} />
            </button>
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export const SidebarLink: FC<
  {
    link: Links
    className?: string
  } & Omit<ComponentProps<typeof NavLink>, 'to'>
> = ({ link, className, ...props }) => {
  const { open, animate } = useSidebar()
  return (
    <NavLink
      to={link.href}
      className={({ isActive }) =>
        cn(
          'group relative flex items-center gap-4 rounded-lg px-3 py-2.5 text-sm text-riven-muted transition-colors hover:bg-white/5 hover:text-foreground',
          isActive && 'bg-white/[0.06] text-foreground',
          className,
        )
      }
      {...props}
    >
      {({ isActive }) => (
        <>
          {isActive && (
            <span className="absolute left-0 top-1/2 h-5 w-[2px] -translate-y-1/2 rounded-full bg-primary" />
          )}
          <span
            className={cn(
              'flex items-center justify-center',
              isActive ? 'text-primary' : 'text-riven-muted',
            )}
          >
            {link.icon}
          </span>
          <motion.span
            animate={{
              display: animate
                ? open
                  ? 'inline-block'
                  : 'none'
                : 'inline-block',
              opacity: animate ? (open ? 1 : 0) : 1,
            }}
            transition={{ duration: 0.15 }}
            className="whitespace-pre text-sm"
          >
            {link.label}
          </motion.span>
        </>
      )}
    </NavLink>
  )
}
