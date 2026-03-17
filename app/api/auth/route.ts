import { NextResponse } from 'next/server'

export async function POST(request: Request): Promise<NextResponse> {
  const { password } = await request.json()

  if (password !== process.env.DEMO_PASSWORD) {
    return NextResponse.json({ error: 'Invalid password' }, { status: 401 })
  }

  const response = NextResponse.json({ ok: true })
  response.cookies.set('cmc_auth', '1', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: '/',
  })
  return response
}

export async function DELETE(): Promise<NextResponse> {
  const response = NextResponse.json({ ok: true })
  response.cookies.delete('cmc_auth')
  return response
}
