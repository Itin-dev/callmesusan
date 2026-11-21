import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'

afterEach(cleanup)

// jsdom has no matchMedia; tests flip the system color scheme with setSystemDark().
let systemDark = false
const listeners = new Set<() => void>()

export function setSystemDark(dark: boolean) {
  systemDark = dark
  listeners.forEach((listener) => listener())
}

window.matchMedia = (query: string) =>
  ({
    get matches() {
      return query.includes('dark') ? systemDark : false
    },
    media: query,
    onchange: null,
    addEventListener: (_: string, listener: () => void) => listeners.add(listener),
    removeEventListener: (_: string, listener: () => void) => listeners.delete(listener),
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  }) as unknown as MediaQueryList
