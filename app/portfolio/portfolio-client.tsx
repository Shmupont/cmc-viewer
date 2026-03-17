'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAppStore } from '@/store'
import { HoldingsTable } from '@/components/tables/HoldingsTable'
import { PortfolioPerformanceChart } from '@/components/charts/PortfolioPerformanceChart'
import { AllocationChart } from '@/components/charts/AllocationChart'
import { AgentPanel } from '@/components/AgentPanel'
import { LoadingSpinner } from '@/components/LoadingSpinner'
import { BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import type { PortfolioHolding } from '@/types'

type Tab = 'holdings' | 'exposure' | 'income'

export default function PortfolioClient(): React.ReactElement {
  const router = useRouter()
  const { holdings, portfolioSummary, refreshHoldings, isLoadingHoldings } = useAppStore()
  const [tab, setTab] = useState<Tab>('holdings')
  const [agentOpen, setAgentOpen] = useState(false)

  useEffect(() => {
    if (holdings.length === 0) refreshHoldings().catch(console.error)
  }, [])

  const fmt = (v: number | null | undefined): string => {
    if (v == null || isNaN(v)) return '--'
    return `$${Math.abs(v).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }
  const fmtChg = (v: number | null | undefined): string => {
    if (v == null) return '--'
    const abs = Math.abs(v).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    return `${v >= 0 ? '+' : '-'}$${abs}`
  }
  const clr = (v: number | null | undefined): string => {
    if (v == null) return 'text-text-secondary'
    return v >= 0 ? 'text-positive' : 'text-negative'
  }

  const handleRowClick = (h: PortfolioHolding): void => {
    if (h.asset_type === 'stock') router.push(`/stock/${h.ticker}`)
    else if (h.asset_type === 'etf' || h.asset_type === 'bond_etf') router.push(`/etf/${h.ticker}`)
  }

  // Allocation data for pie chart
  const allocationData = holdings
    .filter((h) => h.asset_type !== 'cash' && h.current_value && h.current_value > 0)
    .map((h) => ({
      name: h.ticker,
      value: portfolioSummary?.total_value
        ? Number(((h.current_value! / portfolioSummary.total_value) * 100).toFixed(2))
        : 0,
    }))

  // G/L bar data
  const glData = holdings
    .filter((h) => h.asset_type !== 'cash' && h.unrealized_gl != null)
    .map((h) => ({ name: h.ticker, gl: h.unrealized_gl! }))
    .sort((a, b) => Math.abs(b.gl) - Math.abs(a.gl))

  // Context for agent
  const context = portfolioSummary
    ? `Portfolio: total value $${portfolioSummary.total_value.toFixed(2)}, unrealized G/L ${fmtChg(portfolioSummary.total_gl)} (${portfolioSummary.total_gl_pct.toFixed(2)}%), day change ${fmtChg(portfolioSummary.day_change)}
Holdings: ${holdings.filter(h => h.asset_type !== 'cash').map(h => `${h.ticker} (${h.asset_type}, ${h.unrealized_gl_pct != null ? (h.unrealized_gl_pct >= 0 ? '+' : '') + h.unrealized_gl_pct.toFixed(1) + '%' : '--'})`).join(', ')}`
    : 'Portfolio data loading'

  return (
    <div className="h-full overflow-y-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-text-primary text-xl font-semibold">Portfolio</h1>
        <button
          onClick={() => setAgentOpen(true)}
          className="flex items-center gap-2 px-3 py-1.5 text-xs bg-white/5 hover:bg-white/10 border border-white/10 text-slate-400 hover:text-white rounded-md transition-colors"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3" /></svg>
          Analyze
        </button>
      </div>

      {/* Summary tiles */}
      {portfolioSummary && (
        <div className="grid grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Total Value', val: fmt(portfolioSummary.total_value), color: 'text-text-primary' },
            { label: 'Unrealized G/L', val: `${portfolioSummary.total_gl >= 0 ? '+' : ''}${fmt(portfolioSummary.total_gl)}`, color: clr(portfolioSummary.total_gl) },
            { label: 'Day Change', val: fmtChg(portfolioSummary.day_change), color: clr(portfolioSummary.day_change) },
            { label: 'Cash', val: fmt(portfolioSummary.cash), color: 'text-text-secondary' },
          ].map(({ label, val, color }) => (
            <div key={label} className="bg-surface border border-border rounded-lg p-4">
              <p className="text-[10px] font-semibold tracking-widest uppercase text-text-muted mb-2">{label}</p>
              <p className={`font-mono font-bold text-xl ${color}`}>{val}</p>
            </div>
          ))}
        </div>
      )}

      {/* Performance chart */}
      <PortfolioPerformanceChart />

      {/* Tabs */}
      <div className="flex gap-0 border-b border-border mb-6">
        {(['holdings', 'exposure', 'income'] as Tab[]).map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm capitalize transition-colors ${tab === t ? 'border-b-2 border-accent text-accent' : 'text-text-muted hover:text-text-secondary border-transparent'}`}>
            {t}
          </button>
        ))}
      </div>

      {tab === 'holdings' && (
        <div className="space-y-6">
          {isLoadingHoldings ? (
            <div className="flex justify-center py-12"><LoadingSpinner size={32} /></div>
          ) : (
            <div className="bg-surface rounded-lg border border-border">
              <HoldingsTable holdings={holdings} onRowClick={handleRowClick} />
            </div>
          )}

          <div className="grid grid-cols-2 gap-6">
            <div className="bg-surface rounded-lg border border-border p-4">
              <p className="text-[10px] font-semibold tracking-widest uppercase text-text-muted mb-4">Allocation by Position</p>
              <AllocationChart data={allocationData} height={280} />
            </div>
            <div className="bg-surface rounded-lg border border-border p-4">
              <p className="text-[10px] font-semibold tracking-widest uppercase text-text-muted mb-4">Unrealized G/L by Position</p>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={glData} layout="vertical" margin={{ top: 5, right: 20, left: 40, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e2d3d" />
                  <XAxis type="number" tick={{ fill: '#94a3b8', fontSize: 10 }} tickFormatter={(v: number) => `$${(v / 1000).toFixed(0)}k`} />
                  <YAxis type="category" dataKey="name" tick={{ fill: '#94a3b8', fontSize: 10 }} width={36} />
                  <Tooltip
                    contentStyle={{ background: '#0f1623', border: '1px solid #1e2d3d', borderRadius: 6 }}
                    formatter={(v: number) => [`${v >= 0 ? '+' : ''}$${Math.abs(v).toFixed(2)}`, 'G/L']}
                    itemStyle={{ color: '#94a3b8' }}
                  />
                  <Bar dataKey="gl" radius={[0, 2, 2, 0]}>
                    {glData.map((d, i) => <Cell key={i} fill={d.gl >= 0 ? '#22c55e' : '#ef4444'} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {tab === 'exposure' && (
        <div className="space-y-6">
          <div className="bg-surface rounded-lg border border-border p-6">
            <p className="text-[10px] font-semibold tracking-widest uppercase text-text-muted mb-4">Sector Exposure</p>
            <div className="grid grid-cols-4 gap-3">
              {[
                { sector: 'Technology', pct: 28.5, color: '#3b82f6' },
                { sector: 'Healthcare', pct: 12.8, color: '#22c55e' },
                { sector: 'Financials', pct: 11.2, color: '#f59e0b' },
                { sector: 'Real Estate', pct: 8.9, color: '#8b5cf6' },
                { sector: 'Utilities', pct: 6.4, color: '#06b6d4' },
                { sector: 'Consumer Disc', pct: 7.2, color: '#ec4899' },
                { sector: 'Energy', pct: 5.8, color: '#f97316' },
                { sector: 'Cash', pct: 9.1, color: '#94a3b8' },
              ].map(({ sector, pct, color }) => (
                <div key={sector} className="bg-surface-2 rounded-lg p-3">
                  <div className="flex justify-between mb-1">
                    <span className="text-xs text-text-secondary">{sector}</span>
                    <span className="text-xs font-mono text-text-primary">{pct}%</span>
                  </div>
                  <div className="h-1.5 bg-border rounded-full">
                    <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: color }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {tab === 'income' && (
        <div className="bg-surface rounded-lg border border-border p-6">
          <p className="text-[10px] font-semibold tracking-widest uppercase text-text-muted mb-4">Dividend Income</p>
          <p className="text-text-muted text-sm text-center py-8">
            Dividend calendar data requires Polygon API key configuration.
          </p>
        </div>
      )}

      <AgentPanel
        isOpen={agentOpen}
        onClose={() => setAgentOpen(false)}
        context={context}
        pageTitle="Portfolio Analysis"
      />
    </div>
  )
}
