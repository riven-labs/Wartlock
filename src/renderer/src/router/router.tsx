import MainLayout from '@renderer/app/layout'
import NotFound from '@renderer/app/not-found'
import Settings from '@renderer/app/settings/page'
import Wallet from '@renderer/app/wallets/[id]/page'
import Wallets from '@renderer/app/wallets/page'
import { createBrowserRouter } from 'react-router'

export const router = createBrowserRouter([
  {
    element: <MainLayout />,
    children: [
      {
        path: '/',
        element: <Wallets />,
      },
      {
        path: '/wallet/:walletId',
        element: <Wallet />,
      },
      {
        path: '/settings',
        element: <Settings />,
      },
    ],
  },
  {
    path: '*',
    element: <NotFound />,
  },
])
