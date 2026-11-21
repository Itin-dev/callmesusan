import { Link } from 'react-router'

/** Suggested question chip for Psst (Figma component Chip). Opens the chat with the question. */
export default function SuggestionChip({ question }: { question: string }) {
  return (
    <Link
      to={`/psst?q=${encodeURIComponent(question)}`}
      className="rounded-full border bg-card px-3.5 py-2 text-small font-medium text-foreground outline-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50"
    >
      {question}
    </Link>
  )
}
