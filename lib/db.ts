import { Pool } from 'pg'

let pool: Pool | null = null
let migrated = false

export function getDb(): Pool {
  if (!pool) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.DATABASE_URL?.includes('localhost') ? false : { rejectUnauthorized: false },
    })
  }
  return pool
}

export async function query<T = Record<string, unknown>>(
  sql: string,
  params?: unknown[]
): Promise<T[]> {
  const db = getDb()
  if (!migrated) {
    migrated = true
    await runMigrations(db).catch((e) => console.error('[db] migration error:', e))
  }
  const result = await db.query(sql, params)
  return result.rows as T[]
}

async function runMigrations(db: Pool): Promise<void> {
  await db.query(`
    CREATE TABLE IF NOT EXISTS portfolio_holdings (
      id SERIAL PRIMARY KEY,
      ticker VARCHAR(20) NOT NULL,
      name VARCHAR(255),
      shares DECIMAL(15,6) NOT NULL DEFAULT 0,
      cost_basis DECIMAL(15,2),
      asset_type VARCHAR(50) DEFAULT 'stock',
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    )
  `)
  await db.query(`
    CREATE TABLE IF NOT EXISTS portfolio_snapshots (
      id SERIAL PRIMARY KEY,
      snapshot_date DATE NOT NULL,
      total_value DECIMAL(15,2),
      total_cost DECIMAL(15,2),
      data JSONB,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `)
  await db.query(`
    CREATE TABLE IF NOT EXISTS watchlist (
      id SERIAL PRIMARY KEY,
      ticker VARCHAR(20) NOT NULL UNIQUE,
      added_at TIMESTAMP DEFAULT NOW()
    )
  `)
  await db.query(`
    CREATE TABLE IF NOT EXISTS alerts (
      id SERIAL PRIMARY KEY,
      ticker VARCHAR(20) NOT NULL,
      condition VARCHAR(50),
      target_price DECIMAL(15,2),
      triggered BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `)

  // Seed holdings if empty
  const { rows } = await db.query('SELECT COUNT(*) as count FROM portfolio_holdings')
  if (parseInt(rows[0].count) === 0) {
    const holdings = [
      { ticker: 'GOOGL', name: 'Alphabet Inc Shs Cl A',                  shares: 33,       cost_basis: 257.576,  asset_type: 'stock'    },
      { ticker: 'AAPL',  name: 'Apple Inc',                               shares: 35,       cost_basis: 242.857,  asset_type: 'stock'    },
      { ticker: 'SHV',   name: 'iShares 0-1 Yr Treasury Bond ETF',       shares: 100,      cost_basis: 109.995,  asset_type: 'bond_etf' },
      { ticker: 'IBB',   name: 'iShares Biotechnology ETF',               shares: 10,       cost_basis: 144.258,  asset_type: 'etf'      },
      { ticker: 'XLF',   name: 'Financial Select Sector SPDR ETF',        shares: 150,      cost_basis: 37.609,   asset_type: 'etf'      },
      { ticker: 'XLV',   name: 'Health Care Select Sector SPDR ETF',      shares: 46,       cost_basis: 119.443,  asset_type: 'etf'      },
      { ticker: 'XLY',   name: 'Consumer Discret Select Sector SPDR ETF', shares: 40,       cost_basis: 85.008,   asset_type: 'etf'      },
      { ticker: 'VDC',   name: 'Vanguard Consumer Staples ETF',           shares: 30,       cost_basis: 180.471,  asset_type: 'etf'      },
      { ticker: 'VDE',   name: 'Vanguard Energy ETF',                     shares: 31,       cost_basis: 87.418,   asset_type: 'etf'      },
      { ticker: 'VIS',   name: 'Vanguard Industrials ETF',                shares: 20,       cost_basis: 186.98,   asset_type: 'etf'      },
      { ticker: 'VGT',   name: 'Vanguard Information Technology ETF',     shares: 20,       cost_basis: 375.36,   asset_type: 'etf'      },
      { ticker: 'VNQ',   name: 'Vanguard Real Estate ETF',                shares: 146.7128, cost_basis: 85.648,   asset_type: 'etf'      },
      { ticker: 'VPU',   name: 'Vanguard Utilities ETF',                  shares: 16,       cost_basis: 142.233,  asset_type: 'etf'      },
      { ticker: 'CASH',  name: 'ML Bank Deposit Program',                 shares: 13656,    cost_basis: 1.00,     asset_type: 'cash'     },
    ]
    for (const h of holdings) {
      await db.query(
        'INSERT INTO portfolio_holdings (ticker, name, shares, cost_basis, asset_type) VALUES ($1, $2, $3, $4, $5)',
        [h.ticker, h.name, h.shares, h.cost_basis, h.asset_type]
      )
    }
    console.log('[db] Seeded 14 holdings')
  }
}
