import ETFClient from './etf-client'

export default async function ETFPage({ params }: { params: Promise<{ ticker: string }> }) {
  const { ticker } = await params
  return <ETFClient ticker={ticker.toUpperCase()} />
}
