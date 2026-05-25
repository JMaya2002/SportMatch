// server/tests/helpers.js
// Helpers compartidos por tests
import bcrypt from 'bcrypt'
import { pool } from '../src/db.js'

// Inserta un usuario de prueba y devuelve sus datos
export async function createTestUser(overrides = {}) {
  const data = {
    username: 'testuser',
    email: 'test@test.com',
    password: 'test1234',
    name: 'Test User',
    age: 25,
    city: 'Barcelona',
    main_sport: 'padel',
    level: 'intermedio',
    age_confirmed: true,
    is_admin: false,
    ...overrides,
  }
  const hash = await bcrypt.hash(data.password, 10)
  const result = await pool.query(
    `INSERT INTO users (username, email, password_hash, name, age, city, main_sport, level, age_confirmed, is_admin)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
    [data.username, data.email, hash, data.name, data.age, data.city, data.main_sport, data.level, data.age_confirmed, data.is_admin]
  )
  return { ...result.rows[0], plainPassword: data.password }
}
