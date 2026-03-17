'use client'

import React, { useEffect, useState } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

export function DXYPanel(): React.ReactElement {
  const [data, setData] = useState<Array<{ date: string; value: number }>>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/macro?series=dxy')
      .then((r) => r.json())
      .then((d) => setData(d.data ?? []))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const latest = data[data.length - 1]?.value ?? null
  const prev = data[data.length - 2]?.value ?? null
  const change = latest && prev ? latest - prev : null

  return (
    <div className="bg-surface rounded-lg border border-border p-4">
      <div className="flex items-center justify-between mb-4">
        <p className="text-[10px] font-semibold tracking-widest uppercase text-text-muted">US Dollar Index (DXY)</p>
        <div className="text-right">
          {latest !== null && <p className="font-mono text-text-primary font-semibold">{latest.toFixed(2)}</p>}
          {change !== null && <p className={`text-xs font-mono ${change >= 0 ? 'text-positive' : 'text-negative'}`}>{change >= 0 ? '+' : ''}{change.toFixed(2)}</p>}
        </div>
      </div>
      {loading ? (
        <div className="h-40 flex items-center justify-center"><div className="w-5 h-5 border-2 border-border border-t-accent rounded-full animate-spin" /></div>
      ) : (
        <ResponsiveContainer width="100%" height={160}>
          <LineChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e2d3d" />
            <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 9 }} tickCount={4} />
            <YAxis tick={{ fill: '#64748b', fontSize: 10 }} domain={['auto', 'auto']} />
            <Tooltip contentStyle={{ background: '#0f1623', border: '1px solid #1e2d3d', borderRadius: 6 }} itemStyle={{ color: '#94a3b8' }} />
            <Line type="monotone" dataKey="value" stroke="#00D4FF" strokeWidth={1.5} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}
