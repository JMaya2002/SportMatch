// server/src/db.js
// Pool de conexiones a Postgres
import pg from 'pg'
import { config } from './config.js'

const { Pool } = pg

export const pool = new Pool({
  connectionString: config.databaseUrl,
  // Neon y la mayoría de proveedores cloud requieren SSL
  ssl: config.databaseUrl?.includes('sslmode=require')
    ? { rejectUnauthorized: false }
    : false,
})

// Helper: ejecuta una query y devuelve filas
export async function query(text, params) {
  const res = await pool.query(text, params)
  return res
}
