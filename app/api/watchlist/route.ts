import { NextResponse } from 'next/server'
import { query } from '@/lib/db'

export async function GET(): Promise<NextResponse> {
  try {
    const rows = await query('SELECT * FROM watchlist ORDER BY added_at DESC')
    return NextResponse.json(rows)
  } catch (err) {
    console.error('[api/watchlist GET]', err)
    return NextResponse.json([], { status: 200 })
  }
}

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const { ticker } = await request.json()
    const result = await query(
      'INSERT INTO watchlist (ticker) VALUES ($1) ON CONFLICT (ticker) DO NOTHING RETURNING *',
      [ticker?.toUpperCase()]
    )
    return NextResponse.json(result[0] ?? { ticker })
  } catch (err) {
    console.error('[api/watchlist POST]', err)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}

export async function DELETE(request: Request): Promise<NextResponse> {
  try {
    const { ticker } = await request.json()
    await query('DELETE FROM watchlist WHERE ticker = $1', [ticker?.toUpperCase()])
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[api/watchlist DELETE]', err)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}
