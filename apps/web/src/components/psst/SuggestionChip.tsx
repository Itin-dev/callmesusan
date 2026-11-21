import { Link } from 'react-router'

const chipClass =
  'rounded-full border bg-card px-3.5 py-2 text-start text-small font-medium text-foreground outline-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50'

type Props = {
  question: string
  /** Inside the chat: ask the question right here instead of opening /psst?q=... */
  onSelect?: (question: string) => void
}

/** Suggested question chip for Psst (Figma component Chip). Opens the chat with the question. */
export default function SuggestionChip({ question, onSelect }: Props) {
  if (onSelect) {
    return (
      <button type="button" className={chipClass} onClick={() => onSelect(question)}>
        {question}
      </button>
    )
  }
  return (
    <Link to={`/psst?q=${encodeURIComponent(question)}`} className={chipClass}>
      {question}
    </Link>
  )
}
