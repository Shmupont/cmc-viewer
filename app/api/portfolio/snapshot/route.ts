import { NextResponse } from 'next/server'
import { query } from '@/lib/db'

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const body = await request.json()
    const { total_value, total_cost, data } = body

    const result = await query(
      `INSERT INTO portfolio_snapshots (snapshot_date, total_value, total_cost, data)
       VALUES (CURRENT_DATE, $1, $2, $3)
       ON CONFLICT (snapshot_date) DO UPDATE
       SET total_value = $1, total_cost = $2, data = $3
       RETURNING *`,
      [total_value, total_cost, JSON.stringify(data)]
    )

    return NextResponse.json(result[0])
  } catch (err) {
    console.error('[api/portfolio/snapshot]', err)
    return NextResponse.json({ error: 'Failed to save snapshot' }, { status: 500 })
  }
}

export async function GET(): Promise<NextResponse> {
  try {
    const rows = await query(
      'SELECT * FROM portfolio_snapshots ORDER BY snapshot_date DESC LIMIT 365'
    )
    return NextResponse.json(rows)
  } catch (err) {
    console.error('[api/portfolio/snapshot GET]', err)
    return NextResponse.json([], { status: 200 })
  }
}
