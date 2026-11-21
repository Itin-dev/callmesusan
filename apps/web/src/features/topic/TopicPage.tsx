// Placeholder topic screen; #34 fills in the short info and "Ask a question" button.
import { ArrowLeft } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link, useParams } from 'react-router'
import { buttonVariants } from '@/components/ui/button'
import { findTopic } from '@/features/home/topics'
import { cn } from '@/lib/utils'

export default function TopicPage() {
  const { t } = useTranslation()
  const topic = findTopic(useParams().topicId)

  return (
    <>
      <Link
        to="/"
        className={cn(buttonVariants({ variant: 'ghost', size: 'lg' }), 'h-11 self-start text-base')}
      >
        <ArrowLeft aria-hidden="true" className="rtl:rotate-180" />
        {t('topic.back')}
      </Link>
      {topic ? (
        <>
          <h1 className="flex items-center gap-3 text-3xl font-bold tracking-tight">
            <topic.Icon aria-hidden="true" className="size-8" />
            {t(`topics.${topic.id}`)}
          </h1>
          <p className="text-lg text-muted-foreground">{t('topic.comingSoon')}</p>
        </>
      ) : (
        <h1 className="text-3xl font-bold tracking-tight">{t('topic.notFound')}</h1>
      )}
    </>
  )
}
