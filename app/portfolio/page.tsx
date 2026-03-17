import { AppShell } from '@/components/layout/AppShell'
import PortfolioClient from './portfolio-client'

export default function PortfolioPage(): React.ReactElement {
  return (
    <AppShell>
      <PortfolioClient />
    </AppShell>
  )
}
