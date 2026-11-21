import { postJson } from './client'
import type { ChatMessage, ChatRequest, ChatResponse, ScannedReceipt } from './types'

/** POST /api/chat: send the whole conversation and the session's scans, get Psst's next reply. */
export async function postChat(
  messages: ChatMessage[],
  language: string,
  receipts: ScannedReceipt[] = [],
): Promise<string> {
  const body: ChatRequest = { messages, language, ...(receipts.length > 0 && { receipts }) }
  const { reply } = await postJson<ChatResponse>('/api/chat', body)
  return reply
}
