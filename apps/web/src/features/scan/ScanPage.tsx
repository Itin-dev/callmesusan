import { useTranslation } from 'react-i18next'
import cameraIcon from '@/assets/icons/camera.svg'
import BackButton from '@/components/shell/BackButton'
import { cn } from '@/lib/utils'
import ScanFeedback from './ScanFeedback'
import { useReceiptScan } from './useReceiptScan'

/** Home "Scan": photo of a shop receipt → Psst attaches it to the matching payment. */
export default function ScanPage() {
  const { t } = useTranslation()
  const receiptScan = useReceiptScan()
  const { scan, onChange } = receiptScan

  return (
    <div className="flex flex-col gap-4 px-4 pt-3 pb-6">
      <div className="flex items-center justify-between">
        <BackButton />
        <h1 className="text-title">{t('scan.title')}</h1>
        <span className="size-11 -me-2.5" />
      </div>

      <section className="flex flex-col gap-4 rounded-xl bg-card p-4">
        <p className="text-body">{t('scan.intro')}</p>
        <label
          className={cn(
            'flex h-12 cursor-pointer items-center justify-center gap-2 rounded-full bg-primary text-body font-semibold text-primary-foreground has-focus-visible:ring-3 has-focus-visible:ring-ring/50',
            scan.isPending && 'pointer-events-none opacity-50',
          )}
        >
          <img src={cameraIcon} alt="" width={24} height={24} />
          {t('scan.choose')}
          <input
            type="file"
            accept="image/*"
            capture="environment"
            className="sr-only"
            disabled={scan.isPending}
            onChange={onChange}
          />
        </label>
      </section>

      <ScanFeedback scan={receiptScan} />
    </div>
  )
}
