import { NextResponse } from 'next/server'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let yf: any = null
async function getYF() {
  if (!yf) { const mod = await import('yahoo-finance2'); yf = mod.default }
  return yf
}

export async function GET(request: Request): Promise<NextResponse> {
  const { searchParams } = new URL(request.url)
  const ticker = searchParams.get('ticker')
  if (!ticker) return NextResponse.json({ error: 'ticker required' }, { status: 400 })

  try {
    const yahooFinance = await getYF()
    const today = new Date().toISOString().split('T')[0]
    const result = await yahooFinance.chart(ticker, {
      period1: today,
      interval: '5m',
    })

    const quotes = result?.quotes ?? []
    const prices = quotes
      .map((q: Record<string, unknown>) => q.close ?? q.open)
      .filter((v: unknown) => v !== null && v !== undefined) as number[]

    return NextResponse.json(prices)
  } catch (err) {
    console.error('[api/market/intraday]', err)
    return NextResponse.json([], { status: 200 })
  }
}
