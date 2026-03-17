'use client'

import React from 'react'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts'

const COLORS = [
  '#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6',
  '#06b6d4', '#ec4899', '#84cc16', '#f97316', '#14b8a6',
]

export function AllocationChart({ data, height = 300 }: {
  data: Array<{ name: string; value: number }>
  height?: number
}): React.ReactElement {
  const filtered = data.filter((d) => d.value > 0)
  return (
    <ResponsiveContainer width="100%" height={height}>
      <PieChart>
        <Pie data={filtered} cx="50%" cy="50%" innerRadius={60} outerRadius={110} paddingAngle={2} dataKey="value">
          {filtered.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
        </Pie>
        <Tooltip
          contentStyle={{ background: '#0f1623', border: '1px solid #1e2d3d', borderRadius: 6 }}
          labelStyle={{ color: '#e2e8f0' }}
          formatter={(v: number) => `${v.toFixed(2)}%`}
          itemStyle={{ color: '#94a3b8' }}
        />
        <Legend wrapperStyle={{ color: '#94a3b8', fontSize: 11 }} formatter={(value) => <span style={{ color: '#94a3b8' }}>{value}</span>} />
      </PieChart>
    </ResponsiveContainer>
  )
}
