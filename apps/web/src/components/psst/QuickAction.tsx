import type { ReactNode } from 'react'
import { Link } from 'react-router'
import { cn } from '@/lib/utils'

type Props = {
  /** SVG asset URL from src/assets/icons, or a lucide icon element. */
  icon: string | ReactNode
  label: string
  /** Figma QuickAction variants: primary = yellow, psst = assistant entry point, default = white. */
  variant?: 'default' | 'primary' | 'psst'
  /** Route to open; without it the action is decorative (outside the MVP). */
  to?: string
}

const circle = {
  default: 'bg-card',
  primary: 'bg-primary',
  psst: 'bg-psst',
}

/** Round quick-access action (PostFinance pattern). */
export default function QuickAction({ icon, label, variant = 'default', to }: Props) {
  const content = (
    <>
      <span className={cn('flex size-14 items-center justify-center rounded-full max-[359px]:size-12', circle[variant])}>
        {typeof icon === 'string' ? <img src={icon} alt="" width={24} height={24} /> : icon}
      </span>
      <span className="text-small">{label}</span>
    </>
  )
  const className = 'flex flex-col items-center gap-2 rounded-2xl outline-none focus-visible:ring-3 focus-visible:ring-ring/50'

  return to ? (
    <Link to={to} className={className}>
      {content}
    </Link>
  ) : (
    <span className={className}>{content}</span>
  )
}
