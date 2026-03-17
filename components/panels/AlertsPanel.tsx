'use client'

import React, { useEffect, useState } from 'react'

type AlertCondition = 'above' | 'below' | 'change_up_pct' | 'change_down_pct'

interface PriceAlert {
  id: number
  ticker: string
  condition: AlertCondition
  target_price: number
  triggered: boolean
  created_at: string
}

const CONDITION_LABELS: Record<AlertCondition, string> = {
  above: 'Price above',
  below: 'Price below',
  change_up_pct: 'Day change up %',
  change_down_pct: 'Day change down %',
}

export function AlertsPanel({ onClose }: { onClose: () => void }): React.ReactElement {
  const [alerts, setAlerts] = useState<PriceAlert[]>([])
  const [form, setForm] = useState({ ticker: '', condition: 'above' as AlertCondition, threshold: '' })

  const reload = (): void => {
    fetch('/api/alerts').then((r) => r.json()).then(setAlerts).catch(console.error)
  }
  useEffect(() => { reload() }, [])

  const handleCreate = async (): Promise<void> => {
    if (!form.ticker || !form.threshold) return
    await fetch('/api/alerts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ticker: form.ticker.toUpperCase(), condition: form.condition, target_price: Number(form.threshold) }),
    })
    setForm({ ticker: '', condition: 'above', threshold: '' })
    reload()
  }

  const handleDelete = async (id: number): Promise<void> => {
    await fetch('/api/alerts', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) })
    reload()
  }

  const active = alerts.filter((a) => !a.triggered)
  const fired = alerts.filter((a) => a.triggered)

  return (
    <div className="fixed right-0 top-0 h-full w-80 bg-[#0a0e17] border-l border-[#1e2d3d] z-50 shadow-2xl flex flex-col animate-slide-in-right">
      <div className="flex items-center justify-between p-4 border-b border-[#1e2d3d]">
        <h2 className="text-sm font-mono text-white">Price Alerts</h2>
        <button onClick={onClose} className="text-slate-500 hover:text-white text-xl leading-none">×</button>
      </div>

      <div className="p-4 border-b border-[#1e2d3d] space-y-2">
        <div className="text-xs text-slate-500 uppercase tracking-wider mb-2">New Alert</div>
        <input
          value={form.ticker}
          onChange={(e) => setForm((f) => ({ ...f, ticker: e.target.value.toUpperCase() }))}
          placeholder="Ticker (e.g. AAPL)"
          className="w-full bg-white/5 border border-white/10 rounded px-2 py-1.5 text-xs font-mono text-white placeholder-slate-600 focus:outline-none focus:border-accent"
        />
        <select
          value={form.condition}
          onChange={(e) => setForm((f) => ({ ...f, condition: e.target.value as AlertCondition }))}
          className="w-full bg-white/5 border border-white/10 rounded px-2 py-1.5 text-xs font-mono text-white focus:outline-none bg-[#0a0e17]"
        >
          {Object.entries(CONDITION_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <input
          value={form.threshold}
          onChange={(e) => setForm((f) => ({ ...f, threshold: e.target.value }))}
          placeholder="Threshold ($ or %)"
          type="number"
          className="w-full bg-white/5 border border-white/10 rounded px-2 py-1.5 text-xs font-mono text-white placeholder-slate-600 focus:outline-none focus:border-accent"
        />
        <button
          onClick={handleCreate}
          className="w-full bg-accent hover:bg-blue-600 text-white text-xs font-mono py-1.5 rounded transition-colors"
        >
          + Create Alert
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {active.length > 0 && (
          <>
            <div className="text-xs text-slate-500 uppercase tracking-wider mb-2">Active ({active.length})</div>
            {active.map((a) => (
              <div key={a.id} className="bg-white/[0.03] border border-white/10 rounded-lg p-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-mono text-sm text-white">{a.ticker}</span>
                  <button onClick={() => handleDelete(a.id)} className="text-xs text-slate-500 hover:text-red-400">×</button>
                </div>
                <div className="text-xs text-slate-400">
                  {CONDITION_LABELS[a.condition] ?? a.condition}{' '}
                  <span className="text-white font-mono">{a.target_price}</span>
                </div>
              </div>
            ))}
          </>
        )}
        {fired.length > 0 && (
          <>
            <div className="text-xs text-slate-500 uppercase tracking-wider mt-4 mb-2">Fired ({fired.length})</div>
            {fired.map((a) => (
              <div key={a.id} className="bg-white/[0.02] border border-white/5 rounded-lg p-3 opacity-60">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-sm text-white">{a.ticker}</span>
                  <span className="text-green-400 text-xs">✓</span>
                </div>
                <div className="text-xs text-slate-500 mt-0.5">{CONDITION_LABELS[a.condition]} {a.target_price}</div>
              </div>
            ))}
          </>
        )}
        {alerts.length === 0 && <div className="text-center py-8 text-slate-700 text-xs">No alerts yet</div>}
      </div>
    </div>
  )
}
