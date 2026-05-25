// server/tests/setup.js
// Antes de cada test recarga el schema en la DB de test
import { beforeEach, afterAll } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

// Fuerza NODE_ENV=test antes de importar config
process.env.NODE_ENV = 'test'

// Credenciales dummy para que Passport registre la estrategia Google
// (necesario para el smoke test de /api/auth/google)
process.env.GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || 'test-client-id'
process.env.GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || 'test-client-secret'
process.env.GOOGLE_CALLBACK_URL = process.env.GOOGLE_CALLBACK_URL || 'http://localhost:3000/api/auth/google/callback'

const { pool } = await import('../src/db.js')

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const schemaPath = path.resolve(__dirname, '../src/db/schema.sql')
const schemaSql = fs.readFileSync(schemaPath, 'utf-8')

beforeEach(async () => {
  await pool.query(schemaSql)
})

afterAll(async () => {
  await pool.end()
})
