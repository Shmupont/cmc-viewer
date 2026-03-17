'use client'

import React, { useEffect, useRef, useState, useCallback } from 'react'
import {
  createChart, IChartApi, ISeriesApi, ColorType,
  Time, CrosshairMode, LineStyle,
} from 'lightweight-charts'
import { calcSMA, calcEMA, calcBollingerBands, calcRSI } from './indicators'

type ChartInterval = '1m' | '5m' | '15m' | '30m' | '1H' | '4H' | '1D' | '1W' | '1M' | '1Y' | '5Y'

interface PriceBar {
  date: string | number
  open: number
  high: number
  low: number
  close: number
  volume?: number
}

interface IndicatorState {
  sma20: boolean; sma50: boolean; sma200: boolean
  ema12: boolean; bb: boolean; rsi: boolean; macd: boolean
}

const INTERVAL_LABELS: Record<ChartInterval, string> = {
  '1m': '1m', '5m': '5m', '15m': '15m', '30m': '30m',
  '1H': '1H', '4H': '4H', '1D': 'Daily', '1W': 'Weekly',
  '1M': 'Monthly', '1Y': '1 Year', '5Y': '5 Year',
}
const INTRADAY: ChartInterval[] = ['1m', '5m', '15m', '30m', '1H', '4H']
const UP = '#22c55e'; const DOWN = '#ef4444'

const DEFAULT_IND: IndicatorState = {
  sma20: true, sma50: true, sma200: false,
  ema12: false, bb: false, rsi: false, macd: false,
}

function loadPrefs(ticker: string): IndicatorState {
  try {
    const saved = localStorage.getItem(`mc_indicators_${ticker}`)
    if (saved) return { ...DEFAULT_IND, ...JSON.parse(saved) }
  } catch { /* ignore */ }
  return { ...DEFAULT_IND }
}

interface Props { ticker: string; height?: number; showVolume?: boolean }

export function CandlestickChart({ ticker, height = 320, showVolume = true }: Props): React.ReactElement {
  const mainRef = useRef<HTMLDivElement>(null)
  const volRef = useRef<HTMLDivElement>(null)
  const rsiRef = useRef<HTMLDivElement>(null)

  const mainChart = useRef<IChartApi | null>(null)
  const volChart = useRef<IChartApi | null>(null)
  const rsiChart = useRef<IChartApi | null>(null)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const candleSeries = useRef<ISeriesApi<'Candlestick'> | null>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const volumeSeries = useRef<ISeriesApi<'Histogram'> | null>(null)
  const sma20Ref = useRef<ISeriesApi<'Line'> | null>(null)
  const sma50Ref = useRef<ISeriesApi<'Line'> | null>(null)
  const sma200Ref = useRef<ISeriesApi<'Line'> | null>(null)
  const ema12Ref = useRef<ISeriesApi<'Line'> | null>(null)
  const bbUpperRef = useRef<ISeriesApi<'Line'> | null>(null)
  const bbMidRef = useRef<ISeriesApi<'Line'> | null>(null)
  const bbLowerRef = useRef<ISeriesApi<'Line'> | null>(null)

  const [interval, setInterval] = useState<ChartInterval>('1D')
  const [loading, setLoading] = useState(false)
  const [indicators, setIndicators] = useState<IndicatorState>(() => loadPrefs(ticker))
  const [priceData, setPriceData] = useState<PriceBar[]>([])

  useEffect(() => {
    try { localStorage.setItem(`mc_indicators_${ticker}`, JSON.stringify(indicators)) } catch { /* ignore */ }
  }, [indicators, ticker])

  useEffect(() => { setIndicators(loadPrefs(ticker)) }, [ticker])

  // Create main chart
  useEffect(() => {
    if (!mainRef.current) return
    const chart = createChart(mainRef.current, {
      layout: { background: { type: ColorType.Solid, color: '#0f1623' }, textColor: '#94a3b8' },
      grid: { vertLines: { color: '#1a2535' }, horzLines: { color: '#1a2535' } },
      crosshair: { mode: CrosshairMode.Normal },
      rightPriceScale: { borderColor: '#1e2d3d' },
      timeScale: { borderColor: '#1e2d3d', timeVisible: true, secondsVisible: false, rightOffset: 8, barSpacing: 8, minBarSpacing: 1 },
      handleScroll: { mouseWheel: true, pressedMouseMove: true, horzTouchDrag: true, vertTouchDrag: false },
      handleScale: { mouseWheel: true, pinch: true, axisPressedMouseMove: { time: true, price: true }, axisDoubleClickReset: { time: true, price: true } },
      width: mainRef.current.clientWidth, height,
    })

    const candle = chart.addCandlestickSeries({
      upColor: UP, downColor: DOWN, borderUpColor: UP, borderDownColor: DOWN, wickUpColor: UP, wickDownColor: DOWN,
    })
    const sma20 = chart.addLineSeries({ color: '#00D4FF', lineWidth: 1, priceLineVisible: false, lastValueVisible: false })
    const sma50 = chart.addLineSeries({ color: '#FFB800', lineWidth: 1, priceLineVisible: false, lastValueVisible: false })
    const sma200 = chart.addLineSeries({ color: '#FF4444', lineWidth: 1, priceLineVisible: false, lastValueVisible: false })
    const ema12 = chart.addLineSeries({ color: '#00FF88', lineWidth: 1, priceLineVisible: false, lastValueVisible: false })
    const bbUpper = chart.addLineSeries({ color: '#8B949E', lineWidth: 1, lineStyle: LineStyle.Dashed, priceLineVisible: false, lastValueVisible: false })
    const bbMid = chart.addLineSeries({ color: '#8B949E', lineWidth: 1, lineStyle: LineStyle.Dotted, priceLineVisible: false, lastValueVisible: false })
    const bbLower = chart.addLineSeries({ color: '#8B949E', lineWidth: 1, lineStyle: LineStyle.Dashed, priceLineVisible: false, lastValueVisible: false })

    mainChart.current = chart; candleSeries.current = candle
    sma20Ref.current = sma20; sma50Ref.current = sma50; sma200Ref.current = sma200
    ema12Ref.current = ema12; bbUpperRef.current = bbUpper; bbMidRef.current = bbMid; bbLowerRef.current = bbLower

    const ro = new ResizeObserver(() => {
      if (mainRef.current) chart.applyOptions({ width: mainRef.current.clientWidth })
    })
    ro.observe(mainRef.current)
    return () => { ro.disconnect(); chart.remove() }
  }, [height])

  // Create volume chart
  useEffect(() => {
    if (!showVolume || !volRef.current) return
    const vc = createChart(volRef.current, {
      layout: { background: { type: ColorType.Solid, color: '#0f1623' }, textColor: '#64748b' },
      grid: { vertLines: { color: 'transparent' }, horzLines: { color: '#1a2535' } },
      crosshair: { mode: CrosshairMode.Normal },
      rightPriceScale: { borderColor: '#1e2d3d', scaleMargins: { top: 0.1, bottom: 0 } },
      timeScale: { borderColor: '#1e2d3d', visible: false },
      width: volRef.current.clientWidth, height: 70,
    })
    const vol = vc.addHistogramSeries({ color: UP, priceFormat: { type: 'volume' }, priceScaleId: 'vol' })
    vc.priceScale('vol').applyOptions({ scaleMargins: { top: 0.1, bottom: 0 } })
    volumeSeries.current = vol; volChart.current = vc

    mainChart.current?.timeScale().subscribeVisibleLogicalRangeChange((r) => {
      if (r) vc.timeScale().setVisibleLogicalRange(r)
    })
    vc.timeScale().subscribeVisibleLogicalRangeChange((r) => {
      if (r) mainChart.current?.timeScale().setVisibleLogicalRange(r)
    })

    const ro = new ResizeObserver(() => {
      if (volRef.current) vc.applyOptions({ width: volRef.current.clientWidth })
    })
    ro.observe(volRef.current)
    return () => { ro.disconnect(); vc.remove() }
  }, [showVolume])

  // Create RSI chart
  useEffect(() => {
    if (!indicators.rsi || !rsiRef.current) return
    const rc = createChart(rsiRef.current, {
      layout: { background: { type: ColorType.Solid, color: '#0f1623' }, textColor: '#64748b' },
      grid: { vertLines: { color: 'transparent' }, horzLines: { color: '#1a2535' } },
      crosshair: { mode: CrosshairMode.Normal },
      rightPriceScale: { borderColor: '#1e2d3d', scaleMargins: { top: 0.05, bottom: 0.05 } },
      timeScale: { borderColor: '#1e2d3d', visible: false },
      width: rsiRef.current.clientWidth, height: 80,
    })
    const rsiSeries = rc.addLineSeries({ color: '#00D4FF', lineWidth: 1, priceLineVisible: false, lastValueVisible: false })
    rsiChart.current = rc

    mainChart.current?.timeScale().subscribeVisibleLogicalRangeChange((r) => {
      if (r) rc.timeScale().setVisibleLogicalRange(r)
    })

    if (priceData.length > 0) {
      const isIntraday = INTRADAY.includes(interval)
      const closes = priceData.map((h) => h.close)
      const rsiVals = calcRSI(closes)
      const data = priceData
        .map((h, i) => ({ time: (isIntraday ? Number(h.date) : h.date) as Time, value: rsiVals[i].rsi ?? 0 }))
        .filter((_, i) => rsiVals[i].rsi !== null)
      rsiSeries.setData(data)
    }

    const ro = new ResizeObserver(() => {
      if (rsiRef.current) rc.applyOptions({ width: rsiRef.current.clientWidth })
    })
    ro.observe(rsiRef.current)
    return () => { ro.disconnect(); rc.remove(); rsiChart.current = null }
  }, [indicators.rsi])

  function applyIndicators(data: PriceBar[], isIntraday: boolean): void {
    const toTime = (h: PriceBar): Time => (isIntraday ? Number(h.date) : h.date) as Time
    const closes = data.map((h) => h.close)

    const setLine = (
      ref: React.MutableRefObject<ISeriesApi<'Line'> | null>,
      vals: (number | null)[],
      enabled: boolean
    ) => {
      if (!ref.current) return
      if (!enabled) { ref.current.setData([]); return }
      const lineData = data
        .map((h, i) => ({ time: toTime(h), value: vals[i] ?? 0 }))
        .filter((_, i) => vals[i] !== null)
      ref.current.setData(lineData)
    }

    setLine(sma20Ref, calcSMA(closes, 20), indicators.sma20)
    setLine(sma50Ref, calcSMA(closes, 50), indicators.sma50)
    setLine(sma200Ref, calcSMA(closes, 200), indicators.sma200)
    setLine(ema12Ref, calcEMA(closes, 12), indicators.ema12)

    if (indicators.bb) {
      const bands = calcBollingerBands(closes)
      setLine(bbUpperRef, bands.map((b) => b.upper), true)
      setLine(bbMidRef, bands.map((b) => b.middle), true)
      setLine(bbLowerRef, bands.map((b) => b.lower), true)
    } else {
      setLine(bbUpperRef, [], false); setLine(bbMidRef, [], false); setLine(bbLowerRef, [], false)
    }
  }

  function applyData(sorted: PriceBar[], isIntraday: boolean): void {
    if (!candleSeries.current) return
    const toTime = (h: PriceBar): Time => (isIntraday ? Number(h.date) : h.date) as Time

    candleSeries.current.setData(
      sorted.map((h) => ({ time: toTime(h), open: h.open, high: h.high, low: h.low, close: h.close }))
    )
    if (volumeSeries.current) {
      volumeSeries.current.setData(
        sorted.map((h) => ({
          time: toTime(h), value: h.volume ?? 0,
          color: h.close >= h.open ? `${UP}88` : `${DOWN}88`,
        }))
      )
    }
    applyIndicators(sorted, isIntraday)
  }

  const loadData = useCallback(async (targetInterval?: ChartInterval) => {
    if (!candleSeries.current) return
    const iv = targetInterval ?? interval
    setLoading(true)
    try {
      const isIntraday = INTRADAY.includes(iv)
      const res = await fetch(`/api/market/chart?ticker=${encodeURIComponent(ticker)}&interval=${iv}`)
      const history: PriceBar[] = await res.json()

      const sorted = history
        .filter((h) => h.close && h.open && h.close > 0 && h.open > 0)
        .sort((a, b) => {
          const av = isIntraday ? Number(a.date) : String(a.date)
          const bv = isIntraday ? Number(b.date) : String(b.date)
          return av < bv ? -1 : av > bv ? 1 : 0
        })

      setPriceData(sorted)
      applyData(sorted, isIntraday)
      mainChart.current?.timeScale().fitContent()
    } catch (err) {
      console.error('[CandlestickChart] loadData error:', err)
    } finally {
      setLoading(false)
    }
  }, [ticker, interval])

  useEffect(() => { loadData() }, [loadData])

  useEffect(() => {
    if (priceData.length > 0) applyIndicators(priceData, INTRADAY.includes(interval))
  }, [indicators])

  const IND_BTNS = [
    { key: 'sma20' as keyof IndicatorState, label: 'SMA 20', color: '#00D4FF' },
    { key: 'sma50' as keyof IndicatorState, label: 'SMA 50', color: '#FFB800' },
    { key: 'sma200' as keyof IndicatorState, label: 'SMA 200', color: '#FF4444' },
    { key: 'ema12' as keyof IndicatorState, label: 'EMA 12', color: '#00FF88' },
    { key: 'bb' as keyof IndicatorState, label: 'BB', color: '#8B949E' },
    { key: 'rsi' as keyof IndicatorState, label: 'RSI', color: '#00D4FF' },
    { key: 'macd' as keyof IndicatorState, label: 'MACD', color: '#64748b' },
  ]

  return (
    <div className="bg-surface rounded-lg border border-border p-4">
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-text-secondary text-sm font-mono tracking-wide">PRICE · {ticker}</h3>
        <button
          onClick={() => mainChart.current?.timeScale().fitContent()}
          className="px-2 py-1 text-xs rounded font-mono text-text-muted hover:text-text-secondary hover:bg-surface-2 transition-colors"
        >⤢</button>
      </div>

      {/* Interval selector */}
      <div className="flex items-center gap-1 mb-2 flex-wrap">
        <span className="text-[10px] text-slate-600 font-mono uppercase tracking-wider mr-1">Intraday</span>
        {(['1m', '5m', '15m', '30m', '1H', '4H'] as ChartInterval[]).map((iv) => (
          <button key={iv} onClick={() => { setInterval(iv); loadData(iv) }}
            className={`px-2 py-0.5 text-xs rounded font-mono transition-colors ${interval === iv ? 'bg-accent text-white' : 'text-text-muted hover:text-text-secondary hover:bg-surface-2'}`}>
            {iv}
          </button>
        ))}
        <span className="text-border mx-1.5">│</span>
        <span className="text-[10px] text-slate-600 font-mono uppercase tracking-wider mr-1">Swing</span>
        {(['1D', '1W'] as ChartInterval[]).map((iv) => (
          <button key={iv} onClick={() => { setInterval(iv); loadData(iv) }}
            className={`px-2 py-0.5 text-xs rounded font-mono transition-colors ${interval === iv ? 'bg-accent text-white' : 'text-text-muted hover:text-text-secondary hover:bg-surface-2'}`}>
            {INTERVAL_LABELS[iv]}
          </button>
        ))}
        <span className="text-border mx-1.5">│</span>
        <span className="text-[10px] text-slate-600 font-mono uppercase tracking-wider mr-1">Long</span>
        {(['1M', '1Y', '5Y'] as ChartInterval[]).map((iv) => (
          <button key={iv} onClick={() => { setInterval(iv); loadData(iv) }}
            className={`px-2 py-0.5 text-xs rounded font-mono transition-colors ${interval === iv ? 'bg-accent text-white' : 'text-text-muted hover:text-text-secondary hover:bg-surface-2'}`}>
            {INTERVAL_LABELS[iv]}
          </button>
        ))}
      </div>

      {/* Indicator toggles */}
      <div className="flex flex-wrap gap-1.5 mb-3">
        {IND_BTNS.map(({ key, label, color }) => (
          <button key={key} onClick={() => setIndicators((p) => ({ ...p, [key]: !p[key] }))}
            className={`px-2 py-0.5 text-xs rounded-full border font-mono transition-all ${
              indicators[key] ? 'border-current text-current bg-current/10' : 'border-slate-700 text-slate-600 hover:text-slate-400'
            }`}
            style={indicators[key] ? { color } : {}}>
            {label}
          </button>
        ))}
      </div>

      {/* Charts */}
      <div className="relative">
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-surface/50 z-10 rounded">
            <div className="w-5 h-5 border-2 border-border border-t-accent rounded-full animate-spin" />
          </div>
        )}
        <div ref={mainRef} />
      </div>
      {showVolume && <div ref={volRef} className="mt-0.5" />}
      {indicators.rsi && (
        <div className="mt-0.5">
          <div className="text-xs text-slate-600 font-mono px-1 mb-0.5">RSI(14) — 70 overbought · 30 oversold</div>
          <div ref={rsiRef} />
        </div>
      )}
    </div>
  )
}
