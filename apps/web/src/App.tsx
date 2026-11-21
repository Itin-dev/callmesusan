import { HandHeart } from 'lucide-react'
import { Link, Route, Routes } from 'react-router'
import ChatDemo from '@/features/chat/ChatDemo'
import HomePage from '@/features/home/HomePage'
import { ThemeToggle } from '@/features/theme/ThemeToggle'
import TopicPage from '@/features/topic/TopicPage'
import Footer from '@/Footer'
import '@/i18n'

/** App shell (header, routes, footer); providers (router, theme) are set up in main.tsx. */
export default function App() {
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="sticky top-0 z-10 border-b bg-background/80 backdrop-blur supports-backdrop-filter:bg-background/60">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between gap-4 px-4 sm:px-6">
          <Link to="/" className="flex items-center gap-2 rounded-md font-semibold outline-none focus-visible:ring-3 focus-visible:ring-ring/50">
            <span className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <HandHeart aria-hidden="true" className="size-5" />
            </span>
            <span lang="en">Lucerne Help</span>
          </Link>
          <ThemeToggle />
        </div>
      </header>
      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-10 px-4 py-8 sm:px-6 sm:py-12">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/topic/:topicId" element={<TopicPage />} />
          <Route path="/chat" element={<ChatDemo />} />
        </Routes>
      </main>
      <Footer
        commit={import.meta.env.VITE_COMMIT_SHA ?? ''}
        env={import.meta.env.VITE_DEPLOY_ENV ?? ''}
      />
    </div>
  )
}
