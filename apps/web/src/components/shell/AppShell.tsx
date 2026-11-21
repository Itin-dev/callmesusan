import type { ReactNode } from 'react'
import StatusBar from './StatusBar'
import TabBar from './TabBar'

/**
 * Mobile app frame. Phones: full screen. Wider screens: the 390 × 844 Figma phone, centred.
 * Each screen scrolls inside the frame; the tab bar stays at the bottom.
 */
export default function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-dvh justify-center sm:items-center sm:bg-border sm:p-8">
      <div className="relative flex h-dvh w-full flex-col overflow-hidden bg-background sm:h-[844px] sm:max-h-[calc(100dvh-4rem)] sm:w-[390px] sm:rounded-4xl sm:shadow-2xl sm:ring-1 sm:ring-foreground/10">
        <StatusBar />
        <main className="flex flex-1 flex-col overflow-y-auto">{children}</main>
        <TabBar />
      </div>
    </div>
  )
}
