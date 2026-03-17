import { NextResponse } from 'next/server'
import { query } from '@/lib/db'

export async function GET(): Promise<NextResponse> {
  try {
    const rows = await query('SELECT * FROM alerts ORDER BY created_at DESC')
    return NextResponse.json(rows)
  } catch (err) {
    console.error('[api/alerts GET]', err)
    return NextResponse.json([], { status: 200 })
  }
}

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const { ticker, condition, target_price } = await request.json()
    const result = await query(
      `INSERT INTO alerts (ticker, condition, target_price)
       VALUES ($1, $2, $3) RETURNING *`,
      [ticker?.toUpperCase(), condition, target_price]
    )
    return NextResponse.json(result[0])
  } catch (err) {
    console.error('[api/alerts POST]', err)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}

export async function DELETE(request: Request): Promise<NextResponse> {
  try {
    const { id } = await request.json()
    await query('DELETE FROM alerts WHERE id = $1', [id])
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[api/alerts DELETE]', err)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}

export async function PATCH(request: Request): Promise<NextResponse> {
  try {
    const { id, triggered } = await request.json()
    await query('UPDATE alerts SET triggered = $1 WHERE id = $2', [triggered, id])
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[api/alerts PATCH]', err)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}
