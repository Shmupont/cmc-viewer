import { AppShell } from '@/components/layout/AppShell'
import DashboardPage from './dashboard-client'

export default function Home(): React.ReactElement {
  return (
    <AppShell>
      <DashboardPage />
    </AppShell>
  )
}
