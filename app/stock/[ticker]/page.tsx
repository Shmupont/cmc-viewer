import StockClient from './stock-client'

export default async function StockPage({ params }: { params: Promise<{ ticker: string }> }) {
  const { ticker } = await params
  return <StockClient ticker={ticker.toUpperCase()} />
}
