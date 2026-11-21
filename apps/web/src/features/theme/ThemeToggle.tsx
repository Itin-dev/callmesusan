import { Monitor, Moon, Sun } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { type Theme, useTheme } from './ThemeProvider'

const OPTIONS = [
  { value: 'light', Icon: Sun },
  { value: 'dark', Icon: Moon },
  { value: 'system', Icon: Monitor },
] as const satisfies readonly { value: Theme; Icon: unknown }[]

export function ThemeToggle() {
  const { t } = useTranslation()
  const { theme, setTheme } = useTheme()

  return (
    <ToggleGroup
      aria-label={t('theme.label')}
      variant="outline"
      value={[theme]}
      onValueChange={(value) => {
        // A pressed item stays pressed: ignore the "unpress" event that empties the group.
        if (value[0]) setTheme(value[0] as Theme)
      }}
    >
      {OPTIONS.map(({ value, Icon }) => (
        <ToggleGroupItem
          key={value}
          value={value}
          aria-label={t(`theme.${value}`)}
          title={t(`theme.${value}`)}
          className="size-11"
        >
          <Icon aria-hidden="true" />
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  )
}
