import { Select, SelectItem } from '@renderer/components/ui/select'
import type { FC } from 'react'
import { useTranslation } from 'react-i18next'
import { BsGlobe } from 'react-icons/bs'

type Language = { key: string; name: string }

const languages: Language[] = [
  { key: 'en', name: 'English' },
  { key: 'zh', name: '中文' },
]

export const LanguageDropdown: FC = () => {
  const { i18n, t } = useTranslation()

  const current = i18n.language.substring(0, 2)

  const handleChange = (value: string): void => {
    i18n.changeLanguage(value)
    localStorage.setItem('i18nextLng', value)
  }

  const renderValue = (val: string | undefined): React.ReactNode => {
    const lang = languages.find((l) => l.key === val)
    return (
      <div className="flex items-center gap-2">
        <BsGlobe size={14} className="text-riven-muted" />
        <span className="text-sm text-foreground">
          {lang?.name ?? t('settings.selectLanguage')}
        </span>
      </div>
    )
  }

  return (
    <Select
      label={t('settings.language')}
      value={current}
      onValueChange={handleChange}
      renderValue={renderValue}
      aria-label={t('settings.language')}
    >
      {languages.map((lang) => (
        <SelectItem key={lang.key} value={lang.key}>
          {lang.name}
        </SelectItem>
      ))}
    </Select>
  )
}
