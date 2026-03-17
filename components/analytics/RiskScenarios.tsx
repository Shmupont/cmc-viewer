'use client'

import React, { useEffect, useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell, ResponsiveContainer } from 'recharts'

interface Scenario {
  name: string
  equity: number
  bond: number
  description: string
}

export function RiskScenarios(): React.ReactElement {
  const [scenarios, setScenarios] = useState<Scenario[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/analytics?type=stress_test')
      .then((r) => r.json())
      .then((d) => setScenarios(d.scenarios ?? []))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="h-48 flex items-center justify-center"><div className="w-6 h-6 border-2 border-border border-t-accent rounded-full animate-spin" /></div>

  return (
    <div className="space-y-6">
      <div className="bg-surface rounded-lg border border-border p-4">
        <p className="text-[10px] font-semibold tracking-widest uppercase text-text-muted mb-4">Stress Test Scenarios</p>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={scenarios} layout="vertical" margin={{ top: 5, right: 80, left: 100, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e2d3d" />
            <XAxis type="number" tick={{ fill: '#94a3b8', fontSize: 10 }} tickFormatter={(v: number) => `${v}%`} />
            <YAxis type="category" dataKey="name" tick={{ fill: '#94a3b8', fontSize: 10 }} width={90} />
            <Tooltip
              contentStyle={{ background: '#0f1623', border: '1px solid #1e2d3d', borderRadius: 6 }}
              formatter={(v: number) => [`${v}%`]}
              itemStyle={{ color: '#94a3b8' }}
            />
            <Bar dataKey="equity" name="Equity Impact" radius={[0, 2, 2, 0]}>
              {scenarios.map((_, i) => <Cell key={i} fill="#ef4444" />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 gap-3">
        {scenarios.map((s) => (
          <div key={s.name} className="bg-surface border border-border rounded-lg p-4">
            <div className="flex items-start justify-between mb-2">
              <div>
                <h4 className="text-sm font-semibold text-text-primary">{s.name}</h4>
                <p className="text-xs text-text-muted mt-0.5">{s.description}</p>
              </div>
              <div className="text-right">
                <div className="font-mono text-negative text-sm font-bold">{s.equity}%</div>
                <div className="text-xs text-text-muted">equity</div>
              </div>
            </div>
            <div className="flex gap-4 text-xs">
              <div>
                <span className="text-text-muted">Bonds: </span>
                <span className={`font-mono ${s.bond >= 0 ? 'text-positive' : 'text-negative'}`}>
                  {s.bond >= 0 ? '+' : ''}{s.bond}%
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
