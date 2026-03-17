import { NextResponse } from 'next/server'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let yf: any = null

async function getYF() {
  if (!yf) {
    const mod = await import('yahoo-finance2')
    yf = mod.default
  }
  return yf
}

export async function GET(request: Request): Promise<NextResponse> {
  const { searchParams } = new URL(request.url)
  const ticker = searchParams.get('ticker')
  if (!ticker) return NextResponse.json({ error: 'ticker required' }, { status: 400 })

  try {
    const yahooFinance = await getYF()
    const [quote, summary] = await Promise.allSettled([
      yahooFinance.quote(ticker),
      yahooFinance.quoteSummary(ticker, {
        modules: ['summaryDetail', 'defaultKeyStatistics', 'fundProfile'],
      }),
    ])

    const q = quote.status === 'fulfilled' ? quote.value : null
    const s = summary.status === 'fulfilled' ? summary.value : null

    if (!q) return NextResponse.json({ error: 'No data' }, { status: 404 })

    const data = {
      ticker: ticker.toUpperCase(),
      price: q.regularMarketPrice ?? null,
      prev_close: q.regularMarketPreviousClose ?? null,
      day_change: q.regularMarketChange ?? null,
      day_change_pct: q.regularMarketChangePercent ?? null,
      day_open: q.regularMarketOpen ?? null,
      day_high: q.regularMarketDayHigh ?? null,
      day_low: q.regularMarketDayLow ?? null,
      volume: q.regularMarketVolume ?? null,
      market_cap: q.marketCap ?? null,
      pe_ratio: q.trailingPE ?? s?.summaryDetail?.trailingPE ?? null,
      eps: q.epsTrailingTwelveMonths ?? null,
      dividend_yield: q.dividendYield ?? s?.summaryDetail?.dividendYield ?? null,
      beta: s?.defaultKeyStatistics?.beta ?? null,
      week_52_high: q.fiftyTwoWeekHigh ?? null,
      week_52_low: q.fiftyTwoWeekLow ?? null,
      aum: s?.defaultKeyStatistics?.totalAssets ?? null,
      expense_ratio: s?.defaultKeyStatistics?.annualReportExpenseRatio ?? null,
      last_updated: new Date().toISOString(),
    }

    return NextResponse.json(data)
  } catch (err) {
    console.error('[api/market/quote]', err)
    return NextResponse.json({ error: 'Failed to fetch quote' }, { status: 500 })
  }
}
