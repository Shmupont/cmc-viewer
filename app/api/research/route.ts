import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let yf: any = null
async function getYF() {
  if (!yf) { const mod = await import('yahoo-finance2'); yf = mod.default }
  return yf
}

export async function GET(request: Request): Promise<NextResponse> {
  const { searchParams } = new URL(request.url)
  const query = searchParams.get('q')
  if (!query) return NextResponse.json({ results: [] })

  try {
    const yahooFinance = await getYF()
    const results = await yahooFinance.search(query)
    const quotes = (results?.quotes ?? []).slice(0, 10).map((q: Record<string, unknown>) => ({
      symbol: q.symbol,
      shortname: q.shortname ?? q.longname,
      quoteType: q.quoteType,
      exchange: q.exchange,
    }))
    return NextResponse.json({ results: quotes })
  } catch (err) {
    console.error('[api/research search]', err)
    return NextResponse.json({ results: [] })
  }
}

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const { ticker, name, assetType, context } = await request.json()

    const prompt = `Generate a detailed investment thesis for ${name} (${ticker}).

Asset Type: ${assetType ?? 'equity'}
${context ? `Additional context:\n${context}` : ''}

Structure your response with:
## Bull Case
(3-4 bullet points with specific catalysts and numbers)

## Bear Case
(3-4 bullet points with specific risks and scenarios)

## Key Metrics to Watch
(2-3 metrics with current values if known)

## Conclusion
(1 sentence verdict)

Be specific, data-driven, and direct. No fluff.`

    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1000,
      temperature: 0.3,
      system: 'You are a sharp, direct equity research analyst. Be specific with numbers. Lead with risks.',
      messages: [{ role: 'user', content: prompt }],
    })

    const content = message.content[0].type === 'text' ? message.content[0].text : ''
    return NextResponse.json({ ok: true, content })
  } catch (err) {
    console.error('[api/research thesis]', err)
    return NextResponse.json({ ok: false, content: 'Failed to generate thesis.' }, { status: 500 })
  }
}
