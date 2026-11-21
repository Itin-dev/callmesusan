import { useEffect, useRef, useState } from 'react'

/** Records one voice clip with the browser's MediaRecorder; `onRecorded` gets it after stop(). */
export function useRecorder(onRecorded: (audio: Blob) => void) {
  const [recording, setRecording] = useState(false)
  const recorder = useRef<MediaRecorder | null>(null)
  const stream = useRef<MediaStream | null>(null)
  const supported = typeof MediaRecorder !== 'undefined' && !!navigator.mediaDevices?.getUserMedia

  /** Rejects when the user (or the browser) denies the microphone. */
  async function start() {
    const mic = await navigator.mediaDevices.getUserMedia({ audio: true })
    stream.current = mic
    const rec = new MediaRecorder(mic)
    const chunks: Blob[] = []
    rec.ondataavailable = (event) => chunks.push(event.data)
    rec.onstop = () => {
      mic.getTracks().forEach((track) => track.stop()) // the mic indicator goes off
      onRecorded(new Blob(chunks, { type: rec.mimeType }))
    }
    recorder.current = rec
    rec.start()
    setRecording(true)
  }

  // Leaving the chat while recording releases the microphone.
  useEffect(() => () => stream.current?.getTracks().forEach((track) => track.stop()), [])

  function stop() {
    recorder.current?.stop()
    recorder.current = null
    setRecording(false)
  }

  return { supported, recording, start, stop }
}
