import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const { context } = await request.json()

    const message = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      system: `You are a direct, slightly critical, risk-aware equity analyst providing morning briefs.
Be concise. Lead with key risks. Use numbers when available. No fluff.`,
      messages: [
        {
          role: 'user',
          content: `Generate a brief morning market analysis based on the following portfolio and market context:\n\n${context}\n\nFocus on: key risks today, notable price moves, macro backdrop, and 1-2 actionable observations.`,
        },
      ],
    })

    const content = message.content[0].type === 'text' ? message.content[0].text : ''
    return NextResponse.json({ ok: true, content })
  } catch (err) {
    console.error('[api/brief]', err)
    return NextResponse.json({ ok: false, content: 'Failed to generate brief.' }, { status: 500 })
  }
}
