import express from 'express'
import { z } from 'zod'
import { pool } from '../db.js'
import { validate } from '../middleware/validate.js'
import { requireAuth } from '../middleware/auth.js'
import { AppError } from '../middleware/errorHandler.js'

export const meetupsRouter = express.Router()

function shape(r) {
  return {
    id: r.id, title: r.title, description: r.description,
    sport: r.sport, level: r.level, city: r.city, province: r.province, location: r.location,
    meetup_date: r.meetup_date, max_players: r.max_players,
    current_players: Number(r.current_players ?? 0),
    status: r.status, creator_id: r.creator_id, created_at: r.created_at,
    creator: r.creator_username ? {
      id: r.creator_id, username: r.creator_username,
      name: r.creator_name, avatar_url: r.creator_avatar_url,
    } : null,
  }
}

const SQL = `
  SELECT m.*,
    u.username AS creator_username, u.name AS creator_name, u.avatar_url AS creator_avatar_url,
    (SELECT COUNT(*) FROM meetup_participants p WHERE p.meetup_id = m.id) AS current_players
  FROM meetups m LEFT JOIN users u ON u.id = m.creator_id
`

const filterSchema = z.object({
  sport: z.string().optional(),
  level: z.enum(['principiante','intermedio','avanzado','experto']).optional(),
  city: z.string().optional(),
  province: z.string().optional(),
})

meetupsRouter.get('/', validate(filterSchema, 'query'), async (req, res, next) => {
  try {
    const { sport, level, city, province } = req.validatedQuery
    const cond = ["m.status != 'cancelled'"]; const p = []
    if (sport)    { p.push(sport);    cond.push(`m.sport = $${p.length}`) }
    if (level)    { p.push(level);    cond.push(`m.level = $${p.length}`) }
    if (city)     { p.push(city);     cond.push(`m.city ILIKE $${p.length}`) }
    if (province) { p.push(province); cond.push(`m.province = $${p.length}`) }
    const { rows } = await pool.query(`${SQL} WHERE ${cond.join(' AND ')} ORDER BY m.meetup_date ASC LIMIT 100`, p)
    res.json({ meetups: rows.map(shape) })
  } catch (e) { next(e) }
})

meetupsRouter.get('/:id', async (req, res, next) => {
  try {
    const id = Number(req.params.id)
    if (!Number.isInteger(id)) throw new AppError(400, 'ID inválido', 'BAD_ID')
    const { rows } = await pool.query(`${SQL} WHERE m.id = $1`, [id])
    if (!rows[0]) throw new AppError(404, 'Quedada no encontrada', 'NOT_FOUND')
    const meetup = shape(rows[0])
    const { rows: parts } = await pool.query(
      `SELECT u.id, u.username, u.name, u.avatar_url, u.city, p.joined_at
       FROM meetup_participants p JOIN users u ON u.id = p.user_id
       WHERE p.meetup_id = $1 ORDER BY p.joined_at ASC`, [id])
    meetup.participants = parts
    res.json({ meetup })
  } catch (e) { next(e) }
})

const createSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().optional().default(''),
  sport: z.enum(['futbol','padel','baloncesto','running','tenis','ciclismo','fitness','senderismo']),
  level: z.enum(['principiante','intermedio','avanzado','experto']),
  city: z.string().min(1).max(100),
  province: z.string().max(100).optional().default(''),
  location: z.string().max(255).optional().default(''),
  meetup_date: z.string().min(1),
  max_players: z.coerce.number().int().min(2).max(50),
})

meetupsRouter.post('/', requireAuth, validate(createSchema), async (req, res, next) => {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    const { title, description, sport, level, city, province, location, meetup_date, max_players } = req.body
    const ins = await client.query(
      `INSERT INTO meetups (creator_id, title, description, sport, level, city, province, location, meetup_date, max_players)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING id`,
      [req.userId, title, description, sport, level, city, province || null, location, meetup_date, max_players])
    const id = ins.rows[0].id
    await client.query(`INSERT INTO meetup_participants (meetup_id, user_id) VALUES ($1, $2)`, [id, req.userId])
    await client.query('COMMIT')
    const { rows } = await pool.query(`${SQL} WHERE m.id = $1`, [id])
    res.status(201).json({ meetup: shape(rows[0]) })
  } catch (e) {
    await client.query('ROLLBACK').catch(() => {})
    next(e)
  } finally { client.release() }
})

meetupsRouter.post('/:id/join', requireAuth, async (req, res, next) => {
  try {
    const id = Number(req.params.id)
    if (!Number.isInteger(id)) throw new AppError(400, 'ID inválido', 'BAD_ID')
    const { rows } = await pool.query(
      `SELECT m.*, (SELECT COUNT(*) FROM meetup_participants p WHERE p.meetup_id = m.id) AS current_players
       FROM meetups m WHERE m.id = $1`, [id])
    if (!rows[0]) throw new AppError(404, 'Quedada no encontrada', 'NOT_FOUND')
    if (rows[0].status === 'cancelled') throw new AppError(409, 'Quedada cancelada', 'CANCELLED')
    if (Number(rows[0].current_players) >= rows[0].max_players)
      throw new AppError(409, 'Quedada completa', 'FULL')
    await pool.query(`INSERT INTO meetup_participants (meetup_id, user_id) VALUES ($1, $2)`, [id, req.userId])
    res.status(204).end()
  } catch (e) { next(e) }
})

meetupsRouter.delete('/:id/join', requireAuth, async (req, res, next) => {
  try {
    const id = Number(req.params.id)
    if (!Number.isInteger(id)) throw new AppError(400, 'ID inválido', 'BAD_ID')
    await pool.query(`DELETE FROM meetup_participants WHERE meetup_id = $1 AND user_id = $2`, [id, req.userId])
    res.status(204).end()
  } catch (e) { next(e) }
})

meetupsRouter.delete('/:id', requireAuth, async (req, res, next) => {
  try {
    const id = Number(req.params.id)
    if (!Number.isInteger(id)) throw new AppError(400, 'ID inválido', 'BAD_ID')
    const { rows } = await pool.query('SELECT creator_id FROM meetups WHERE id = $1', [id])
    if (!rows[0]) throw new AppError(404, 'Quedada no encontrada', 'NOT_FOUND')
    if (rows[0].creator_id !== req.userId) throw new AppError(403, 'No eres el creador', 'NOT_OWNER')
    await pool.query('DELETE FROM meetups WHERE id = $1', [id])
    res.status(204).end()
  } catch (e) { next(e) }
})
