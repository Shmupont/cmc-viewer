// Technical Indicator Calculations (pure TS, client-side)

export function calcSMA(closes: number[], period: number): (number | null)[] {
  return closes.map((_, i) => {
    if (i < period - 1) return null
    const slice = closes.slice(i - period + 1, i + 1)
    return slice.reduce((a, b) => a + b, 0) / period
  })
}

export function calcEMA(closes: number[], period: number): (number | null)[] {
  const k = 2 / (period + 1)
  const result: (number | null)[] = []
  let ema: number | null = null
  for (let i = 0; i < closes.length; i++) {
    if (i < period - 1) {
      result.push(null)
    } else if (i === period - 1) {
      ema = closes.slice(0, period).reduce((a, b) => a + b, 0) / period
      result.push(ema)
    } else {
      ema = closes[i] * k + ema! * (1 - k)
      result.push(ema)
    }
  }
  return result
}

export interface BollingerBand {
  upper: number | null
  middle: number | null
  lower: number | null
}

export function calcBollingerBands(closes: number[], period = 20, stdMult = 2): BollingerBand[] {
  return closes.map((_, i) => {
    if (i < period - 1) return { upper: null, middle: null, lower: null }
    const slice = closes.slice(i - period + 1, i + 1)
    const mean = slice.reduce((a, b) => a + b, 0) / period
    const variance = slice.reduce((a, b) => a + (b - mean) ** 2, 0) / period
    const std = Math.sqrt(variance)
    return {
      upper: mean + stdMult * std,
      middle: mean,
      lower: mean - stdMult * std,
    }
  })
}

export interface RSIPoint { rsi: number | null }

export function calcRSI(closes: number[], period = 14): RSIPoint[] {
  const result: RSIPoint[] = []
  let avgGain = 0
  let avgLoss = 0

  for (let i = 0; i < closes.length; i++) {
    if (i === 0) { result.push({ rsi: null }); continue }
    const change = closes[i] - closes[i - 1]
    const gain = Math.max(change, 0)
    const loss = Math.max(-change, 0)

    if (i <= period) {
      avgGain += gain / period
      avgLoss += loss / period
      if (i < period) { result.push({ rsi: null }); continue }
      const rs = avgLoss === 0 ? 100 : avgGain / avgLoss
      result.push({ rsi: 100 - 100 / (1 + rs) })
    } else {
      avgGain = (avgGain * (period - 1) + gain) / period
      avgLoss = (avgLoss * (period - 1) + loss) / period
      const rs = avgLoss === 0 ? 100 : avgGain / avgLoss
      result.push({ rsi: 100 - 100 / (1 + rs) })
    }
  }
  return result
}

export interface MACDPoint {
  macd: number | null
  signal: number | null
  histogram: number | null
}

export function calcMACD(closes: number[], fast = 12, slow = 26, signal = 9): MACDPoint[] {
  const emaFast = calcEMA(closes, fast)
  const emaSlow = calcEMA(closes, slow)
  const macdLine: (number | null)[] = emaFast.map((f, i) =>
    f !== null && emaSlow[i] !== null ? f - emaSlow[i]! : null
  )

  const macdNonNull = macdLine.filter((v): v is number => v !== null)
  const signalEma = calcEMA(macdNonNull, signal)

  let sigIdx = 0
  return macdLine.map((m) => {
    if (m === null) return { macd: null, signal: null, histogram: null }
    const sig = signalEma[sigIdx] ?? null
    sigIdx++
    return { macd: m, signal: sig, histogram: sig !== null ? m - sig : null }
  })
}
