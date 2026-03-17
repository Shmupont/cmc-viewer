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
      modules: ['financialData', 'recommendationTrend'],
    })

    const fd = summary?.financialData
    const rt = summary?.recommendationTrend?.trend?.[0] ?? {}

    return NextResponse.json({
      buy: rt.buy ?? 0,
      hold: rt.hold ?? 0,
      sell: rt.sell ?? 0,
      strong_buy: rt.strongBuy ?? 0,
      strong_sell: rt.strongSell ?? 0,
      target_high: fd?.targetHighPrice ?? null,
      target_low: fd?.targetLowPrice ?? null,
      target_mean: fd?.targetMeanPrice ?? null,
      recommendation: fd?.recommendationKey ?? null,
    })
  } catch (err) {
    console.error('[api/market/analyst]', err)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}
