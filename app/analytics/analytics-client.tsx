'use client'

import React, { useEffect, useState } from 'react'
import { useAppStore } from '@/store'
import { AgentPanel } from '@/components/AgentPanel'
import { LoadingSpinner } from '@/components/LoadingSpinner'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, Cell, PieChart, Pie, Legend
} from 'recharts'

type Tab = 'attribution' | 'risk' | 'fixed_income'

interface AttributionItem {
  ticker: string
  contribution: number
  weight: number
  gl_pct: number
}

interface ScenarioResult {
  scenario: string
  impact: number
  description: string
}

export default function AnalyticsClient(): React.ReactElement {
  const { holdings, portfolioSummary, refreshHoldings } = useAppStore()
  const [tab, setTab] = useState<Tab>('attribution')
  const [analytics, setAnalytics] = useState<Record<string, unknown> | null>(null)
  const [loading, setLoading] = useState(false)
  const [agentOpen, setAgentOpen] = useState(false)

  useEffect(() => {
    if (holdings.length === 0) refreshHoldings().catch(console.error)
  }, [])

  useEffect(() => {
    if (holdings.length > 0) fetchAnalytics()
  }, [holdings])

  const fetchAnalytics = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/analytics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ holdings }),
      })
      const data = await res.json()
      if (data.ok) setAnalytics(data)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  // Attribution: how each position contributed to total P&L
  const attribution: AttributionItem[] = holdings
    .filter(h => h.asset_type !== 'cash' && h.unrealized_gl != null && portfolioSummary)
    .map(h => ({
      ticker: h.ticker,
      contribution: portfolioSummary!.total_value > 0
        ? (h.unrealized_gl! / portfolioSummary!.total_value) * 100
        : 0,
      weight: portfolioSummary!.total_value > 0
        ? ((h.current_value ?? 0) / portfolioSummary!.total_value) * 100
        : 0,
      gl_pct: h.unrealized_gl_pct ?? 0,
    }))
    .sort((a, b) => Math.abs(b.contribution) - Math.abs(a.contribution))

  // Risk scenarios (static illustrative)
  const scenarios: ScenarioResult[] = portfolioSummary ? [
    { scenario: 'Market -10%', impact: -portfolioSummary.total_value * 0.08, description: 'Beta-weighted equity drawdown' },
    { scenario: 'Market -20%', impact: -portfolioSummary.total_value * 0.16, description: 'Bear market drawdown' },
    { scenario: 'Rates +1%', impact: -portfolioSummary.total_value * 0.025, description: 'Duration risk on bond ETFs' },
    { scenario: 'Rates +2%', impact: -portfolioSummary.total_value * 0.05, description: 'Severe rate shock' },
    { scenario: 'Volatility spike', impact: -portfolioSummary.total_value * 0.04, description: 'VIX 30+ scenario' },
  ] : []

  // Fixed income holdings
  const fixedIncome = holdings.filter(h => h.asset_type === 'bond_etf')

  const fmtChg = (v: number): string => {
    const abs = Math.abs(v).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })
    return `${v >= 0 ? '+' : '-'}$${abs}`
  }

  const context = portfolioSummary
    ? `Portfolio analytics: total value $${portfolioSummary.total_value.toFixed(2)}, ${holdings.length} positions. Top contributors: ${attribution.slice(0, 3).map(a => `${a.ticker} (${a.contribution >= 0 ? '+' : ''}${a.contribution.toFixed(2)}%)`).join(', ')}`
    : 'Portfolio analytics loading'

  return (
    <div className="h-full overflow-y-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-text-primary text-xl font-semibold">Analytics</h1>
        <button
          onClick={() => setAgentOpen(true)}
          className="flex items-center gap-2 px-3 py-1.5 text-xs bg-white/5 hover:bg-white/10 border border-white/10 text-slate-400 hover:text-white rounded-md transition-colors"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3" /></svg>
          Analyze
        </button>
      </div>

      {/* Summary */}
      {portfolioSummary && (
        <div className="grid grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Total Value', val: `$${portfolioSummary.total_value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, color: 'text-text-primary' },
            { label: 'Total G/L', val: fmtChg(portfolioSummary.total_gl), color: portfolioSummary.total_gl >= 0 ? 'text-positive' : 'text-negative' },
            { label: 'Total G/L %', val: `${portfolioSummary.total_gl_pct >= 0 ? '+' : ''}${portfolioSummary.total_gl_pct.toFixed(2)}%`, color: portfolioSummary.total_gl_pct >= 0 ? 'text-positive' : 'text-negative' },
            { label: 'Positions', val: holdings.filter(h => h.asset_type !== 'cash').length.toString(), color: 'text-text-primary' },
          ].map(({ label, val, color }) => (
            <div key={label} className="bg-surface border border-border rounded-lg p-4">
              <p className="text-[10px] font-semibold tracking-widest uppercase text-text-muted mb-2">{label}</p>
              <p className={`font-mono font-bold text-xl ${color}`}>{val}</p>
            </div>
          ))}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-0 border-b border-border mb-6">
        {(['attribution', 'risk', 'fixed_income'] as Tab[]).map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm transition-colors ${tab === t ? 'border-b-2 border-accent text-accent' : 'text-text-muted hover:text-text-secondary border-transparent'}`}>
            {t === 'fixed_income' ? 'Fixed Income' : t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {tab === 'attribution' && (
        <div className="space-y-6">
          {loading ? (
            <div className="flex justify-center py-12"><LoadingSpinner size={32} /></div>
          ) : attribution.length > 0 ? (
            <>
              <div className="bg-surface border border-border rounded-lg p-4">
                <p className="text-[10px] font-semibold tracking-widest uppercase text-text-muted mb-4">P&L Contribution by Position (%)</p>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={attribution} layout="vertical" margin={{ top: 5, right: 20, left: 40, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e2d3d" />
                    <XAxis type="number" tick={{ fill: '#94a3b8', fontSize: 10 }} tickFormatter={(v: number) => `${v.toFixed(1)}%`} />
                    <YAxis type="category" dataKey="ticker" tick={{ fill: '#94a3b8', fontSize: 10 }} width={40} />
                    <Tooltip
                      contentStyle={{ background: '#0f1623', border: '1px solid #1e2d3d', borderRadius: 6 }}
                      formatter={(v: number) => [`${v >= 0 ? '+' : ''}${v.toFixed(2)}%`, 'Contribution']}
                      itemStyle={{ color: '#94a3b8' }}
                    />
                    <Bar dataKey="contribution" radius={[0, 2, 2, 0]}>
                      {attribution.map((d, i) => <Cell key={i} fill={d.contribution >= 0 ? '#22c55e' : '#ef4444'} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="bg-surface border border-border rounded-lg overflow-hidden">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-border bg-surface-2">
                      {['Ticker', 'Weight %', 'G/L %', 'P&L Contribution'].map(h => (
                        <th key={h} className="text-left text-text-muted py-2 px-4 font-normal">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {attribution.map((a) => (
                      <tr key={a.ticker} className="border-b border-border/50 hover:bg-surface-2">
                        <td className="py-2 px-4 font-mono font-semibold text-accent">{a.ticker}</td>
                        <td className="py-2 px-4 font-mono text-text-secondary">{a.weight.toFixed(2)}%</td>
                        <td className={`py-2 px-4 font-mono ${a.gl_pct >= 0 ? 'text-positive' : 'text-negative'}`}>
                          {a.gl_pct >= 0 ? '+' : ''}{a.gl_pct.toFixed(2)}%
                        </td>
                        <td className={`py-2 px-4 font-mono font-semibold ${a.contribution >= 0 ? 'text-positive' : 'text-negative'}`}>
                          {a.contribution >= 0 ? '+' : ''}{a.contribution.toFixed(2)}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <p className="text-text-muted text-sm text-center py-8">No attribution data available.</p>
          )}
        </div>
      )}

      {tab === 'risk' && (
        <div className="space-y-6">
          <div className="bg-surface border border-border rounded-lg p-4">
            <p className="text-[10px] font-semibold tracking-widest uppercase text-text-muted mb-1">Risk Scenarios</p>
            <p className="text-xs text-text-muted mb-4">Estimated portfolio impact under stress scenarios (illustrative).</p>
            {scenarios.length > 0 ? (
              <>
                <div className="space-y-3 mb-6">
                  {scenarios.map((s) => (
                    <div key={s.scenario} className="flex items-center gap-4 bg-surface-2 rounded p-3">
                      <div className="w-28 shrink-0">
                        <p className="text-xs font-mono font-semibold text-text-primary">{s.scenario}</p>
                        <p className="text-[10px] text-text-muted">{s.description}</p>
                      </div>
                      <div className="flex-1">
                        <div className="h-2 bg-border rounded-full overflow-hidden">
                          <div className="h-full bg-negative rounded-full" style={{ width: `${Math.min(Math.abs(s.impact) / (portfolioSummary?.total_value ?? 1) * 500, 100)}%` }} />
                        </div>
                      </div>
                      <p className="font-mono text-negative text-sm w-28 text-right shrink-0">
                        {fmtChg(s.impact)}
                      </p>
                    </div>
                  ))}
                </div>
                <p className="text-[10px] text-text-muted">Note: Scenarios are approximate and do not account for correlation, hedges, or tail risk.</p>
              </>
            ) : (
              <p className="text-text-muted text-sm text-center py-4">Load portfolio to see risk scenarios.</p>
            )}
          </div>
        </div>
      )}

      {tab === 'fixed_income' && (
        <div className="space-y-4">
          {fixedIncome.length > 0 ? (
            <div className="bg-surface border border-border rounded-lg overflow-hidden">
              <div className="p-4 border-b border-border">
                <p className="text-[10px] font-semibold tracking-widest uppercase text-text-muted">Fixed Income Positions</p>
              </div>
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border bg-surface-2">
                    {['Ticker', 'Name', 'Shares', 'Current Value', 'Cost Basis', 'G/L', 'G/L %'].map(h => (
                      <th key={h} className="text-left text-text-muted py-2 px-4 font-normal">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {fixedIncome.map((h) => (
                    <tr key={h.ticker} className="border-b border-border/50 hover:bg-surface-2">
                      <td className="py-2 px-4 font-mono font-semibold text-accent">{h.ticker}</td>
                      <td className="py-2 px-4 text-text-secondary max-w-[200px] truncate">{h.name}</td>
                      <td className="py-2 px-4 font-mono text-text-secondary">{h.shares}</td>
                      <td className="py-2 px-4 font-mono text-text-primary">{h.current_value != null ? `$${h.current_value.toFixed(2)}` : '--'}</td>
                      <td className="py-2 px-4 font-mono text-text-secondary">{h.cost_basis != null ? `$${(h.cost_basis * h.shares).toFixed(2)}` : '--'}</td>
                      <td className={`py-2 px-4 font-mono ${(h.unrealized_gl ?? 0) >= 0 ? 'text-positive' : 'text-negative'}`}>
                        {h.unrealized_gl != null ? `${h.unrealized_gl >= 0 ? '+' : ''}$${Math.abs(h.unrealized_gl).toFixed(2)}` : '--'}
                      </td>
                      <td className={`py-2 px-4 font-mono ${(h.unrealized_gl_pct ?? 0) >= 0 ? 'text-positive' : 'text-negative'}`}>
                        {h.unrealized_gl_pct != null ? `${h.unrealized_gl_pct >= 0 ? '+' : ''}${h.unrealized_gl_pct.toFixed(2)}%` : '--'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="bg-surface border border-border rounded-lg p-6 text-center text-text-muted text-sm">
              No fixed income (bond ETF) positions in portfolio.
            </div>
          )}
        </div>
      )}

      <AgentPanel isOpen={agentOpen} onClose={() => setAgentOpen(false)} context={context} pageTitle="Portfolio Analytics" />
    </div>
  )
}
