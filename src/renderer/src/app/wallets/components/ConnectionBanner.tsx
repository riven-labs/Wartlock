import type { FC } from 'react'
import { useTranslation } from 'react-i18next'
import { LuTriangleAlert } from 'react-icons/lu'
import { Link } from 'react-router'
import type { LiveBalances } from '../useLiveBalances'

export const ConnectionBanner: FC<{ live: LiveBalances }> = ({ live }) => {
  const { t } = useTranslation()

  if (live.peerReachable !== false) return null

  return (
    <div className="flex items-start gap-3 rounded-lg border border-warning/30 bg-warning/5 p-4">
      <LuTriangleAlert size={18} className="mt-0.5 shrink-0 text-warning" />
      <div className="flex-1 space-y-1">
        <p className="text-sm font-medium text-warning">
          {t('dashboard.peerUnreachableTitle')}
        </p>
        <p className="text-xs leading-relaxed text-riven-muted">
          {t('dashboard.peerUnreachableBody', { peer: live.peer })}{' '}
          <Link
            to="/settings"
            className="font-medium text-foreground underline decoration-riven-border underline-offset-2 hover:decoration-foreground"
          >
            {t('dashboard.openSettings')}
          </Link>
        </p>
      </div>
    </div>
  )
}
