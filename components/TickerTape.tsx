'use client'

import React, { useEffect, useState } from 'react'

const TICKERS = [
  '^GSPC', '^DJI', '^IXIC', '^RUT', 'SPY', 'QQQ', 'IWM', 'GLD', 'SLV',
  'TLT', 'HYG', 'LQD', 'DXY', '^VIX', 'BTC-USD', 'ETH-USD',
  'AAPL', 'MSFT', 'GOOGL', 'AMZN', 'NVDA', 'META', 'TSLA',
  'JPM', 'BAC', 'GS', 'XOM', 'CVX',
]

const DISPLAY_NAMES: Record<string, string> = {
  '^GSPC': 'S&P 500', '^DJI': 'DOW', '^IXIC': 'NASDAQ', '^RUT': 'RUSSELL',
  '^VIX': 'VIX', 'BTC-USD': 'BTC', 'ETH-USD': 'ETH',
}

interface TickerItem {
  symbol: string
  price: number | null
  change_pct: number | null
}

export function TickerTape(): React.ReactElement {
  const [items, setItems] = useState<TickerItem[]>(
    TICKERS.map((s) => ({ symbol: s, price: null, change_pct: null }))
  )

  useEffect(() => {
    fetchPrices()
    const interval = setInterval(fetchPrices, 60_000)
    return () => clearInterval(interval)
  }, [])

  async function fetchPrices(): Promise<void> {
    const results = await Promise.allSettled(
      TICKERS.map(async (ticker) => {
        const res = await fetch(`/api/market/quote?ticker=${encodeURIComponent(ticker)}`)
        const data = await res.json()
        return { symbol: ticker, price: data.price, change_pct: data.day_change_pct }
      })
    )
    setItems(
      results.map((r, i) =>
        r.status === 'fulfilled'
          ? r.value
          : { symbol: TICKERS[i], price: null, change_pct: null }
      )
    )
  }

  const renderItem = (item: TickerItem, key: string | number): React.ReactElement => {
    const name = DISPLAY_NAMES[item.symbol] ?? item.symbol
    const up = (item.change_pct ?? 0) >= 0
    return (
      <span key={key} className="inline-flex items-center gap-2 px-4 border-r border-border/50">
        <span className="text-text-muted text-[10px] font-mono">{name}</span>
        {item.price ? (
          <>
            <span className="font-mono text-[11px] text-text-primary">
              {item.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            <span className={`font-mono text-[10px] ${up ? 'text-positive' : 'text-negative'}`}>
              {up ? '+' : ''}{item.change_pct?.toFixed(2)}%
            </span>
          </>
        ) : (
          <span className="font-mono text-[11px] text-text-muted">--</span>
        )}
      </span>
    )
  }

  return (
    <div className="h-7 bg-surface border-b border-border overflow-hidden flex items-center">
      <div className="flex whitespace-nowrap ticker-scroll">
        {items.map((item) => renderItem(item, item.symbol))}
        {items.map((item) => renderItem(item, `${item.symbol}-dup`))}
      </div>
    </div>
  )
}
