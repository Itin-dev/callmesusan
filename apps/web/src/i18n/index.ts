import i18n from 'i18next'
import LanguageDetector from 'i18next-browser-languagedetector'
import { initReactI18next } from 'react-i18next'
import ar from './locales/ar.json'
import de from './locales/de.json'
import en from './locales/en.json'
import ru from './locales/ru.json'
import uk from './locales/uk.json'

/** Supported languages, labelled in their own language so people recognise them. */
export const LANGUAGES = [
  { code: 'en', name: 'English', dir: 'ltr' },
  { code: 'de', name: 'Deutsch', dir: 'ltr' },
  { code: 'uk', name: 'Українська', dir: 'ltr' },
  { code: 'ru', name: 'Русский', dir: 'ltr' },
  { code: 'ar', name: 'العربية', dir: 'rtl' },
] as const

export type LanguageCode = (typeof LANGUAGES)[number]['code']

/** Keep <html lang dir> in sync so screen readers and RTL layout follow the language. */
function syncDocument(lng: string) {
  const language = LANGUAGES.find((l) => l.code === lng) ?? LANGUAGES[0]
  document.documentElement.lang = language.code
  document.documentElement.dir = language.dir
}

i18n.on('languageChanged', syncDocument)

void i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      de: { translation: de },
      uk: { translation: uk },
      ru: { translation: ru },
      ar: { translation: ar },
    },
    supportedLngs: LANGUAGES.map((l) => l.code),
    nonExplicitSupportedLngs: true,
    fallbackLng: 'en',
    interpolation: { escapeValue: false },
    detection: { order: ['localStorage', 'navigator'], caches: ['localStorage'] },
  })

export default i18n
