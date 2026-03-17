'use client'

import { useState, FormEvent } from 'react'
import { useRouter } from 'next/navigation'

export default function LoginPage(): React.ReactElement {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleSubmit(e: FormEvent): Promise<void> {
    e.preventDefault()
    setLoading(true)
    setError('')

    const res = await fetch('/api/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    })

    if (res.ok) {
      router.push('/')
      router.refresh()
    } else {
      setError('Invalid password. Please try again.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-base flex items-center justify-center">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-xl bg-surface border border-border mb-4">
            <span className="text-accent font-mono font-bold text-2xl">MC</span>
          </div>
          <h1 className="text-text-primary text-xl font-semibold">Mission Control</h1>
          <p className="text-text-muted text-sm mt-1">Portfolio Terminal</p>
        </div>

        {/* Form */}
        <div className="bg-surface border border-border rounded-xl p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-text-muted text-xs font-semibold tracking-widest uppercase mb-2">
                Access Code
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                required
                autoFocus
                className="w-full bg-base border border-border rounded-lg px-4 py-3 text-text-primary font-mono text-sm placeholder:text-text-muted focus:outline-none focus:border-accent transition-colors"
              />
            </div>

            {error && (
              <p className="text-negative text-xs font-mono">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading || !password}
              className="w-full bg-accent hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-mono font-medium text-sm py-3 rounded-lg transition-colors"
            >
              {loading ? 'Authenticating...' : 'Access Terminal'}
            </button>
          </form>
        </div>

        <p className="text-center text-text-muted text-xs mt-6 font-mono">
          Bloomberg-style investment portfolio terminal
        </p>
      </div>
    </div>
  )
}
