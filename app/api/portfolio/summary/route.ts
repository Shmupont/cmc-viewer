import { NextResponse } from 'next/server'

export async function GET(): Promise<NextResponse> {
  // Delegate to the main portfolio route and extract summary
  const res = await fetch(`${process.env.NEXT_PUBLIC_URL ?? 'http://localhost:3000'}/api/portfolio`, {
    cache: 'no-store',
  })
  const data = await res.json()
  return NextResponse.json({ summary: data.summary })
}
