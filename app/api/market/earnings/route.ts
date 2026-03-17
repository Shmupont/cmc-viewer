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
    const summary = await yahooFinance.quoteSummary(ticker, {
      modules: ['earningsHistory', 'earningsTrend'],
    })

    const history = summary?.earningsHistory?.history ?? []
    const data = history.map((e: Record<string, unknown>) => ({
      date: e.quarter instanceof Date ? e.quarter.toISOString().split('T')[0] : String(e.quarter ?? ''),
      period: e.period ?? '',
      eps_estimate: e.epsEstimate ?? null,
      eps_actual: e.epsActual ?? null,
      revenue_estimate: null,
      revenue_actual: null,
    }))

    return NextResponse.json(data)
  } catch (err) {
    console.error('[api/market/earnings]', err)
    return NextResponse.json([], { status: 200 })
  }
}
