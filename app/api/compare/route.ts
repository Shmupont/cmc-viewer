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

const RANGE_DAYS: Record<string, number> = {
  '1M': 30, '3M': 90, '6M': 180, '1Y': 365, '5Y': 1825
}

export async function GET(request: Request): Promise<NextResponse> {
  const { searchParams } = new URL(request.url)
  const symbols = searchParams.get('symbols')?.split(',').filter(Boolean) ?? []
  const range = searchParams.get('range') ?? '1Y'
  const days = RANGE_DAYS[range] ?? 365

  if (!symbols.length) return NextResponse.json({ error: 'symbols required' }, { status: 400 })

  try {
    const yahooFinance = await getYF()

    const results = await Promise.allSettled(
      symbols.map(async (sym) => {
        const [chart, summary] = await Promise.allSettled([
          yahooFinance.chart(sym, { period1: getDaysBack(days), interval: '1d' }),
          yahooFinance.quoteSummary(sym, {
            modules: ['summaryDetail', 'defaultKeyStatistics', 'financialData'],
          }),
        ])

        const quotes = chart.status === 'fulfilled' ? chart.value?.quotes ?? [] : []
        const s = summary.status === 'fulfilled' ? summary.value : null

        // Rebase to 100
        const first = quotes[0]?.close ?? quotes[0]?.open ?? 1
        const series = quotes.map((q: Record<string, unknown>) => ({
          date: (q.date instanceof Date ? q.date : new Date(q.date as string)).toISOString().split('T')[0],
          value: q.close ? ((q.close as number / first) * 100) : null,
        })).filter((p: { value: unknown }) => p.value !== null)

        const sd = s?.summaryDetail
        const ks = s?.defaultKeyStatistics
        const fd = s?.financialData

        return {
          symbol: sym.toUpperCase(),
          series,
          fundamentals: {
            pe: sd?.trailingPE ?? null,
            forward_pe: sd?.forwardPE ?? null,
            market_cap: sd?.marketCap ?? null,
            dividend_yield: sd?.dividendYield ?? null,
            beta: ks?.beta ?? null,
            profit_margin: fd?.profitMargins ?? null,
            revenue_growth: fd?.revenueGrowth ?? null,
            target_mean: fd?.targetMeanPrice ?? null,
          },
        }
      })
    )

    const data = results
      .filter((r) => r.status === 'fulfilled')
      .map((r) => (r as PromiseFulfilledResult<unknown>).value)

    return NextResponse.json({ data })
  } catch (err) {
    console.error('[api/compare]', err)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}
