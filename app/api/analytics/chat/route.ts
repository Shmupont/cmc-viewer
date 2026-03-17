import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

interface Message {
  role: 'user' | 'assistant'
  content: string
}

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const { message, history, context } = await request.json()

    const systemPrompt = `You are a direct, slightly critical, risk-aware equity analyst.
Be concise. Use bullet points. Max 2-column tables. Lead with downside risks.
Always be specific with numbers when available.

Portfolio Context:
${context ?? ''}
`

    const messages: Message[] = [
      ...(history ?? []).slice(-6),
      { role: 'user', content: message },
    ]

    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1000,
      temperature: 0.3,
      system: systemPrompt,
      messages,
    })

    const content = response.content[0].type === 'text' ? response.content[0].text : ''
    return NextResponse.json({ ok: true, content })
  } catch (err) {
    console.error('[api/analytics/chat]', err)
    return NextResponse.json({ ok: false, content: 'Analysis failed.' }, { status: 500 })
  }
}
