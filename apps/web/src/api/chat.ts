import { postJson } from './client'
import type { ChatMessage, ChatResponse } from './types'

/** POST /api/chat: send the whole conversation, get Psst's next reply. */
export async function postChat(messages: ChatMessage[], language: string): Promise<string> {
  const { reply } = await postJson<ChatResponse>('/api/chat', { messages, language })
  return reply
}
