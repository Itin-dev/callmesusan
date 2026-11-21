import { type FormEvent, type ReactNode, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useSearchParams } from 'react-router'
import cameraIcon from '@/assets/icons/camera.svg'
import micIcon from '@/assets/icons/mic.svg'
import psstIcon from '@/assets/icons/psst-light.svg'
import sendIcon from '@/assets/icons/send.svg'
import { useTranscribe } from '@/api/queries'
import type { ChatMessage } from '@/api/types'
import SuggestionChip from '@/components/psst/SuggestionChip'
import BackButton from '@/components/shell/BackButton'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useChat } from './useChat'
import { useRecorder } from './useRecorder'

const SUGGESTIONS = ['chat.suggestions.save', 'chat.suggestions.groceries', 'chat.suggestions.holiday'] as const

/** Figma "02 Psst chat": multi-turn conversation with Psst over POST /api/chat. */
export default function PsstChatPage() {
  const { t, i18n } = useTranslation()
  const { messages, status, send, retry } = useChat()
  const [draft, setDraft] = useState('')
  const end = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const transcribe = useTranscribe()
  const [clip, setClip] = useState<Blob | null>(null)
  const [micDenied, setMicDenied] = useState(false)

  // The spoken question goes into the input, not straight to Psst: the user checks it first.
  const listen = (audio: Blob) => {
    setClip(audio)
    transcribe.mutate(
      { audio, language: i18n.resolvedLanguage ?? 'en' },
      {
        onSuccess: (text) => {
          setDraft(text)
          inputRef.current?.focus()
        },
      },
    )
  }
  const recorder = useRecorder(listen)

  async function toggleMic() {
    if (recorder.recording) return recorder.stop()
    setMicDenied(false)
    transcribe.reset()
    try {
      await recorder.start()
    } catch {
      setMicDenied(true)
    }
  }
  useAskFromLink(send)

  useEffect(() => {
    end.current?.scrollIntoView?.({ block: 'end', behavior: 'smooth' })
  }, [messages, status])

  function submit(event: FormEvent) {
    event.preventDefault()
    if (!draft.trim() || status === 'sending') return
    send(draft)
    setDraft('')
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <header className="flex items-center gap-3 px-4 pt-3 pb-2">
        <BackButton />
        <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-psst">
          <img src={psstIcon} alt="" width={24} height={24} />
        </span>
        <div className="flex min-w-0 flex-col gap-0.5">
          <h1 className="text-lg font-semibold">{t('psst.name')}</h1>
          <p className="text-xs">{t('chat.subtitle')}</p>
        </div>
      </header>

      <div className="flex flex-1 flex-col gap-4 overflow-y-auto px-4 py-2">
        <div role="log" aria-label={t('chat.log')} className="flex flex-col gap-4">
          <Bubble role="assistant">{t('chat.greeting')}</Bubble>
          <ol className="flex flex-col gap-4">
            {messages.map((message, index) => (
              <Message key={index} message={message} />
            ))}
          </ol>
          {status === 'sending' && (
            <p className="flex items-center gap-2 text-small">
              <span aria-hidden className="size-2 animate-pulse rounded-full bg-psst" />
              {t('chat.thinking')}
            </p>
          )}
        </div>

        {messages.length === 0 && (
          <div className="flex flex-wrap gap-2">
            {SUGGESTIONS.map((key) => (
              <SuggestionChip key={key} question={t(key)} onSelect={send} />
            ))}
          </div>
        )}

        {status === 'error' && (
          <div className="flex flex-col items-start gap-3 rounded-lg bg-card p-4">
            <p role="alert" className="text-body text-destructive">
              {t('chat.error')}
            </p>
            <Button variant="outline" className="h-11 rounded-full px-5 text-body font-semibold" onClick={retry}>
              {t('common.retry')}
            </Button>
          </div>
        )}
        <div ref={end} />
      </div>

      <form onSubmit={submit} className="flex flex-col gap-1.5 px-4 pt-3 pb-3">
        <div className="flex items-center gap-2.5 rounded-[26px] bg-card py-1 ps-3.5 pe-1 focus-within:ring-3 focus-within:ring-ring/50">
          {/* The camera is visual only in the MVP. */}
          <img src={cameraIcon} alt="" width={24} height={24} />
          <label htmlFor="psst-message" className="sr-only">
            {t('chat.inputLabel')}
          </label>
          <input
            id="psst-message"
            ref={inputRef}
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder={t('chat.placeholder')}
            autoComplete="off"
            className="h-11 min-w-0 flex-1 bg-transparent text-body outline-none placeholder:text-muted-foreground"
          />
          {recorder.supported && (
            <button
              type="button"
              aria-label={t(recorder.recording ? 'chat.mic.stop' : 'chat.mic.start')}
              aria-pressed={recorder.recording}
              disabled={transcribe.isPending}
              onClick={toggleMic}
              className={cn(
                'flex size-11 shrink-0 items-center justify-center rounded-full outline-none focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-50',
                recorder.recording && 'animate-pulse bg-destructive/15 ring-2 ring-destructive',
              )}
            >
              <img src={micIcon} alt="" width={24} height={24} />
            </button>
          )}
          <button
            type="submit"
            aria-label={t('chat.send')}
            disabled={!draft.trim() || status === 'sending'}
            className="flex size-11 shrink-0 items-center justify-center rounded-full bg-primary outline-none hover:bg-primary/80 focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-50"
          >
            <img src={sendIcon} alt="" width={24} height={24} className="rtl:-scale-x-100" />
          </button>
        </div>
        {transcribe.isPending && (
          <p role="status" className="text-center text-small">
            {t('chat.mic.listening')}
          </p>
        )}
        {micDenied && (
          <p role="alert" className="text-center text-small text-destructive">
            {t('chat.mic.denied')}
          </p>
        )}
        {transcribe.isError && (
          <div className="flex items-center justify-center gap-3">
            <p role="alert" className="text-small text-destructive">
              {t('chat.mic.error')}
            </p>
            {clip && (
              <Button
                type="button"
                variant="outline"
                className="h-11 rounded-full px-5 text-body font-semibold"
                onClick={() => listen(clip)}
              >
                {t('common.retry')}
              </Button>
            )}
          </div>
        )}
        <p className="text-center text-xs">{t('chat.disclaimer')}</p>
      </form>
    </div>
  )
}

/** A suggestion chip elsewhere in the app opens /psst?q=...: ask that question once, then drop it from the URL. */
function useAskFromLink(send: (text: string) => void) {
  const [params, setParams] = useSearchParams()
  const asked = useRef(false)
  const question = params.get('q')

  useEffect(() => {
    if (!question || asked.current) return
    asked.current = true
    send(question)
    setParams({}, { replace: true })
  }, [question, send, setParams])
}

function Message({ message }: { message: ChatMessage }) {
  const { t } = useTranslation()
  return (
    <li className={cn('flex', message.role === 'user' && 'justify-end')}>
      <Bubble role={message.role}>
        <span className="sr-only">{t(message.role === 'user' ? 'chat.fromUser' : 'chat.fromPsst')} </span>
        <span>{message.content}</span>
      </Bubble>
    </li>
  )
}

function Bubble({ role, children }: { role: ChatMessage['role']; children: ReactNode }) {
  return (
    <p
      className={cn(
        'rounded-[18px] px-3.5 py-3 text-body whitespace-pre-wrap break-words',
        role === 'user'
          ? 'max-w-[75%] rounded-ee-[4px] bg-psst text-psst-foreground'
          : 'max-w-[85%] self-start rounded-es-[4px] bg-card text-foreground',
      )}
    >
      {children}
    </p>
  )
}
