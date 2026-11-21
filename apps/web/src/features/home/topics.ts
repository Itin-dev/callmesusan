import {
  Baby,
  Briefcase,
  FileText,
  HeartPulse,
  House,
  Languages,
  type LucideIcon,
  ShoppingBasket,
  Siren,
  Wallet,
} from 'lucide-react'

export type Topic = { id: string; Icon: LucideIcon; urgent?: boolean }

/**
 * Home screen topics; labels live in the locale files under `topics.<id>` and `topicHints.<id>`.
 * Urgent help comes first so it is found without scrolling.
 */
export const TOPICS: readonly Topic[] = [
  { id: 'urgent', Icon: Siren, urgent: true },
  { id: 'work', Icon: Briefcase },
  { id: 'housing', Icon: House },
  { id: 'health', Icon: HeartPulse },
  { id: 'language', Icon: Languages },
  { id: 'documents', Icon: FileText },
  { id: 'money', Icon: Wallet },
  { id: 'children', Icon: Baby },
  { id: 'daily-life', Icon: ShoppingBasket },
]

export function findTopic(id: string | undefined) {
  return TOPICS.find((topic) => topic.id === id)
}
