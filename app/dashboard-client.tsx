'use client'

import React, { useEffect, useState, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useAppStore } from '@/store'
import { ETFCard } from '@/components/cards/ETFCard'
import { StockCard } from '@/components/cards/StockCard'
import { LoadingSpinner } from '@/components/LoadingSpinner'
import { BriefingModal } from '@/components/BriefingModal'
import type { PortfolioHolding, SignalData } from '@/types'
import { PieChart, Pie, Cell, Tooltip, Sector } from 'recharts'

const ASSET_COLORS: Record<string, string> = {
  etf: '#6366f1', bond_etf: '#f59e0b', stock: '#10b981', cash: '#94a3b8',
}

function SummaryCard({ label, value, subValue, valueClass = 'text-text-primary text-3xl' }: {
  label: string; value: string; subValue?: string; valueClass?: string
}): React.ReactElement {
  return (
    <div className="bg-surface border border-border rounded-lg p-5 min-h-[100px] flex flex-col justify-between">
      <p className="text-text-muted text-[10px] font-semibold tracking-widest uppercase mb-2">{label}</p>
      <div>
        <p className={`font-mono font-bold leading-none ${valueClass}`}>{value}</p>
        {subValue && <p className={`font-mono text-xs mt-1 opacity-70 ${valueClass}`}>{subValue}</p>}
      </div>
    </div>
  )
}

export default function DashboardPage(): React.ReactElement {
  const router = useRouter()
  const { holdings, portfolioSummary, refreshHoldings, isLoadingHoldings } = useAppStore()

  const [alertSignals, setAlertSignals] = useState<Record<string, SignalData>>({})
  const [activeAlert, setActiveAlert] = useState<{ ticker: string; signal: SignalData } | null>(null)
  const [activeSlice, setActiveSlice] = useState<number | null>(null)

  useEffect(() => {
    const store = useAppStore.getState()
    const stale = !store.lastUpdated || (Date.now() - store.lastUpdated.getTime() > 90000)
    if (holdings.length === 0 || stale) {
      refreshHoldings().catch(console.error)
    }
  }, [])

  const handleDismissAlert = useCallback(async () => {
    if (!activeAlert) return
    setAlertSignals((prev) => { const next = { ...prev }; delete next[activeAlert.ticker]; return next })
    setActiveAlert(null)
  }, [activeAlert])

  const donutData = useMemo(() => {
    const groups: Record<string, { label: string; value: number; color: string }> = {
      etf:      { label: 'ETF Positions',     value: 0, color: '#6366f1' },
      bond_etf: { label: 'Bond ETFs',         value: 0, color: '#f59e0b' },
      stock:    { label: 'Individual Stocks', value: 0, color: '#10b981' },
      cash:     { label: 'Cash',              value: 0, color: '#94a3b8' },
    }
    for (const h of holdings) {
      const type = h.asset_type ?? 'cash'
      const val = h.asset_type === 'cash' ? Number(h.shares) : (h.current_value ?? 0)
      if (groups[type]) groups[type].value += val
    }
    return Object.values(groups).filter((g) => g.value > 0)
  }, [holdings])

  const totalValue = donutData.reduce((sum, d) => sum + d.value, 0)
  const etfHoldings = holdings.filter((h) => h.asset_type === 'etf' || h.asset_type === 'bond_etf')
  const stockHoldings = holdings.filter((h) => h.asset_type === 'stock')
  const cash = holdings.find((h) => h.asset_type === 'cash')

  const fmt = (v: number | null | undefined): string => {
    if (v == null || isNaN(v)) return '--'
    return `$${Math.abs(v).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }

  const handleCardClick = (holding: PortfolioHolding): void => {
    if (holding.asset_type === 'stock') router.push(`/stock/${holding.ticker}`)
    else if (holding.asset_type === 'etf' || holding.asset_type === 'bond_etf') router.push(`/etf/${holding.ticker}`)
  }

  return (
    <div className="h-full overflow-y-auto p-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-text-primary text-xl font-semibold">Dashboard</h1>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-surface border border-border rounded-lg p-5 min-h-[100px] flex flex-col justify-between">
          <p className="text-text-muted text-[10px] font-semibold tracking-widest uppercase mb-2">Total Portfolio Value</p>
          <div className="flex items-start gap-3">
            <div>
              <p className="font-mono font-bold text-3xl text-text-primary leading-none mb-2">
                {portfolioSummary ? fmt(portfolioSummary.total_value) : '--'}
              </p>
              <div className="flex flex-col gap-0.5">
                {donutData.map((d) => (
                  <div key={d.label} className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: d.color }} />
                    <span className="text-[10px] text-slate-500 font-mono">{d.label}</span>
                  </div>
                ))}
              </div>
            </div>
            {totalValue > 0 && (
              <PieChart width={72} height={72}>
                <Pie
                  data={donutData} cx={32} cy={32} innerRadius={20} outerRadius={32}
                  paddingAngle={2} dataKey="value" strokeWidth={0}
                  activeIndex={activeSlice ?? undefined}
                  activeShape={(props: unknown) => {
                    const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill } = props as Record<string, number> & { fill: string }
                    return <Sector cx={cx} cy={cy} innerRadius={innerRadius} outerRadius={outerRadius + 4} startAngle={startAngle} endAngle={endAngle} fill={fill} />
                  }}
                  onMouseEnter={(_: unknown, index: number) => setActiveSlice(index)}
                  onMouseLeave={() => setActiveSlice(null)}
                >
                  {donutData.map((_, i) => <Cell key={i} fill={donutData[i].color} />)}
                </Pie>
                <Tooltip
                  formatter={(value: number, name: string) => [`$${value.toLocaleString('en-US', { maximumFractionDigits: 0 })} (${totalValue > 0 ? ((value / totalValue) * 100).toFixed(1) : 0}%)`, name]}
                  contentStyle={{ background: '#0d1117', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 8, fontSize: 11, color: '#f1f5f9', padding: '6px 10px' }}
                />
              </PieChart>
            )}
          </div>
        </div>

        <SummaryCard
          label="UNREALIZED G/L"
          value={portfolioSummary ? `${portfolioSummary.total_gl >= 0 ? '+' : ''}${fmt(portfolioSummary.total_gl)}` : '--'}
          subValue={portfolioSummary ? `${portfolioSummary.total_gl_pct >= 0 ? '+' : ''}${portfolioSummary.total_gl_pct.toFixed(2)}%` : undefined}
          valueClass={portfolioSummary ? (portfolioSummary.total_gl >= 0 ? 'text-positive text-3xl' : 'text-negative text-3xl') : 'text-text-primary text-3xl'}
        />
        <SummaryCard
          label="DAY CHANGE"
          value={portfolioSummary ? `${portfolioSummary.day_change >= 0 ? '+' : ''}${fmt(portfolioSummary.day_change)}` : '--'}
          subValue={portfolioSummary ? `${portfolioSummary.day_change_pct >= 0 ? '+' : ''}${portfolioSummary.day_change_pct.toFixed(2)}%` : undefined}
          valueClass={portfolioSummary ? (portfolioSummary.day_change >= 0 ? 'text-positive text-3xl' : 'text-negative text-3xl') : 'text-text-primary text-3xl'}
        />
        <SummaryCard label="CASH" value={cash ? fmt(Number(cash.shares)) : '--'} valueClass="text-text-primary text-3xl" />
      </div>

      {/* Holdings Grid */}
      {isLoadingHoldings && holdings.length === 0 ? (
        <div className="flex items-center justify-center h-48"><LoadingSpinner size={32} /></div>
      ) : (
        <>
          <h2 className="text-text-secondary text-sm font-medium mb-3">Holdings</h2>
          <div className="grid grid-cols-3 xl:grid-cols-4 gap-3 mb-6">
            {stockHoldings.map((h) => (
              <StockCard key={h.ticker} holding={h} onClick={() => handleCardClick(h)}
                alertSignal={alertSignals[h.ticker]}
                onAlertClick={alertSignals[h.ticker] ? () => setActiveAlert({ ticker: h.ticker, signal: alertSignals[h.ticker] }) : undefined}
              />
            ))}
            {etfHoldings.map((h) => (
              <ETFCard key={h.ticker} holding={h} onClick={() => handleCardClick(h)}
                alertSignal={alertSignals[h.ticker]}
                onAlertClick={alertSignals[h.ticker] ? () => setActiveAlert({ ticker: h.ticker, signal: alertSignals[h.ticker] }) : undefined}
              />
            ))}
          </div>
        </>
      )}

      {activeAlert && (
        <BriefingModal
          ticker={activeAlert.ticker} signal={activeAlert.signal} flavor="alert"
          onDismiss={handleDismissAlert} onClose={() => setActiveAlert(null)}
        />
      )}
    </div>
  )
}
