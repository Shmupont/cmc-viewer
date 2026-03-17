'use client'

import React, { useEffect, useState } from 'react'
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts'

interface YieldPoint { label: string; yield: number }
interface RateData { fed_funds: number | null; prime: number | null; sofr: number | null; t10y: number | null; t2y: number | null; t30y: number | null }
interface MacroSeries { date: string; value: number }
interface CreditData { ig_spread: number | null; hy_spread: number | null }

type Tab = 'rates' | 'inflation' | 'credit' | 'dxy'

export default function MacroClient(): React.ReactElement {
  const [tab, setTab] = useState<Tab>('rates')
  const [yieldCurve, setYieldCurve] = useState<YieldPoint[]>([])
  const [rates, setRates] = useState<RateData | null>(null)
  const [spreadHistory, setSpreadHistory] = useState<MacroSeries[]>([])
  const [cpi, setCpi] = useState<MacroSeries[]>([])
  const [coreCpi, setCoreCpi] = useState<MacroSeries[]>([])
  const [pce, setPce] = useState<MacroSeries[]>([])
  const [credit, setCredit] = useState<CreditData | null>(null)
  const [dxy, setDxy] = useState<MacroSeries[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true)
      try {
        const [ratesRes, yieldRes, inflRes, creditRes, spreadRes, dxyRes] = await Promise.allSettled([
          fetch('/api/macro?series=rates').then(r => r.json()),
          fetch('/api/macro?series=yield_curve').then(r => r.json()),
          fetch('/api/macro?series=inflation').then(r => r.json()),
          fetch('/api/macro?series=credit_spreads').then(r => r.json()),
          fetch('/api/macro?series=spread_history').then(r => r.json()),
          fetch('/api/macro?series=dxy').then(r => r.json()),
        ])
        if (ratesRes.status === 'fulfilled') setRates(ratesRes.value)
        if (yieldRes.status === 'fulfilled') setYieldCurve(yieldRes.value)
        if (inflRes.status === 'fulfilled') {
          const d = inflRes.value
          if (d.cpi) setCpi(d.cpi)
          if (d.core_cpi) setCoreCpi(d.core_cpi)
          if (d.pce) setPce(d.pce)
        }
        if (creditRes.status === 'fulfilled') setCredit(creditRes.value)
        if (spreadRes.status === 'fulfilled') setSpreadHistory(spreadRes.value)
        if (dxyRes.status === 'fulfilled') setDxy(dxyRes.value)
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    fetchAll()
  }, [])

  const fmt = (v: number | null | undefined, decimals = 2): string => {
    if (v == null) return '--'
    return v.toFixed(decimals) + '%'
  }

  const rateCards = rates ? [
    { label: 'Fed Funds Rate', val: fmt(rates.fed_funds), color: '#3b82f6' },
    { label: 'SOFR', val: fmt(rates.sofr), color: '#22c55e' },
    { label: '2Y Treasury', val: fmt(rates.t2y), color: '#f59e0b' },
    { label: '10Y Treasury', val: fmt(rates.t10y), color: '#ef4444' },
    { label: '30Y Treasury', val: fmt(rates.t30y), color: '#8b5cf6' },
    { label: 'Prime Rate', val: fmt(rates.prime), color: '#06b6d4' },
  ] : []

  const spread10y2y = rates && rates.t10y != null && rates.t2y != null
    ? (rates.t10y - rates.t2y).toFixed(2)
    : '--'

  return (
    <div className="h-full overflow-y-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-text-primary text-xl font-semibold">Macro</h1>
      </div>

      {/* Rate cards */}
      {loading ? (
        <div className="grid grid-cols-6 gap-3 mb-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-surface border border-border rounded-lg p-4 animate-pulse h-20" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-6 gap-3 mb-6">
          {rateCards.map(({ label, val, color }) => (
            <div key={label} className="bg-surface border border-border rounded-lg p-4">
              <p className="text-[10px] font-semibold tracking-widest uppercase text-text-muted mb-2">{label}</p>
              <p className="font-mono font-bold text-lg" style={{ color }}>{val}</p>
            </div>
          ))}
        </div>
      )}

      {/* Spread indicator */}
      <div className="bg-surface border border-border rounded-lg p-4 mb-6 flex items-center gap-6">
        <div>
          <p className="text-[10px] font-semibold tracking-widest uppercase text-text-muted mb-1">10Y-2Y Spread</p>
          <p className={`font-mono font-bold text-xl ${spread10y2y !== '--' && parseFloat(spread10y2y) < 0 ? 'text-negative' : 'text-positive'}`}>
            {spread10y2y !== '--' ? `${parseFloat(spread10y2y) >= 0 ? '+' : ''}${spread10y2y}%` : '--'}
          </p>
        </div>
        <div className="text-xs text-text-muted max-w-sm">
          {spread10y2y !== '--' && parseFloat(spread10y2y) < 0
            ? 'Inverted yield curve — historically precedes recession by 12–18 months.'
            : 'Normal yield curve — long rates exceed short rates.'}
        </div>
      </div>

      {/* Yield curve chart */}
      {yieldCurve.length > 0 && (
        <div className="bg-surface border border-border rounded-lg p-4 mb-6">
          <p className="text-[10px] font-semibold tracking-widest uppercase text-text-muted mb-4">Yield Curve</p>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={yieldCurve} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <defs>
                <linearGradient id="yieldGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e2d3d" />
              <XAxis dataKey="label" tick={{ fill: '#94a3b8', fontSize: 10 }} />
              <YAxis tick={{ fill: '#94a3b8', fontSize: 10 }} tickFormatter={(v: number) => `${v}%`} domain={['auto', 'auto']} />
              <Tooltip
                contentStyle={{ background: '#0f1623', border: '1px solid #1e2d3d', borderRadius: 6 }}
                formatter={(v: number) => [`${v.toFixed(2)}%`, 'Yield']}
                itemStyle={{ color: '#94a3b8' }}
              />
              <Area type="monotone" dataKey="yield" stroke="#3b82f6" fill="url(#yieldGrad)" strokeWidth={2} dot={{ fill: '#3b82f6', r: 3 }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-0 border-b border-border mb-6">
        {(['rates', 'inflation', 'credit', 'dxy'] as Tab[]).map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm capitalize transition-colors ${tab === t ? 'border-b-2 border-accent text-accent' : 'text-text-muted hover:text-text-secondary border-transparent'}`}>
            {t === 'dxy' ? 'DXY' : t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {tab === 'rates' && spreadHistory.length > 0 && (
        <div className="bg-surface border border-border rounded-lg p-4">
          <p className="text-[10px] font-semibold tracking-widest uppercase text-text-muted mb-4">10Y-2Y Spread History</p>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={spreadHistory} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <defs>
                <linearGradient id="spreadGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e2d3d" />
              <XAxis dataKey="date" tick={{ fill: '#94a3b8', fontSize: 9 }} interval="preserveStartEnd" />
              <YAxis tick={{ fill: '#94a3b8', fontSize: 10 }} tickFormatter={(v: number) => `${v}%`} />
              <Tooltip
                contentStyle={{ background: '#0f1623', border: '1px solid #1e2d3d', borderRadius: 6 }}
                formatter={(v: number) => [`${v.toFixed(2)}%`, '10Y-2Y Spread']}
                itemStyle={{ color: '#94a3b8' }}
              />
              <Area type="monotone" dataKey="value" stroke="#3b82f6" fill="url(#spreadGrad)" strokeWidth={1.5} dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {tab === 'inflation' && (
        <div className="space-y-6">
          {cpi.length > 0 && (
            <div className="bg-surface border border-border rounded-lg p-4">
              <p className="text-[10px] font-semibold tracking-widest uppercase text-text-muted mb-4">CPI / Core CPI / PCE (YoY %)</p>
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={cpi.map((d, i) => ({
                  date: d.date,
                  cpi: d.value,
                  core_cpi: coreCpi[i]?.value,
                  pce: pce[i]?.value,
                }))} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e2d3d" />
                  <XAxis dataKey="date" tick={{ fill: '#94a3b8', fontSize: 9 }} interval="preserveStartEnd" />
                  <YAxis tick={{ fill: '#94a3b8', fontSize: 10 }} tickFormatter={(v: number) => `${v}%`} />
                  <Tooltip
                    contentStyle={{ background: '#0f1623', border: '1px solid #1e2d3d', borderRadius: 6 }}
                    formatter={(v: number, name: string) => [`${v?.toFixed(2)}%`, name.toUpperCase()]}
                    itemStyle={{ color: '#94a3b8' }}
                  />
                  <Legend wrapperStyle={{ fontSize: 10, color: '#94a3b8' }} />
                  <Line type="monotone" dataKey="cpi" stroke="#ef4444" strokeWidth={1.5} dot={false} name="CPI" />
                  <Line type="monotone" dataKey="core_cpi" stroke="#f59e0b" strokeWidth={1.5} dot={false} name="Core CPI" />
                  <Line type="monotone" dataKey="pce" stroke="#8b5cf6" strokeWidth={1.5} dot={false} name="PCE" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
          {cpi.length === 0 && (
            <div className="bg-surface border border-border rounded-lg p-6 text-center text-text-muted text-sm">
              Inflation data requires FRED API key configuration.
            </div>
          )}
        </div>
      )}

      {tab === 'credit' && (
        <div className="space-y-4">
          {credit && (
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-surface border border-border rounded-lg p-4">
                <p className="text-[10px] font-semibold tracking-widest uppercase text-text-muted mb-2">IG Credit Spread</p>
                <p className="font-mono font-bold text-2xl text-accent">{credit.ig_spread != null ? `${credit.ig_spread.toFixed(0)} bps` : '--'}</p>
                <p className="text-xs text-text-muted mt-1">Investment Grade OAS</p>
              </div>
              <div className="bg-surface border border-border rounded-lg p-4">
                <p className="text-[10px] font-semibold tracking-widest uppercase text-text-muted mb-2">HY Credit Spread</p>
                <p className="font-mono font-bold text-2xl text-warning">{credit.hy_spread != null ? `${credit.hy_spread.toFixed(0)} bps` : '--'}</p>
                <p className="text-xs text-text-muted mt-1">High Yield OAS</p>
              </div>
            </div>
          )}
          <div className="bg-surface border border-border rounded-lg p-6 text-center text-text-muted text-sm">
            {credit ? 'Historical spread charts require FRED API key configuration.' : 'Credit spread data requires FRED API key configuration.'}
          </div>
        </div>
      )}

      {tab === 'dxy' && (
        <div className="bg-surface border border-border rounded-lg p-4">
          <p className="text-[10px] font-semibold tracking-widest uppercase text-text-muted mb-4">US Dollar Index (DXY)</p>
          {dxy.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={dxy} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <defs>
                  <linearGradient id="dxyGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22c55e" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e2d3d" />
                <XAxis dataKey="date" tick={{ fill: '#94a3b8', fontSize: 9 }} interval="preserveStartEnd" />
                <YAxis tick={{ fill: '#94a3b8', fontSize: 10 }} domain={['auto', 'auto']} />
                <Tooltip
                  contentStyle={{ background: '#0f1623', border: '1px solid #1e2d3d', borderRadius: 6 }}
                  formatter={(v: number) => [v.toFixed(2), 'DXY']}
                  itemStyle={{ color: '#94a3b8' }}
                />
                <Area type="monotone" dataKey="value" stroke="#22c55e" fill="url(#dxyGrad)" strokeWidth={1.5} dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-text-muted text-sm text-center py-8">DXY data requires FRED API key configuration.</p>
          )}
        </div>
      )}
    </div>
  )
}
