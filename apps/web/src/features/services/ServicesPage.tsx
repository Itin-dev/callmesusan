import { useTranslation } from 'react-i18next'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import Footer from '@/Footer'
import { LANGUAGES } from '@/i18n'

/** Services tab: app settings for the demo (language) and the build version. */
export default function ServicesPage() {
  const { t, i18n } = useTranslation()

  return (
    <div className="flex flex-1 flex-col gap-5 px-4 pt-3 pb-6">
      <h1 className="text-center text-hero">{t('services.title')}</h1>

      <section aria-labelledby="language-heading" className="flex flex-col gap-3 rounded-xl bg-card p-4">
        <h2 id="language-heading" className="text-heading">
          {t('services.language')}
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
              className="h-11 grow basis-28 text-body aria-pressed:border-primary aria-pressed:bg-primary aria-pressed:text-primary-foreground hover:aria-pressed:bg-primary/90 hover:aria-pressed:text-primary-foreground [&:lang(ar)]:text-lg"
            >
              {language.name}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </section>

      <Footer commit={import.meta.env.VITE_COMMIT_SHA ?? ''} env={import.meta.env.VITE_DEPLOY_ENV ?? ''} />
    </div>
  )
}
