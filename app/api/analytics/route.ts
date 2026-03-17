import { NextResponse } from 'next/server'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let yf: any = null
async function getYF() {
  if (!yf) { const mod = await import('yahoo-finance2'); yf = mod.default }
  return yf
}

function getDaysBack(days: number): string {
  const d = new Date(); d.setDate(d.getDate() - days); return d.toISOString().split('T')[0]
}

export async function GET(request: Request): Promise<NextResponse> {
  const { searchParams } = new URL(request.url)
  const type = searchParams.get('type') ?? 'attribution'
  const period = searchParams.get('period') ?? '1M'

  const periodDays: Record<string, number> = { '1D': 1, '1W': 7, '1M': 30, '3M': 90, '1Y': 365 }
  const days = periodDays[period] ?? 30

  try {
    const yahooFinance = await getYF()

    if (type === 'attribution') {
      // Get portfolio holdings
      const HOLDINGS = ['GOOGL', 'AAPL', 'SHV', 'IBB', 'XLF', 'XLV', 'XLY', 'VDC', 'VDE', 'VIS', 'VGT', 'VNQ', 'VPU']
      const BENCHMARK = 'SPY'

      const [holdingResults, benchResult] = await Promise.allSettled([
        Promise.allSettled(HOLDINGS.map(async (ticker) => {
          const h = await yahooFinance.chart(ticker, { period1: getDaysBack(days), interval: '1d' })
          const quotes = h?.quotes ?? []
          if (quotes.length < 2) return null
          const first = quotes[0]?.close ?? quotes[0]?.open
          const last = quotes[quotes.length - 1]?.close
          if (!first || !last) return null
          return { ticker, return_pct: ((last - first) / first) * 100 }
        })),
        yahooFinance.chart(BENCHMARK, { period1: getDaysBack(days), interval: '1d' }),
      ])

      const contributions = holdingResults.status === 'fulfilled'
        ? holdingResults.value
            .filter((r) => r.status === 'fulfilled' && r.value)
            .map((r) => (r as PromiseFulfilledResult<{ ticker: string; return_pct: number } | null>).value!)
        : []

      const benchQuotes = benchResult.status === 'fulfilled' ? benchResult.value?.quotes ?? [] : []
      const benchFirst = benchQuotes[0]?.close
      const benchLast = benchQuotes[benchQuotes.length - 1]?.close
      const benchReturn = benchFirst && benchLast ? ((benchLast - benchFirst) / benchFirst) * 100 : null

      return NextResponse.json({ contributions, benchmark: benchReturn, period })
    }

    if (type === 'stress_test') {
      const scenarios = [
        { name: '2008 GFC',      equity: -55, bond: 15,  description: 'Global financial crisis scenario' },
        { name: 'COVID Crash',   equity: -34, bond: 8,   description: 'March 2020 pandemic selloff' },
        { name: 'Rate +2%',      equity: -18, bond: -12, description: 'Fed hikes 200bps unexpectedly' },
        { name: 'Tech Selloff',  equity: -30, bond: 5,   description: '2022-style tech rotation' },
        { name: 'Stagflation',   equity: -20, bond: -15, description: '1970s-style inflation shock' },
      ]
      return NextResponse.json({ scenarios })
    }

    if (type === 'monte_carlo') {
      // Simple Monte Carlo parameters
      return NextResponse.json({
        simulations: 1000,
        horizon_years: 10,
        percentiles: {
          p10: -15,
          p25: 8,
          p50: 45,
          p75: 95,
          p90: 160,
        },
      })
    }

    return NextResponse.json({ error: 'Unknown type' }, { status: 400 })
  } catch (err) {
    console.error('[api/analytics]', err)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}
