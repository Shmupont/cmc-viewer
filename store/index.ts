'use client'

import { create } from 'zustand'
import type { PortfolioHolding, PortfolioSummary } from '@/types'

interface MacroRates {
  fedFunds: number | null
  tenYear: number | null
  twoYear: number | null
  spread: number | null
}

interface AppState {
  holdings: PortfolioHolding[]
  portfolioSummary: PortfolioSummary | null
  macroRates: MacroRates | null
  isMarketOpen: boolean
  lastUpdated: Date | null
  isLoadingHoldings: boolean

  refreshHoldings: () => Promise<void>
  refreshMacro: () => Promise<void>
  checkMarketStatus: () => void
}

function checkMarketOpen(): boolean {
  const now = new Date()
  const day = now.getDay()
  if (day === 0 || day === 6) return false
  const etOffset = -5
  const etHour = ((now.getUTCHours() + etOffset) + 24) % 24
  const etMin = now.getUTCMinutes()
  const minuteOfDay = etHour * 60 + etMin
  return minuteOfDay >= 570 && minuteOfDay < 960
}

export const useAppStore = create<AppState>((set, get) => ({
  holdings: [],
  portfolioSummary: null,
  macroRates: null,
  isMarketOpen: checkMarketOpen(),
  lastUpdated: null,
  isLoadingHoldings: false,

  refreshHoldings: async () => {
    set({ isLoadingHoldings: true })
    try {
      const [holdingsRes, summaryRes] = await Promise.allSettled([
        fetch('/api/portfolio').then((r) => r.json()),
        fetch('/api/portfolio/summary').then((r) => r.json()),
      ])
      const holdings = holdingsRes.status === 'fulfilled' ? holdingsRes.value : []
      const summary = summaryRes.status === 'fulfilled' ? summaryRes.value : null
      set({
        holdings: holdings.holdings ?? holdings,
        portfolioSummary: summary.summary ?? summary,
        lastUpdated: new Date(),
        isLoadingHoldings: false,
      })
    } catch (err) {
      console.error('[store] refreshHoldings error:', err)
      set({ isLoadingHoldings: false })
    }
  },

  refreshMacro: async () => {
    try {
      const res = await fetch('/api/macro?series=rates')
      const data = await res.json()
      if (data.rates) {
        set({ macroRates: data.rates })
      }
    } catch (err) {
      console.error('[store] refreshMacro error:', err)
    }
  },

  checkMarketStatus: () => {
    set({ isMarketOpen: checkMarketOpen() })
  },
}))

// Auto-refresh holdings every 60s (client-side only)
if (typeof window !== 'undefined') {
  setInterval(() => {
    useAppStore.getState().refreshHoldings()
  }, 60_000)
}
