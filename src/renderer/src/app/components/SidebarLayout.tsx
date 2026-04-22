import {
  Sidebar,
  SidebarBody,
  SidebarLink,
} from '@renderer/components/ui/sidebar'
import { addToast } from '@renderer/components/ui/toast'
import { cn } from '@renderer/lib/cn'
import { useRequest } from 'ahooks'
import { useState, type FC } from 'react'
import { useTranslation } from 'react-i18next'
import { FiSettings } from 'react-icons/fi'
import { GoHomeFill } from 'react-icons/go'
import { LuHeartHandshake, LuMonitorCog, LuPickaxe } from 'react-icons/lu'
import { useParams } from 'react-router'
import { Wallet } from '../wallets/types'
import { Logo } from './Logo'
import { RivenBrand } from './RivenBrand'

export const SidebarLayout: FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [open, setOpen] = useState(false)
  const { walletId } = useParams<{ walletId: string }>()
  const { t } = useTranslation()

  const links = [
    {
      label: t('navigation.home'),
      href: '/',
      icon: <GoHomeFill size={20} />,
    },
    {
      label: t('navigation.hardware'),
      href: '/hardware',
      icon: <LuMonitorCog size={20} />,
    },
    {
      label: t('navigation.mining'),
      href: '/mining',
      icon: <LuPickaxe size={20} />,
    },
    {
      label: t('navigation.support'),
      href: '/support',
      icon: <LuHeartHandshake size={20} />,
    },
    {
      label: t('navigation.settings'),
      href: '/settings',
      icon: <FiSettings size={20} />,
    },
  ]

  const { data: wallet } = useRequest<Wallet, Error[]>(
    async () => window.dbAPI.getWalletById(Number(walletId)),
    {
      ready: !!walletId,
      cacheKey: walletId,
    },
  )
  const { data: privateKey } = useRequest<string | null, Error[]>(
    async () => window.storageAPI.getPrivateKey(wallet?.address || ''),
    {
      ready: !!wallet,
    },
  )

  return (
    <div className="flex h-screen w-full flex-1 flex-col overflow-hidden bg-background text-foreground md:flex-row">
      <Sidebar open={open} setOpen={setOpen}>
        <SidebarBody className="justify-between gap-10 border-r border-riven-border bg-riven-surface px-3 py-5 *:z-20">
          <Logo />
          <div
            className={cn(
              'flex flex-1 flex-col overflow-y-auto overflow-x-hidden',
              open && 'w-full',
            )}
          >
            <div className="mt-6 flex w-full flex-col gap-1">
              {links.map((link, idx) => (
                <SidebarLink
                  key={idx}
                  link={link}
                  className="flex items-center gap-4 rounded-lg px-3 py-2.5 text-sm"
                  onClick={(e) => {
                    if (!privateKey || !wallet || !walletId) return
                    e.preventDefault()
                    addToast({
                      title: t('navigation.loggedIn'),
                      description: t('navigation.logoutFirst'),
                      color: 'danger',
                    })
                  }}
                />
              ))}
            </div>
          </div>

          <RivenBrand />
        </SidebarBody>
      </Sidebar>
      <div className="flex-1 overflow-auto px-4 md:px-10">{children}</div>
    </div>
  )
}
