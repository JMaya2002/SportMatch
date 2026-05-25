// server/src/routes/venues.js
// CRUD de recintos (club_venues) y de pistas (courts).
// Auth requerida; solo el owner del club puede modificar.
import express from 'express'
import { z } from 'zod'
import { pool } from '../db.js'
import { validate } from '../middleware/validate.js'
import { requireAuth } from '../middleware/auth.js'
import { AppError } from '../middleware/errorHandler.js'

// Dos routers: uno se monta bajo /api/clubs (para crear venues),
// otro bajo /api/venues (para editar/borrar y crear/editar/borrar courts).
export const clubVenuesRouter = express.Router({ mergeParams: true })
export const venuesRouter = express.Router()
export const courtsAdminRouter = express.Router()

async function assertClubOwner(clubId, userId) {
  const { rows } = await pool.query('SELECT owner_id FROM clubs WHERE id = $1', [clubId])
  if (!rows[0]) throw new AppError(404, 'Club no encontrado', 'NOT_FOUND')
  if (rows[0].owner_id !== userId) throw new AppError(403, 'No eres el dueño del club', 'NOT_OWNER')
}

async function assertVenueOwner(venueId, userId) {
  const { rows } = await pool.query(`
    SELECT c.owner_id, v.club_id FROM club_venues v JOIN clubs c ON c.id = v.club_id WHERE v.id = $1`, [venueId])
  if (!rows[0]) throw new AppError(404, 'Recinto no encontrado', 'NOT_FOUND')
  if (rows[0].owner_id !== userId) throw new AppError(403, 'No eres el dueño', 'NOT_OWNER')
  return rows[0].club_id
}

async function assertCourtOwner(courtId, userId) {
  const { rows } = await pool.query(`
    SELECT c.owner_id, ct.club_id, ct.venue_id FROM courts ct
    JOIN clubs c ON c.id = ct.club_id WHERE ct.id = $1`, [courtId])
  if (!rows[0]) throw new AppError(404, 'Pista no encontrada', 'NOT_FOUND')
  if (rows[0].owner_id !== userId) throw new AppError(403, 'No eres el dueño', 'NOT_OWNER')
  return rows[0]
}

// ============================================================
// VENUES bajo /api/clubs/:id/venues
// ============================================================
const venueSchema = z.object({
  name: z.string().min(1).max(150),
  city: z.string().min(1).max(100),
  address: z.string().max(255).optional().default(''),
  description: z.string().optional().default(''),
  phone: z.string().max(20).optional().default(''),
})

// GET /api/clubs/:id/venues
clubVenuesRouter.get('/', async (req, res, next) => {
  try {
    const clubId = Number(req.params.id)
    if (!Number.isInteger(clubId)) throw new AppError(400, 'ID inválido', 'BAD_ID')
    const { rows } = await pool.query('SELECT * FROM club_venues WHERE club_id = $1 ORDER BY id ASC', [clubId])
    res.json({ venues: rows })
  } catch (e) { next(e) }
})

// POST /api/clubs/:id/venues
clubVenuesRouter.post('/', requireAuth, validate(venueSchema), async (req, res, next) => {
  try {
    const clubId = Number(req.params.id)
    if (!Number.isInteger(clubId)) throw new AppError(400, 'ID inválido', 'BAD_ID')
    await assertClubOwner(clubId, req.userId)
    const b = req.body
    const { rows } = await pool.query(
      `INSERT INTO club_venues (club_id, name, city, address, description, phone)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [clubId, b.name, b.city, b.address, b.description, b.phone])
    res.status(201).json({ venue: rows[0] })
  } catch (e) { next(e) }
})

// ============================================================
// VENUES bajo /api/venues/:id (PATCH/DELETE + courts CRUD)
// ============================================================

// PATCH /api/venues/:id
venuesRouter.patch('/:id', requireAuth, validate(venueSchema.partial()), async (req, res, next) => {
  try {
    const id = Number(req.params.id)
    if (!Number.isInteger(id)) throw new AppError(400, 'ID inválido', 'BAD_ID')
    await assertVenueOwner(id, req.userId)
    const map = { name:'name', city:'city', address:'address', description:'description', phone:'phone' }
    const sets = []; const params = []
    for (const [k, col] of Object.entries(map)) {
      if (req.body[k] !== undefined) { params.push(req.body[k]); sets.push(`${col} = $${params.length}`) }
    }
    if (sets.length) {
      params.push(id)
      await pool.query(`UPDATE club_venues SET ${sets.join(', ')} WHERE id = $${params.length}`, params)
    }
    const { rows } = await pool.query('SELECT * FROM club_venues WHERE id = $1', [id])
    res.json({ venue: rows[0] })
  } catch (e) { next(e) }
})

// DELETE /api/venues/:id
venuesRouter.delete('/:id', requireAuth, async (req, res, next) => {
  try {
    const id = Number(req.params.id)
    if (!Number.isInteger(id)) throw new AppError(400, 'ID inválido', 'BAD_ID')
    await assertVenueOwner(id, req.userId)
    // No permitir borrar si alguna pista tiene reservas activas
    const { rows: clash } = await pool.query(`
      SELECT 1 FROM bookings b JOIN courts c ON c.id = b.court_id
      WHERE c.venue_id = $1 AND b.status != 'cancelled' LIMIT 1`, [id])
    if (clash[0]) throw new AppError(409, 'El recinto tiene pistas con reservas activas', 'HAS_BOOKINGS')
    await pool.query('DELETE FROM club_venues WHERE id = $1', [id])
    res.status(204).end()
  } catch (e) { next(e) }
})

// ============================================================
// COURTS bajo /api/venues/:id/courts
// ============================================================
const courtSchema = z.object({
  name: z.string().min(1).max(100),
  sport: z.enum(['futbol','padel','baloncesto','running','tenis','ciclismo','fitness','senderismo']),
  price_per_hour: z.coerce.number().nonnegative(),
  opening_hour: z.coerce.number().int().min(0).max(23).optional().default(8),
  closing_hour: z.coerce.number().int().min(1).max(24).optional().default(22),
})

// POST /api/venues/:id/courts
venuesRouter.post('/:id/courts', requireAuth, validate(courtSchema), async (req, res, next) => {
  try {
    const venueId = Number(req.params.id)
    if (!Number.isInteger(venueId)) throw new AppError(400, 'ID inválido', 'BAD_ID')
    const clubId = await assertVenueOwner(venueId, req.userId)
    const b = req.body
    const { rows } = await pool.query(
      `INSERT INTO courts (club_id, venue_id, name, sport, price_per_hour, opening_hour, closing_hour)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [clubId, venueId, b.name, b.sport, b.price_per_hour, b.opening_hour, b.closing_hour])
    res.status(201).json({ court: { ...rows[0], price_per_hour: Number(rows[0].price_per_hour) } })
  } catch (e) { next(e) }
})

// PATCH /api/courts/:id
courtsAdminRouter.patch('/:id', requireAuth, validate(courtSchema.partial()), async (req, res, next) => {
  try {
    const id = Number(req.params.id)
    if (!Number.isInteger(id)) throw new AppError(400, 'ID inválido', 'BAD_ID')
    await assertCourtOwner(id, req.userId)
    const map = { name:'name', sport:'sport', price_per_hour:'price_per_hour', opening_hour:'opening_hour', closing_hour:'closing_hour' }
    const sets = []; const params = []
    for (const [k, col] of Object.entries(map)) {
      if (req.body[k] !== undefined) { params.push(req.body[k]); sets.push(`${col} = $${params.length}`) }
    }
    if (sets.length) {
      params.push(id)
      await pool.query(`UPDATE courts SET ${sets.join(', ')} WHERE id = $${params.length}`, params)
    }
    const { rows } = await pool.query('SELECT * FROM courts WHERE id = $1', [id])
    res.json({ court: { ...rows[0], price_per_hour: Number(rows[0].price_per_hour) } })
  } catch (e) { next(e) }
})

// DELETE /api/courts/:id  (bloquea si tiene reservas activas)
courtsAdminRouter.delete('/:id', requireAuth, async (req, res, next) => {
  try {
    const id = Number(req.params.id)
    if (!Number.isInteger(id)) throw new AppError(400, 'ID inválido', 'BAD_ID')
    await assertCourtOwner(id, req.userId)
    const { rows: clash } = await pool.query(
      `SELECT 1 FROM bookings WHERE court_id = $1 AND status != 'cancelled' LIMIT 1`, [id])
    if (clash[0]) throw new AppError(409, 'La pista tiene reservas activas', 'HAS_BOOKINGS')
    await pool.query('DELETE FROM courts WHERE id = $1', [id])
    res.status(204).end()
  } catch (e) { next(e) }
})
