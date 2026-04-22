import type { FC } from 'react'
import { useTranslation } from 'react-i18next'
import { IoMdArrowBack } from 'react-icons/io'
import { Link } from 'react-router'

export const SettingsNavbar: FC = () => {
  const { t } = useTranslation()

  return (
    <header className="py-8">
      <Link
        to="/"
        className="inline-flex items-center gap-1.5 text-xs uppercase tracking-wider text-riven-muted transition-colors hover:text-foreground"
      >
        <IoMdArrowBack size={14} />
        <span>{t('navigation.walletManagement')}</span>
      </Link>
      <h1 className="mt-3 text-[28px] font-semibold tracking-tight text-foreground">
        {t('navigation.settings')}
      </h1>
      <p className="mt-1 text-sm text-riven-muted">
        Configure your peer endpoint and language.
      </p>
    </header>
  )
}
