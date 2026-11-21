import { postForm } from './client'
import type { TranscribeResponse } from './types'

/** Turn a recorded question into text via POST /api/transcribe (413, 415, 422, 502, 503 throw ApiError). */
export async function transcribeAudio(audio: Blob, language: string): Promise<string> {
  const form = new FormData()
  form.append('file', audio, audio.type.includes('mp4') ? 'recording.mp4' : 'recording.webm')
  form.append('language', language)
  return (await postForm<TranscribeResponse>('/api/transcribe', form)).text
}
