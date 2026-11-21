// POST /api/transcribe is not merged yet (BE-8, #52). Until then every recording "reads" as the
// question below, after a short pause like a real model call. Replace the body of
// transcribeAudio() with a multipart POST: form.append('file', audio, audio.type.includes('mp4')
// ? 'recording.mp4' : 'recording.webm'); form.append('language', language); then
// (await postForm<TranscribeResponse>('/api/transcribe', form)).text (413, 415, 502, 503 otherwise).
export const TRANSCRIBE_FIXTURE_TEXT = 'How much did I spend on groceries in November?'

/** Turn a recorded question into text (fixture until BE-8). */
export async function transcribeAudio(_audio: Blob, _language: string): Promise<string> {
  await new Promise((resolve) => setTimeout(resolve, 600))
  return TRANSCRIBE_FIXTURE_TEXT
}
