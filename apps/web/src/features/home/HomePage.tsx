import { BadgeCheck, ChevronRight, EyeOff, UserX } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import { Badge } from '@/components/ui/badge'
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { LANGUAGES } from '@/i18n'
import { cn } from '@/lib/utils'
import { type Topic, TOPICS } from './topics'

const BADGES = [
  { key: 'free', Icon: BadgeCheck },
  { key: 'anonymous', Icon: EyeOff },
  { key: 'noSignup', Icon: UserX },
] as const

function TopicCard({ topic }: { topic: Topic }) {
  const { t } = useTranslation()
  const { id, Icon, urgent } = topic
  return (
    <Link
      to={`/topic/${id}`}
      className="group block h-full rounded-xl outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
    >
      <Card
        className={cn(
          'h-full transition-colors group-hover:bg-accent',
          urgent && 'bg-destructive/10 ring-destructive/30 group-hover:bg-destructive/15',
        )}
      >
        <CardHeader className="grid-cols-[auto_1fr_auto] items-center gap-x-4">
          <span
            className={cn(
              'row-span-2 flex size-12 items-center justify-center rounded-lg',
              urgent
                ? 'bg-destructive text-white'
                : 'bg-primary/10 text-primary dark:bg-primary/30 dark:text-primary-foreground',
            )}
          >
            <Icon aria-hidden="true" className="size-6" />
          </span>
          <CardTitle className={cn('text-base', urgent && 'text-destructive')}>
            {t(`topics.${id}`)}
          </CardTitle>
          <ChevronRight
            aria-hidden="true"
            className="row-span-2 size-5 text-muted-foreground transition-transform group-hover:translate-x-0.5 rtl:rotate-180 rtl:group-hover:-translate-x-0.5"
          />
          <CardDescription className="col-start-2">{t(`topicHints.${id}`)}</CardDescription>
        </CardHeader>
      </Card>
    </Link>
  )
}

export default function HomePage() {
  const { t, i18n } = useTranslation()

  return (
    <>
      <section className="flex flex-col gap-4">
        <h1 className="text-4xl font-bold tracking-tight text-balance sm:text-5xl">{t('home.title')}</h1>
        <p className="text-lg text-muted-foreground sm:text-xl">{t('home.intro')}</p>
        <ul className="flex flex-wrap gap-2">
          {BADGES.map(({ key, Icon }) => (
            <li key={key}>
              <Badge variant="secondary" className="h-7 gap-1.5 px-3 text-sm">
                <Icon aria-hidden="true" />
                {t(`home.badges.${key}`)}
              </Badge>
            </li>
          ))}
        </ul>
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

      <section aria-labelledby="topics-heading" className="flex flex-col gap-3">
        <h2 id="topics-heading" className="text-xl font-semibold">
          {t('home.topics')}
        </h2>
        <nav aria-labelledby="topics-heading">
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {TOPICS.map((topic) => (
              <li key={topic.id} className={cn(topic.urgent && 'sm:col-span-2 lg:col-span-4')}>
                <TopicCard topic={topic} />
              </li>
            ))}
          </ul>
        </nav>
      </section>
    </>
  )
}
