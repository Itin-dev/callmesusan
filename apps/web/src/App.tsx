import { Route, Routes } from 'react-router'
import AppShell from '@/components/shell/AppShell'
import AccountPage from '@/features/accounts/AccountPage'
import AnalyticsPage from '@/features/analytics/AnalyticsPage'
import PsstChatPage from '@/features/chat/PsstChatPage'
import HomePage from '@/features/home/HomePage'
import ScanPage from '@/features/scan/ScanPage'
import ServicesPage from '@/features/services/ServicesPage'
import TransactionPage from '@/features/transactions/TransactionPage'
import '@/i18n'

/** Routes inside the mobile app shell; providers (router, React Query) are set up in main.tsx. */
export default function App() {
  return (
    <AppShell>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/psst" element={<PsstChatPage />} />
        <Route path="/scan" element={<ScanPage />} />
        <Route path="/analytics" element={<AnalyticsPage />} />
        <Route path="/accounts/:account" element={<AccountPage />} />
        <Route path="/transactions/:id" element={<TransactionPage />} />
        <Route path="/services" element={<ServicesPage />} />
      </Routes>
    </AppShell>
  )
}
