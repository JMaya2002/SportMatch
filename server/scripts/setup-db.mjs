// server/scripts/setup-db.mjs
// Carga schema.sql (y opcionalmente seed.sql) en una DB.
// Uso: node scripts/setup-db.mjs [--seed] [--test]

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import dotenv from 'dotenv'
import pg from 'pg'

dotenv.config()

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const schemaPath = path.resolve(__dirname, '../src/db/schema.sql')
const seedPath = path.resolve(__dirname, '../src/db/seed.sql')

const useTest = process.argv.includes('--test')
const withSeed = process.argv.includes('--seed')
const url = useTest ? process.env.TEST_DATABASE_URL : process.env.DATABASE_URL

if (!url) {
  console.error(`Falta ${useTest ? 'TEST_DATABASE_URL' : 'DATABASE_URL'} en .env`)
  process.exit(1)
}

const client = new pg.Client({
  connectionString: url,
  ssl: { rejectUnauthorized: false },
})

await client.connect()
console.log(`Conectado a ${useTest ? 'TEST' : 'MAIN'} DB`)

const schemaSql = fs.readFileSync(schemaPath, 'utf-8')
await client.query(schemaSql)
console.log('Schema cargado')

if (withSeed) {
  const seedSql = fs.readFileSync(seedPath, 'utf-8')
  await client.query(seedSql)
  console.log('Datos seed insertados')
}

await client.end()
console.log('Listo')
