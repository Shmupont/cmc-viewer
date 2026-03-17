import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        base: '#0a0e17',
        surface: '#0f1623',
        'surface-2': '#141d2e',
        border: '#1e2d3d',
        'border-bright': '#2a3f5a',
        accent: '#3b82f6',
        'accent-2': '#1d4ed8',
        positive: '#22c55e',
        negative: '#ef4444',
        warning: '#f59e0b',
        neutral: '#64748b',
        'text-primary': '#e2e8f0',
        'text-secondary': '#94a3b8',
        'text-muted': '#475569',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
    },
  },
  plugins: [],
}

export default config
