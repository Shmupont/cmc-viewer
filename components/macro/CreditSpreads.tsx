'use client'

import React, { useEffect, useState } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

export function CreditSpreads(): React.ReactElement {
  const [data, setData] = useState<{ date: string; ig: number | null; hy: number | null }[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/macro?series=credit_spreads')
      .then((r) => r.json())
      .then((d) => {
        const ig = d.ig as Array<{ date: string; value: number }>
        const hy = d.hy as Array<{ date: string; value: number }>
        const map = new Map<string, { ig: number | null; hy: number | null }>()
        ig?.forEach((p) => { if (!map.has(p.date)) map.set(p.date, { ig: null, hy: null }); map.get(p.date)!.ig = p.value })
        hy?.forEach((p) => { if (!map.has(p.date)) map.set(p.date, { ig: null, hy: null }); map.get(p.date)!.hy = p.value })
        const combined = Array.from(map.entries())
          .map(([date, vals]) => ({ date, ...vals }))
          .sort((a, b) => a.date.localeCompare(b.date))
        setData(combined.slice(-180))
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="bg-surface rounded-lg border border-border p-4">
      <p className="text-[10px] font-semibold tracking-widest uppercase text-text-muted mb-4">Credit Spreads (OAS)</p>
      {loading ? (
        <div className="h-40 flex items-center justify-center"><div className="w-5 h-5 border-2 border-border border-t-accent rounded-full animate-spin" /></div>
      ) : (
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e2d3d" />
            <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 9 }} tickCount={4} />
            <YAxis tick={{ fill: '#64748b', fontSize: 10 }} tickFormatter={(v: number) => `${v}bps`} />
            <Tooltip contentStyle={{ background: '#0f1623', border: '1px solid #1e2d3d', borderRadius: 6 }} itemStyle={{ color: '#94a3b8' }} formatter={(v: number) => `${v}bps`} />
            <Legend wrapperStyle={{ color: '#94a3b8', fontSize: 11 }} />
            <Line type="monotone" dataKey="ig" name="IG Spread" stroke="#3b82f6" strokeWidth={1.5} dot={false} />
            <Line type="monotone" dataKey="hy" name="HY Spread" stroke="#f59e0b" strokeWidth={1.5} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}
