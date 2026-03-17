import CompanyClient from './company-client'

export default async function CompanyPage({ params }: { params: Promise<{ ticker: string }> }) {
  const { ticker } = await params
  return <CompanyClient ticker={ticker.toUpperCase()} />
}
