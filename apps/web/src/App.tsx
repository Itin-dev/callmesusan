import { Route, Routes } from 'react-router'
import AppShell from '@/components/shell/AppShell'
import ChatDemo from '@/features/chat/ChatDemo'
import HomePage from '@/features/home/HomePage'
import ServicesPage from '@/features/services/ServicesPage'
import '@/i18n'

/** Routes inside the mobile app shell; providers (router, React Query) are set up in main.tsx. */
export default function App() {
  return (
    <AppShell>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/psst" element={<ChatDemo />} />
        <Route path="/services" element={<ServicesPage />} />
      </Routes>
    </AppShell>
  )
}
