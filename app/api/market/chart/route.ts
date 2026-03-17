import { NextResponse } from 'next/server'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let yf: any = null
async function getYF() {
  if (!yf) { const mod = await import('yahoo-finance2'); yf = mod.default }
  return yf
}

const INTERVAL_CONFIG: Record<string, {
  period1: () => string
  interval: string
  isIntraday: boolean
}> = {
  '1m':  { period1: () => getDaysBack(1),   interval: '1m',  isIntraday: true  },
  '5m':  { period1: () => getDaysBack(1),   interval: '5m',  isIntraday: true  },
  '15m': { period1: () => getDaysBack(5),   interval: '15m', isIntraday: true  },
  '30m': { period1: () => getDaysBack(5),   interval: '30m', isIntraday: true  },
  '1H':  { period1: () => getDaysBack(30),  interval: '60m', isIntraday: true  },
  '4H':  { period1: () => getDaysBack(90),  interval: '1d',  isIntraday: false },
  '1D':  { period1: () => getDaysBack(365), interval: '1d',  isIntraday: false },
  '1W':  { period1: () => getDaysBack(730), interval: '1wk', isIntraday: false },
  '1M':  { period1: () => getDaysBack(1825),'interval': '1mo',isIntraday: false },
  '1Y':  { period1: () => getDaysBack(3650),'interval': '3mo',isIntraday: false },
  '5Y':  { period1: () => getDaysBack(7300),'interval': '3mo',isIntraday: false },
}

function getDaysBack(days: number): string {
  const d = new Date()
  d.setDate(d.getDate() - days)
  return d.toISOString().split('T')[0]
}

export async function GET(request: Request): Promise<NextResponse> {
  const { searchParams } = new URL(request.url)
  const ticker = searchParams.get('ticker')
  const interval = searchParams.get('interval') ?? '1D'
  if (!ticker) return NextResponse.json({ error: 'ticker required' }, { status: 400 })

  try {
    const yahooFinance = await getYF()
    const cfg = INTERVAL_CONFIG[interval] ?? INTERVAL_CONFIG['1D']

    const result = await yahooFinance.chart(ticker, {
      period1: cfg.period1(),
      interval: cfg.interval as '1d',
    })

    const quotes = result?.quotes ?? []
    const data = quotes.map((q: Record<string, unknown>) => {
      const d = q.date instanceof Date ? q.date : new Date(q.date as string)
      return {
        time: cfg.isIntraday
          ? Math.floor(d.getTime() / 1000)
          : d.toISOString().split('T')[0],
        open: q.open ?? null,
        high: q.high ?? null,
        low: q.low ?? null,
        close: q.close ?? null,
        volume: q.volume ?? null,
      }
    }).filter((q: Record<string, unknown>) => q.close !== null)

    return NextResponse.json(data)
  } catch (err) {
    console.error('[api/market/chart]', err)
    return NextResponse.json({ error: 'Failed to fetch chart data' }, { status: 500 })
  }
}
