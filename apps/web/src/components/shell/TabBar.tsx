import { useTranslation } from 'react-i18next'
import { NavLink } from 'react-router'
import homeIcon from '@/assets/icons/home.svg'
import investIcon from '@/assets/icons/invest.svg'
import offersIcon from '@/assets/icons/offers.svg'
import paymentsIcon from '@/assets/icons/payments.svg'
import servicesIcon from '@/assets/icons/services.svg'
import { cn } from '@/lib/utils'

type Tab = { key: 'home' | 'payments' | 'invest' | 'offers' | 'services'; icon: string; to?: string }

// Payments, Invest and Offers are outside the MVP: shown for the PostFinance look, not linked.
const TABS: Tab[] = [
  { key: 'home', icon: homeIcon, to: '/' },
  { key: 'payments', icon: paymentsIcon },
  { key: 'invest', icon: investIcon },
  { key: 'offers', icon: offersIcon },
  { key: 'services', icon: servicesIcon, to: '/services' },
]

function TabContent({ icon, label, active }: { icon: string; label: string; active: boolean }) {
  return (
    <>
      <span className={cn('flex h-8 w-14 items-center justify-center rounded-2xl', active && 'bg-background')}>
        <img src={icon} alt="" width={22} height={22} />
      </span>
      <span className={cn('text-caption', active ? 'font-semibold text-foreground' : 'text-muted-foreground')}>
        {label}
      </span>
    </>
  )
}

/** Bottom navigation with the five PostFinance areas (Figma component TabBar). */
export default function TabBar() {
  const { t } = useTranslation()
  const itemClass = 'flex flex-col items-center gap-1 rounded-2xl outline-none focus-visible:ring-3 focus-visible:ring-ring/50'

  return (
    <nav
      aria-label={t('tabs.label')}
      className="shrink-0 border-t bg-card px-4 pb-[env(safe-area-inset-bottom)]"
    >
      <ul className="flex h-20 items-center justify-between">
        {TABS.map(({ key, icon, to }) => (
          <li key={key}>
            {to ? (
              <NavLink to={to} end className={itemClass}>
                {({ isActive }) => <TabContent icon={icon} label={t(`tabs.${key}`)} active={isActive} />}
              </NavLink>
            ) : (
              <span className={itemClass}>
                <TabContent icon={icon} label={t(`tabs.${key}`)} active={false} />
              </span>
            )}
          </li>
        ))}
      </ul>
    </nav>
  )
}
