'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { DividendHistory } from '@/components/company/DividendHistory'
import { AgentPanel } from '@/components/AgentPanel'
import { LoadingSpinner } from '@/components/LoadingSpinner'
import Link from 'next/link'

interface CompanyProfile {
  name: string
  ticker: string
  sector: string | null
  industry: string | null
  description: string | null
  employees: number | null
  website: string | null
  country: string | null
  exchange: string | null
  ipo_date: string | null
  market_cap: number | null
  price: number | null
}

interface Fundamental {
  label: string
  val: string
}

interface InsiderTrade {
  name: string
  title: string
  transaction: string
  shares: number
  price: number | null
  date: string
  value: number | null
}

interface Institutional {
  holder: string
  shares: number
  pct: number | null
  value: number | null
  date: string
}

interface Upgrade {
  firm: string
  action: string
  from_rating: string | null
  to_rating: string
  date: string
}

type Tab = 'overview' | 'ownership' | 'upgrades'

export default function CompanyClient({ ticker }: { ticker: string }): React.ReactElement {
  const router = useRouter()
  const [profile, setProfile] = useState<CompanyProfile | null>(null)
  const [fundamentals, setFundamentals] = useState<Fundamental[]>([])
  const [insiders, setInsiders] = useState<InsiderTrade[]>([])
  const [institutions, setInstitutions] = useState<Institutional[]>([])
  const [upgrades, setUpgrades] = useState<Upgrade[]>([])
  const [tab, setTab] = useState<Tab>('overview')
  const [loading, setLoading] = useState(true)
  const [agentOpen, setAgentOpen] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        const [profileRes, fundRes, insiderRes, instRes, upgradeRes] = await Promise.allSettled([
          fetch(`/api/company?ticker=${ticker}&type=profile`).then(r => r.json()),
          fetch(`/api/company?ticker=${ticker}&type=fundamentals`).then(r => r.json()),
          fetch(`/api/company?ticker=${ticker}&type=insiders`).then(r => r.json()),
          fetch(`/api/company?ticker=${ticker}&type=institutional`).then(r => r.json()),
          fetch(`/api/company?ticker=${ticker}&type=upgrades`).then(r => r.json()),
        ])
        if (profileRes.status === 'fulfilled') setProfile(profileRes.value)
        if (fundRes.status === 'fulfilled' && Array.isArray(fundRes.value)) setFundamentals(fundRes.value)
        if (insiderRes.status === 'fulfilled' && Array.isArray(insiderRes.value)) setInsiders(insiderRes.value)
        if (instRes.status === 'fulfilled' && Array.isArray(instRes.value)) setInstitutions(instRes.value)
        if (upgradeRes.status === 'fulfilled' && Array.isArray(upgradeRes.value)) setUpgrades(upgradeRes.value)
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [ticker])

  const fmtLarge = (v: number | null | undefined): string => {
    if (v == null) return '--'
    if (v >= 1e12) return `$${(v / 1e12).toFixed(2)}T`
    if (v >= 1e9) return `$${(v / 1e9).toFixed(2)}B`
    if (v >= 1e6) return `$${(v / 1e6).toFixed(2)}M`
    return `$${v.toLocaleString()}`
  }

  const context = profile
    ? `Company: ${ticker} (${profile.name}), Sector: ${profile.sector ?? '--'}, Industry: ${profile.industry ?? '--'}, Market Cap: ${fmtLarge(profile.market_cap)}, Employees: ${profile.employees?.toLocaleString() ?? '--'}, Exchange: ${profile.exchange ?? '--'}`
    : `Company: ${ticker}`

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <LoadingSpinner size={40} />
      </div>
    )
  }

  return (
    <div className="h-full overflow-y-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="text-text-muted hover:text-text-secondary text-sm">← Back</button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-text-primary text-xl font-bold font-mono">{ticker}</h1>
              {profile && <span className="text-text-secondary text-sm">{profile.name}</span>}
            </div>
            {profile && (
              <p className="text-text-muted text-xs">{[profile.sector, profile.industry].filter(Boolean).join(' · ')}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link href={`/stock/${ticker}`} className="px-3 py-1.5 text-xs bg-white/5 hover:bg-white/10 border border-white/10 text-slate-400 hover:text-white rounded-md transition-colors">
            Chart
          </Link>
          <button
            onClick={() => setAgentOpen(true)}
            className="flex items-center gap-2 px-3 py-1.5 text-xs bg-white/5 hover:bg-white/10 border border-white/10 text-slate-400 hover:text-white rounded-md transition-colors"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3" /></svg>
            Analyze
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-0 border-b border-border mb-6">
        {(['overview', 'ownership', 'upgrades'] as Tab[]).map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm capitalize transition-colors ${tab === t ? 'border-b-2 border-accent text-accent' : 'text-text-muted hover:text-text-secondary border-transparent'}`}>
            {t}
          </button>
        ))}
      </div>

      {tab === 'overview' && (
        <div className="space-y-6">
          {/* Company description */}
          {profile?.description && (
            <div className="bg-surface border border-border rounded-lg p-4">
              <p className="text-[10px] font-semibold tracking-widest uppercase text-text-muted mb-3">About</p>
              <p className="text-text-secondary text-sm leading-relaxed">{profile.description}</p>
              <div className="flex gap-6 mt-4 flex-wrap">
                {profile.employees && <span className="text-xs text-text-muted">Employees: <span className="text-text-primary font-mono">{profile.employees.toLocaleString()}</span></span>}
                {profile.exchange && <span className="text-xs text-text-muted">Exchange: <span className="text-text-primary font-mono">{profile.exchange}</span></span>}
                {profile.country && <span className="text-xs text-text-muted">Country: <span className="text-text-primary font-mono">{profile.country}</span></span>}
                {profile.ipo_date && <span className="text-xs text-text-muted">IPO: <span className="text-text-primary font-mono">{profile.ipo_date}</span></span>}
                {profile.website && (
                  <a href={profile.website} target="_blank" rel="noreferrer" className="text-xs text-accent hover:underline">
                    {profile.website.replace(/^https?:\/\//, '')}
                  </a>
                )}
              </div>
            </div>
          )}

          {/* Fundamentals grid */}
          {fundamentals.length > 0 && (
            <div className="bg-surface border border-border rounded-lg p-4">
              <p className="text-[10px] font-semibold tracking-widest uppercase text-text-muted mb-4">Key Metrics</p>
              <div className="grid grid-cols-4 gap-3">
                {fundamentals.map(({ label, val }) => (
                  <div key={label} className="bg-surface-2 rounded p-3">
                    <p className="text-[10px] text-text-muted mb-1">{label}</p>
                    <p className="font-mono text-text-primary text-sm">{val}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Dividends */}
          <DividendHistory ticker={ticker} />
        </div>
      )}

      {tab === 'ownership' && (
        <div className="space-y-6">
          {/* Insider transactions */}
          <div className="bg-surface border border-border rounded-lg p-4">
            <p className="text-[10px] font-semibold tracking-widest uppercase text-text-muted mb-4">Recent Insider Transactions</p>
            {insiders.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-border">
                      {['Name', 'Title', 'Transaction', 'Shares', 'Price', 'Value', 'Date'].map(h => (
                        <th key={h} className="text-left text-text-muted py-2 px-3 font-normal">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {insiders.slice(0, 20).map((t, i) => (
                      <tr key={i} className="border-b border-border/50 hover:bg-surface-2">
                        <td className="py-1.5 px-3 text-text-secondary">{t.name}</td>
                        <td className="py-1.5 px-3 text-text-muted">{t.title}</td>
                        <td className={`py-1.5 px-3 font-mono font-semibold ${t.transaction.toLowerCase().includes('buy') || t.transaction.toLowerCase().includes('purchase') ? 'text-positive' : 'text-negative'}`}>
                          {t.transaction}
                        </td>
                        <td className="py-1.5 px-3 font-mono text-text-primary">{t.shares.toLocaleString()}</td>
                        <td className="py-1.5 px-3 font-mono text-text-secondary">{t.price != null ? `$${t.price.toFixed(2)}` : '--'}</td>
                        <td className="py-1.5 px-3 font-mono text-text-secondary">{t.value != null ? fmtLarge(t.value) : '--'}</td>
                        <td className="py-1.5 px-3 text-text-muted">{t.date}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-text-muted text-sm text-center py-4">No insider transaction data.</p>
            )}
          </div>

          {/* Institutional ownership */}
          <div className="bg-surface border border-border rounded-lg p-4">
            <p className="text-[10px] font-semibold tracking-widest uppercase text-text-muted mb-4">Institutional Ownership</p>
            {institutions.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-border">
                      {['Institution', 'Shares', '% Outstanding', 'Value', 'Date'].map(h => (
                        <th key={h} className="text-left text-text-muted py-2 px-3 font-normal">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {institutions.slice(0, 20).map((inst, i) => (
                      <tr key={i} className="border-b border-border/50 hover:bg-surface-2">
                        <td className="py-1.5 px-3 text-text-secondary">{inst.holder}</td>
                        <td className="py-1.5 px-3 font-mono text-text-primary">{inst.shares.toLocaleString()}</td>
                        <td className="py-1.5 px-3 font-mono text-text-secondary">{inst.pct != null ? `${(inst.pct * 100).toFixed(2)}%` : '--'}</td>
                        <td className="py-1.5 px-3 font-mono text-text-secondary">{fmtLarge(inst.value)}</td>
                        <td className="py-1.5 px-3 text-text-muted">{inst.date}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-text-muted text-sm text-center py-4">No institutional ownership data.</p>
            )}
          </div>
        </div>
      )}

      {tab === 'upgrades' && (
        <div className="bg-surface border border-border rounded-lg p-4">
          <p className="text-[10px] font-semibold tracking-widest uppercase text-text-muted mb-4">Analyst Upgrades / Downgrades</p>
          {upgrades.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border">
                    {['Firm', 'Action', 'From', 'To', 'Date'].map(h => (
                      <th key={h} className="text-left text-text-muted py-2 px-3 font-normal">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {upgrades.map((u, i) => (
                    <tr key={i} className="border-b border-border/50 hover:bg-surface-2">
                      <td className="py-1.5 px-3 text-text-secondary">{u.firm}</td>
                      <td className={`py-1.5 px-3 font-semibold ${u.action.toLowerCase().includes('upgrade') ? 'text-positive' : u.action.toLowerCase().includes('downgrade') ? 'text-negative' : 'text-warning'}`}>
                        {u.action}
                      </td>
                      <td className="py-1.5 px-3 text-text-muted font-mono">{u.from_rating ?? '--'}</td>
                      <td className="py-1.5 px-3 text-text-primary font-mono">{u.to_rating}</td>
                      <td className="py-1.5 px-3 text-text-muted">{u.date}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-text-muted text-sm text-center py-4">No upgrade/downgrade data.</p>
          )}
        </div>
      )}

      <AgentPanel isOpen={agentOpen} onClose={() => setAgentOpen(false)} context={context} pageTitle={`${ticker} Company Analysis`} />
    </div>
  )
}
