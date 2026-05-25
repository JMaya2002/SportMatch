// server/src/routes/admin.js
// Endpoints CRUD bajo /api/admin. Protegidos por requireAdmin.
import express from 'express'
import bcrypt from 'bcrypt'
import { z } from 'zod'
import { pool } from '../db.js'
import { validate } from '../middleware/validate.js'
import { requireAdmin } from '../middleware/auth.js'
import { AppError } from '../middleware/errorHandler.js'

export const adminRouter = express.Router()

// Todas las rutas exigen admin
adminRouter.use(requireAdmin)

// ─── Helpers ──────────────────────────────────────────────
function pickUserFields(row) {
  const { password_hash, google_id, ...rest } = row
  return rest
}

function buildUpdate(map, body) {
  const sets = []
  const params = []
  for (const [k, col] of Object.entries(map)) {
    if (body[k] !== undefined) {
      params.push(body[k])
      sets.push(`${col} = $${params.length}`)
    }
  }
  return { sets, params }
}

// ============================================================
// USERS
// ============================================================
const userCreateSchema = z.object({
  username: z.string().min(3).max(30).regex(/^[a-z0-9_]+$/i),
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(1).max(100),
  age: z.coerce.number().int().min(18),
  city: z.string().min(1).max(100),
  mainSport: z.enum(['futbol','padel','baloncesto','running','tenis','ciclismo','fitness','senderismo']),
  level: z.enum(['principiante','intermedio','avanzado']),
  is_admin: z.boolean().optional().default(false),
})

const userUpdateSchema = z.object({
  username: z.string().min(3).max(30).regex(/^[a-z0-9_]+$/i).optional(),
  email: z.string().email().optional(),
  password: z.string().min(8).optional(),
  name: z.string().min(1).max(100).optional(),
  age: z.coerce.number().int().min(18).optional(),
  city: z.string().min(1).max(100).optional(),
  mainSport: z.enum(['futbol','padel','baloncesto','running','tenis','ciclismo','fitness','senderismo']).optional(),
  level: z.enum(['principiante','intermedio','avanzado']).optional(),
  is_admin: z.boolean().optional(),
})

adminRouter.get('/users', async (req, res, next) => {
  try {
    const { rows } = await pool.query('SELECT * FROM users ORDER BY id ASC')
    res.json({ users: rows.map(pickUserFields) })
  } catch (e) { next(e) }
})

adminRouter.post('/users', validate(userCreateSchema), async (req, res, next) => {
  try {
    const b = req.body
    const hash = await bcrypt.hash(b.password, 10)
    const { rows } = await pool.query(
      `INSERT INTO users (username, email, password_hash, name, age, city, main_sport, level, age_confirmed, is_admin)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,true,$9) RETURNING *`,
      [b.username, b.email, hash, b.name, b.age, b.city, b.mainSport, b.level, b.is_admin])
    res.status(201).json({ user: pickUserFields(rows[0]) })
  } catch (e) { next(e) }
})

adminRouter.patch('/users/:id', validate(userUpdateSchema), async (req, res, next) => {
  try {
    const id = Number(req.params.id)
    if (!Number.isInteger(id)) throw new AppError(400, 'ID inválido', 'BAD_ID')
    const map = { username:'username', email:'email', name:'name', age:'age', city:'city', mainSport:'main_sport', level:'level', is_admin:'is_admin' }
    const { sets, params } = buildUpdate(map, req.body)
    if (req.body.password) {
      const hash = await bcrypt.hash(req.body.password, 10)
      params.push(hash); sets.push(`password_hash = $${params.length}`)
    }
    if (!sets.length) {
      const { rows } = await pool.query('SELECT * FROM users WHERE id = $1', [id])
      if (!rows[0]) throw new AppError(404, 'Usuario no encontrado', 'NOT_FOUND')
      return res.json({ user: pickUserFields(rows[0]) })
    }
    params.push(id)
    const { rows } = await pool.query(
      `UPDATE users SET ${sets.join(', ')} WHERE id = $${params.length} RETURNING *`, params)
    if (!rows[0]) throw new AppError(404, 'Usuario no encontrado', 'NOT_FOUND')
    res.json({ user: pickUserFields(rows[0]) })
  } catch (e) { next(e) }
})

adminRouter.delete('/users/:id', async (req, res, next) => {
  try {
    const id = Number(req.params.id)
    if (!Number.isInteger(id)) throw new AppError(400, 'ID inválido', 'BAD_ID')
    if (id === req.userId) throw new AppError(400, 'No puedes borrarte a ti mismo', 'SELF_DELETE')
    const r = await pool.query('DELETE FROM users WHERE id = $1', [id])
    if (r.rowCount === 0) throw new AppError(404, 'Usuario no encontrado', 'NOT_FOUND')
    res.status(204).end()
  } catch (e) { next(e) }
})

// ============================================================
// CLUBS
// ============================================================
const clubCreateSchema = z.object({
  name: z.string().min(1).max(150),
  city: z.string().min(1).max(100),
  address: z.string().max(255).optional().default(''),
  description: z.string().optional().default(''),
  phone: z.string().max(20).optional().default(''),
  owner_id: z.coerce.number().int().positive().optional(),
})

const clubUpdateSchema = clubCreateSchema.partial()

adminRouter.get('/clubs', async (req, res, next) => {
  try {
    const { rows } = await pool.query(`
      SELECT c.*,
        (SELECT COUNT(*) FROM courts WHERE club_id = c.id) AS court_count
      FROM clubs c ORDER BY c.id ASC`)
    res.json({ clubs: rows.map(r => ({ ...r, court_count: Number(r.court_count) })) })
  } catch (e) { next(e) }
})

adminRouter.post('/clubs', validate(clubCreateSchema), async (req, res, next) => {
  try {
    const b = req.body
    const ownerId = b.owner_id ?? req.userId
    const { rows } = await pool.query(
      `INSERT INTO clubs (owner_id, name, city, address, description, phone)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [ownerId, b.name, b.city, b.address, b.description, b.phone])
    res.status(201).json({ club: rows[0] })
  } catch (e) { next(e) }
})

adminRouter.patch('/clubs/:id', validate(clubUpdateSchema), async (req, res, next) => {
  try {
    const id = Number(req.params.id)
    if (!Number.isInteger(id)) throw new AppError(400, 'ID inválido', 'BAD_ID')
    const map = { name:'name', city:'city', address:'address', description:'description', phone:'phone', owner_id:'owner_id' }
    const { sets, params } = buildUpdate(map, req.body)
    if (!sets.length) {
      const { rows } = await pool.query('SELECT * FROM clubs WHERE id = $1', [id])
      if (!rows[0]) throw new AppError(404, 'Club no encontrado', 'NOT_FOUND')
      return res.json({ club: rows[0] })
    }
    params.push(id)
    const { rows } = await pool.query(
      `UPDATE clubs SET ${sets.join(', ')} WHERE id = $${params.length} RETURNING *`, params)
    if (!rows[0]) throw new AppError(404, 'Club no encontrado', 'NOT_FOUND')
    res.json({ club: rows[0] })
  } catch (e) { next(e) }
})

adminRouter.delete('/clubs/:id', async (req, res, next) => {
  try {
    const id = Number(req.params.id)
    if (!Number.isInteger(id)) throw new AppError(400, 'ID inválido', 'BAD_ID')
    const r = await pool.query('DELETE FROM clubs WHERE id = $1', [id])
    if (r.rowCount === 0) throw new AppError(404, 'Club no encontrado', 'NOT_FOUND')
    res.status(204).end()
  } catch (e) { next(e) }
})

// ============================================================
// MEETUPS (EVENTOS)
// ============================================================
const meetupCreateSchema = z.object({
  creator_id: z.coerce.number().int().positive(),
  title: z.string().min(1).max(200),
  description: z.string().optional().default(''),
  sport: z.enum(['futbol','padel','baloncesto','running','tenis','ciclismo','fitness','senderismo']),
  level: z.enum(['principiante','intermedio','avanzado']),
  city: z.string().min(1).max(100),
  location: z.string().max(255).optional().default(''),
  meetup_date: z.string().min(1),
  max_players: z.coerce.number().int().min(2).max(50),
  status: z.enum(['open','full','cancelled']).optional().default('open'),
})

const meetupUpdateSchema = meetupCreateSchema.partial()

adminRouter.get('/meetups', async (req, res, next) => {
  try {
    const { rows } = await pool.query(`
      SELECT m.*, u.username AS creator_username, u.name AS creator_name,
        (SELECT COUNT(*) FROM meetup_participants WHERE meetup_id = m.id) AS participants_count
      FROM meetups m LEFT JOIN users u ON u.id = m.creator_id
      ORDER BY m.meetup_date DESC`)
    res.json({ meetups: rows.map(r => ({ ...r, participants_count: Number(r.participants_count) })) })
  } catch (e) { next(e) }
})

adminRouter.post('/meetups', validate(meetupCreateSchema), async (req, res, next) => {
  const client = await pool.connect()
  try {
    const b = req.body
    await client.query('BEGIN')
    const ins = await client.query(
      `INSERT INTO meetups (creator_id, title, description, sport, level, city, location, meetup_date, max_players, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
      [b.creator_id, b.title, b.description, b.sport, b.level, b.city, b.location, b.meetup_date, b.max_players, b.status])
    await client.query('INSERT INTO meetup_participants (meetup_id, user_id) VALUES ($1, $2)', [ins.rows[0].id, b.creator_id])
    await client.query('COMMIT')
    res.status(201).json({ meetup: ins.rows[0] })
  } catch (e) {
    await client.query('ROLLBACK').catch(() => {})
    next(e)
  } finally { client.release() }
})

adminRouter.patch('/meetups/:id', validate(meetupUpdateSchema), async (req, res, next) => {
  try {
    const id = Number(req.params.id)
    if (!Number.isInteger(id)) throw new AppError(400, 'ID inválido', 'BAD_ID')
    const map = { creator_id:'creator_id', title:'title', description:'description', sport:'sport', level:'level', city:'city', location:'location', meetup_date:'meetup_date', max_players:'max_players', status:'status' }
    const { sets, params } = buildUpdate(map, req.body)
    if (!sets.length) {
      const { rows } = await pool.query('SELECT * FROM meetups WHERE id = $1', [id])
      if (!rows[0]) throw new AppError(404, 'Quedada no encontrada', 'NOT_FOUND')
      return res.json({ meetup: rows[0] })
    }
    params.push(id)
    const { rows } = await pool.query(
      `UPDATE meetups SET ${sets.join(', ')} WHERE id = $${params.length} RETURNING *`, params)
    if (!rows[0]) throw new AppError(404, 'Quedada no encontrada', 'NOT_FOUND')
    res.json({ meetup: rows[0] })
  } catch (e) { next(e) }
})

adminRouter.delete('/meetups/:id', async (req, res, next) => {
  try {
    const id = Number(req.params.id)
    if (!Number.isInteger(id)) throw new AppError(400, 'ID inválido', 'BAD_ID')
    const r = await pool.query('DELETE FROM meetups WHERE id = $1', [id])
    if (r.rowCount === 0) throw new AppError(404, 'Quedada no encontrada', 'NOT_FOUND')
    res.status(204).end()
  } catch (e) { next(e) }
})

// ============================================================
// STATS (resumen del dashboard)
// ============================================================
adminRouter.get('/stats', async (req, res, next) => {
  try {
    const { rows } = await pool.query(`
      SELECT
        (SELECT COUNT(*) FROM users)::int AS users,
        (SELECT COUNT(*) FROM users WHERE is_admin)::int AS admins,
        (SELECT COUNT(*) FROM clubs)::int AS clubs,
        (SELECT COUNT(*) FROM courts)::int AS courts,
        (SELECT COUNT(*) FROM meetups)::int AS meetups,
        (SELECT COUNT(*) FROM bookings WHERE status = 'paid')::int AS paid_bookings,
        (SELECT COALESCE(SUM(platform_fee), 0) FROM bookings WHERE status = 'paid') AS total_fees
    `)
    const s = rows[0]
    res.json({ stats: { ...s, total_fees: Number(s.total_fees) } })
  } catch (e) { next(e) }
})
