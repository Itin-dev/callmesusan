import { useTranslation } from 'react-i18next'
import { useLocation, useNavigate } from 'react-router'
import backIcon from '@/assets/icons/back.svg'
import { Button } from '@/components/ui/button'

/** Header back arrow. Opened directly (no history inside the app): goes Home instead of leaving the app. */
export default function BackButton() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const location = useLocation()
  const goBack = () => (location.key === 'default' ? navigate('/') : navigate(-1))

  return (
    <Button variant="ghost" size="icon" className="-ms-2.5 size-11 rounded-full" aria-label={t('common.back')} onClick={goBack}>
      <img src={backIcon} alt="" width={24} height={24} className="rtl:-scale-x-100" />
    </Button>
  )
}
