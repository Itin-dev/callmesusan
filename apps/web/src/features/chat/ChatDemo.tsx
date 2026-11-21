import { type FormEvent, useState } from 'react'
import { useTranslation } from 'react-i18next'

type Status = 'idle' | 'loading' | 'error'

export default function ChatDemo() {
  const { i18n } = useTranslation()
  const [message, setMessage] = useState('')
  const [reply, setReply] = useState('')
  const [error, setError] = useState('')
  const [status, setStatus] = useState<Status>('idle')

  async function send(event: FormEvent) {
    event.preventDefault()
    setStatus('loading')
    setError('')
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ role: 'user', content: message }],
          language: i18n.resolvedLanguage ?? 'en',
        }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.detail ?? 'Request failed')
      setReply(data.reply)
      setStatus('idle')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Request failed')
      setStatus('error')
    }
  }

  return (
    <section className="flex flex-col gap-6">
      <h1 className="text-3xl font-bold">Hackathon skeleton</h1>
      <form onSubmit={send} className="flex gap-2">
        <label htmlFor="message" className="sr-only">
          Message
        </label>
        <input
          id="message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Ask something…"
          className="flex-1 rounded-lg border border-input bg-background px-4 py-2 placeholder:text-muted-foreground focus:border-ring focus:outline-none"
        />
        <button
          type="submit"
          disabled={!message.trim() || status === 'loading'}
          className="rounded-lg bg-primary px-4 py-2 font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          {status === 'loading' ? 'Sending…' : 'Send'}
        </button>
      </form>
      {error && (
        <p role="alert" className="rounded-lg border border-destructive p-4 text-destructive">
          {error}
        </p>
      )}
      {reply && <p className="whitespace-pre-wrap rounded-lg bg-muted p-4">{reply}</p>}
    </section>
  )
}
