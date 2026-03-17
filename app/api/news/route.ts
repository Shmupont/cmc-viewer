import { NextResponse } from 'next/server'

export async function GET(request: Request): Promise<NextResponse> {
  const { searchParams } = new URL(request.url)
  const ticker = searchParams.get('ticker')
  const key = process.env.FINNHUB_API_KEY

  if (!key) {
    return NextResponse.json({ articles: [] })
  }

  try {
    const to = new Date().toISOString().split('T')[0]
    const from = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

    const url = ticker
      ? `https://finnhub.io/api/v1/company-news?symbol=${ticker}&from=${from}&to=${to}&token=${key}`
      : `https://finnhub.io/api/v1/news?category=general&token=${key}`

    const res = await fetch(url, { next: { revalidate: 1800 } })
    const articles = await res.json()

    const mapped = (Array.isArray(articles) ? articles : []).slice(0, 20).map((a: Record<string, unknown>) => ({
      id: a.id ?? String(a.datetime),
      headline: a.headline,
      summary: a.summary,
      url: a.url,
      source: a.source,
      published_at: new Date((a.datetime as number) * 1000).toISOString(),
      related_ticker: ticker ?? '',
    }))

    return NextResponse.json({ articles: mapped })
  } catch (err) {
    console.error('[api/news]', err)
    return NextResponse.json({ articles: [] })
  }
}
