'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'

interface WatchlistItem {
  id: number
  ticker: string
  added_at: string
}

interface PriceInfo {
  price: number | null
  change_pct: number | null
}

const ETF_SET = new Set(['SHV','IBB','XLF','XLV','XLY','VDC','VDE','VIS','VGT','VNQ','VPU',
  'SPY','QQQ','IWM','DIA','GLD','TLT','VTI'])

export function WatchlistPanel({ onClose }: { onClose: () => void }): React.ReactElement {
  const [items, setItems] = useState<WatchlistItem[]>([])
  const [prices, setPrices] = useState<Record<string, PriceInfo>>({})
  const [addTicker, setAddTicker] = useState('')

  const reload = async (): Promise<void> => {
    const list: WatchlistItem[] = await fetch('/api/watchlist').then((r) => r.json())
    setItems(list)
    if (list.length > 0) {
      const results = await Promise.allSettled(
        list.map(async (item) => {
          const data = await fetch(`/api/market/quote?ticker=${item.ticker}`).then((r) => r.json())
          return { ticker: item.ticker, price: data.price, change_pct: data.day_change_pct }
        })
      )
      const map: Record<string, PriceInfo> = {}
      results.forEach((r) => {
        if (r.status === 'fulfilled') map[r.value.ticker] = { price: r.value.price, change_pct: r.value.change_pct }
      })
      setPrices(map)
    }
  }

  useEffect(() => { reload().catch(console.error) }, [])

  const handleAdd = async (): Promise<void> => {
    if (!addTicker.trim()) return
    await fetch('/api/watchlist', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ticker: addTicker.toUpperCase() }),
    })
    setAddTicker('')
    reload().catch(console.error)
  }

  const handleRemove = async (ticker: string): Promise<void> => {
    await fetch('/api/watchlist', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ticker }),
    })
    reload().catch(console.error)
  }

  return (
    <div className="fixed right-0 top-0 h-full w-80 bg-[#0a0e17] border-l border-[#1e2d3d] z-50 shadow-2xl flex flex-col animate-slide-in-right">
      <div className="flex items-center justify-between p-4 border-b border-[#1e2d3d]">
        <h2 className="text-sm font-mono text-white">☆ Watchlist</h2>
        <button onClick={onClose} className="text-slate-500 hover:text-white text-xl leading-none">×</button>
      </div>

      <div className="p-4 border-b border-[#1e2d3d]">
        <div className="flex gap-2">
          <input
            value={addTicker}
            onChange={(e) => setAddTicker(e.target.value.toUpperCase())}
            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
            placeholder="Add ticker..."
            className="flex-1 bg-white/5 border border-white/10 rounded px-2 py-1.5 text-xs font-mono text-white placeholder-slate-600 focus:outline-none focus:border-accent"
          />
          <button
            onClick={handleAdd}
            className="bg-accent hover:bg-blue-600 text-white text-xs px-3 py-1.5 rounded transition-colors"
          >
            +
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
        {items.length === 0 ? (
          <div className="text-center py-12 text-slate-700 text-xs">Watchlist is empty</div>
        ) : (
          items.map((item) => {
            const price = prices[item.ticker]
            const href = ETF_SET.has(item.ticker) ? `/etf/${item.ticker}` : `/company/${item.ticker}`
            return (
              <div key={item.ticker} className="flex items-center justify-between bg-white/[0.03] border border-white/5 rounded-lg p-3 cursor-pointer hover:border-slate-600 transition-colors group">
                <Link href={href} onClick={onClose} className="flex-1">
                  <div className="font-mono text-sm text-white group-hover:text-accent transition-colors">{item.ticker}</div>
                  <div className="text-xs text-slate-600 mt-0.5">
                    <span className="text-xs px-1 py-0.5 rounded bg-amber-500/20 text-amber-400 font-mono">WATCH</span>
                  </div>
                </Link>
                <div className="flex items-center gap-2">
                  {price && price.price && (
                    <div className="text-right">
                      <div className="font-mono text-xs text-white">${price.price.toFixed(2)}</div>
                      <div className={`font-mono text-xs ${(price.change_pct ?? 0) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {(price.change_pct ?? 0) >= 0 ? '+' : ''}{(price.change_pct ?? 0).toFixed(2)}%
                      </div>
                    </div>
                  )}
                  <button
                    onClick={(e) => { e.stopPropagation(); handleRemove(item.ticker) }}
                    className="text-slate-700 hover:text-red-400 transition-colors text-sm"
                  >
                    ×
                  </button>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
