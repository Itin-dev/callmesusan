import { useCallback, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { postChat } from '@/api/chat'
import type { ChatMessage } from '@/api/types'
import { scannedReceipts } from '@/features/scan/scannedReceipts'

export type ChatStatus = 'idle' | 'sending' | 'error'

/**
 * Psst conversation state. The backend is stateless, so every turn sends the whole conversation
 * plus the UI language and the receipts scanned in this session. On an error the question stays and `retry` sends the same conversation again.
 */
export function useChat() {
  const { i18n } = useTranslation()
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [status, setStatus] = useState<ChatStatus>('idle')
  // Refs, not state: two quick taps happen before React re-renders.
  const conversation = useRef<ChatMessage[]>([])
  const sending = useRef(false)

  const request = useCallback(
    async (turns: ChatMessage[]) => {
      sending.current = true
      setStatus('sending')
      try {
        const reply = await postChat(turns, i18n.resolvedLanguage ?? 'en', scannedReceipts())
        conversation.current = [...turns, { role: 'assistant', content: reply }]
        setMessages(conversation.current)
        setStatus('idle')
      } catch {
        setStatus('error')
      } finally {
        sending.current = false
      }
    },
    [i18n],
  )

  const send = useCallback(
    (text: string) => {
      const content = text.trim()
      if (!content || sending.current) return
      conversation.current = [...conversation.current, { role: 'user', content }]
      setMessages(conversation.current)
      void request(conversation.current)
    },
    [request],
  )

  const retry = useCallback(() => {
    if (!sending.current) void request(conversation.current)
  }, [request])

  return { messages, status, send, retry }
}
