'use client'

import React, { useEffect, useState } from 'react'

interface GaugeData {
  label: string
  value: number | null
  unit: string
  status: 'green' | 'amber' | 'red' | 'neutral'
  description: string
}

function getStatusColor(status: string): string {
  switch (status) {
    case 'green': return 'text-positive border-positive/30 bg-positive/5'
    case 'amber': return 'text-warning border-warning/30 bg-warning/5'
    case 'red': return 'text-negative border-negative/30 bg-negative/5'
    default: return 'text-text-secondary border-border bg-surface-2'
  }
}

export function MacroGauges(): React.ReactElement {
  const [gauges, setGauges] = useState<GaugeData[]>([])

  useEffect(() => {
    async function fetchGauges(): Promise<void> {
      const [ratesRes, cpiRes, vixRes] = await Promise.allSettled([
        fetch('/api/macro?series=rates').then((r) => r.json()),
        fetch('/api/macro?series=cpi&limit=2').then((r) => r.json()),
        fetch('/api/macro?series=vix&limit=1').then((r) => r.json()),
      ])

      const rates = ratesRes.status === 'fulfilled' ? ratesRes.value.rates : null
      const cpiData = cpiRes.status === 'fulfilled' ? cpiRes.value.data : []
      const vixData = vixRes.status === 'fulfilled' ? vixRes.value.data : []

      const cpi = cpiData.length >= 2
        ? ((cpiData[cpiData.length - 1].value - cpiData[0].value) / cpiData[0].value) * 100 * 12
        : null

      const vix = vixData[0]?.value ?? null
      const spread = rates?.spread ?? null

      const g: GaugeData[] = [
        {
          label: 'Fed Funds', value: rates?.fedFunds ?? null, unit: '%',
          status: (rates?.fedFunds ?? 0) > 5 ? 'red' : (rates?.fedFunds ?? 0) > 3 ? 'amber' : 'green',
          description: 'Current policy rate',
        },
        {
          label: 'CPI MoM', value: cpi, unit: '%',
          status: cpi === null ? 'neutral' : cpi > 4 ? 'red' : cpi > 2 ? 'amber' : 'green',
          description: 'Consumer price inflation',
        },
        {
          label: 'VIX', value: vix, unit: '',
          status: vix === null ? 'neutral' : vix > 30 ? 'red' : vix > 20 ? 'amber' : 'green',
          description: 'Equity volatility index',
        },
        {
          label: '2Y/10Y', value: spread, unit: '%',
          status: spread === null ? 'neutral' : spread < 0 ? 'red' : spread < 0.5 ? 'amber' : 'green',
          description: 'Yield curve spread',
        },
      ]
      setGauges(g)
    }
    fetchGauges().catch(console.error)
  }, [])

  return (
    <div className="grid grid-cols-4 gap-3">
      {gauges.map((g) => (
        <div key={g.label} className={`rounded-lg border p-3 ${getStatusColor(g.status)}`}>
          <p className="text-[10px] font-semibold tracking-widest uppercase opacity-70 mb-1">{g.label}</p>
          <p className="font-mono text-xl font-bold leading-none">
            {g.value !== null ? `${g.value.toFixed(2)}${g.unit}` : '--'}
          </p>
          <p className="text-[10px] opacity-60 mt-1">{g.description}</p>
        </div>
      ))}
    </div>
  )
}
