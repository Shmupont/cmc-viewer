import { NextResponse } from 'next/server'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let yf: any = null
async function getYF() {
  if (!yf) { const mod = await import('yahoo-finance2'); yf = mod.default }
  return yf
}

const RANGE_MAP: Record<string, { period1: string; interval: '1d' | '1wk' | '1mo' }> = {
  '1d':  { period1: getDateStr(1),   interval: '1d' },
  '5d':  { period1: getDateStr(5),   interval: '1d' },
  '1mo': { period1: getDateStr(30),  interval: '1d' },
  '3mo': { period1: getDateStr(90),  interval: '1d' },
  '6mo': { period1: getDateStr(180), interval: '1d' },
  '1y':  { period1: getDateStr(365), interval: '1d' },
  '5y':  { period1: getDateStr(1825),'interval': '1wk' },
}

function getDateStr(daysBack: number): string {
  const d = new Date()
  d.setDate(d.getDate() - daysBack)
  return d.toISOString().split('T')[0]
}

export async function GET(request: Request): Promise<NextResponse> {
  const { searchParams } = new URL(request.url)
  const ticker = searchParams.get('ticker')
  const range = searchParams.get('range') ?? '1y'
  if (!ticker) return NextResponse.json({ error: 'ticker required' }, { status: 400 })

  try {
    const yahooFinance = await getYF()
    const cfg = RANGE_MAP[range] ?? RANGE_MAP['1y']
    const result = await yahooFinance.chart(ticker, {
      period1: cfg.period1,
      interval: cfg.interval,
    })

    const quotes = result?.quotes ?? []
    const data = quotes.map((q: Record<string, unknown>) => ({
      date: q.date instanceof Date ? q.date.toISOString().split('T')[0] : String(q.date),
      open: q.open ?? null,
      high: q.high ?? null,
      low: q.low ?? null,
      close: q.close ?? null,
      volume: q.volume ?? null,
    })).filter((q: Record<string, unknown>) => q.close !== null)

    return NextResponse.json(data)
  } catch (err) {
    console.error('[api/market/history]', err)
    return NextResponse.json({ error: 'Failed to fetch history' }, { status: 500 })
  }
}
