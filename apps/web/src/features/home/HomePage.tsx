import { useTranslation } from 'react-i18next'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { LANGUAGES } from '@/i18n'

export default function HomePage() {
  const { t, i18n } = useTranslation()

  return (
    <>
      <section className="flex flex-col gap-4">
        <h1 className="text-4xl font-bold tracking-tight text-balance sm:text-5xl">{t('home.title')}</h1>
        <p className="text-lg text-muted-foreground sm:text-xl">{t('home.intro')}</p>
      </section>

      <section aria-labelledby="language-heading" className="flex flex-col gap-3">
        <h2 id="language-heading" className="text-xl font-semibold">
          {t('home.language')}
        </h2>
        <ToggleGroup
          aria-labelledby="language-heading"
          variant="outline"
          className="flex w-full flex-wrap"
          value={[i18n.resolvedLanguage ?? 'en']}
          onValueChange={(value) => {
            if (value[0]) void i18n.changeLanguage(value[0])
          }}
        >
          {LANGUAGES.map((language) => (
            <ToggleGroupItem
              key={language.code}
              value={language.code}
              lang={language.code}
              dir={language.dir}
              className="h-12 grow basis-28 text-base aria-pressed:border-primary aria-pressed:bg-primary aria-pressed:text-primary-foreground hover:aria-pressed:bg-primary/90 hover:aria-pressed:text-primary-foreground [&:lang(ar)]:text-lg"
            >
              {language.name}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </section>
    </>
  )
}
