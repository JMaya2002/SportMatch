import express from 'express'
import multer from 'multer'
import { z } from 'zod'
import { pool } from '../db.js'
import { validate } from '../middleware/validate.js'
import { requireAuth, optionalAuth } from '../middleware/auth.js'
import { AppError } from '../middleware/errorHandler.js'
import { uploadBuffer } from '../cloudinary.js'

export const clubsRouter = express.Router()
export const courtsRouter = express.Router()

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, f, cb) => f.mimetype.startsWith('image/') ? cb(null, true) : cb(new AppError(400, 'Solo imágenes', 'BAD_FILE')),
})

async function getClubFull(id, viewerUserId = null) {
  const { rows: clubs } = await pool.query('SELECT * FROM clubs WHERE id = $1', [id])
  if (!clubs[0]) return null
  const club = clubs[0]
  const { rows: photos } = await pool.query('SELECT * FROM club_photos WHERE club_id = $1 ORDER BY position ASC', [id])
  const { rows: venues } = await pool.query('SELECT * FROM club_venues WHERE club_id = $1 ORDER BY id ASC', [id])
  const { rows: courts } = await pool.query('SELECT * FROM courts WHERE club_id = $1 ORDER BY id ASC', [id])
  const courtsByVenue = new Map()
  for (const c of courts) {
    const list = courtsByVenue.get(c.venue_id) || []
    list.push({ ...c, price_per_hour: Number(c.price_per_hour) })
    courtsByVenue.set(c.venue_id, list)
  }
  club.photos = photos.map(p => p.url)
  club.venues = venues.map(v => ({ ...v, courts: courtsByVenue.get(v.id) || [] }))
  // Compat: lista plana de pistas también disponible
  club.courts = courts.map(c => ({ ...c, price_per_hour: Number(c.price_per_hour) }))
  const { rows: cnt } = await pool.query('SELECT COUNT(*)::int AS n FROM club_followers WHERE club_id = $1', [id])
  club.followers_count = cnt[0].n
  if (viewerUserId) {
    const { rows: f } = await pool.query('SELECT 1 FROM club_followers WHERE club_id = $1 AND user_id = $2', [id, viewerUserId])
    club.is_following = !!f[0]
    club.is_owner = club.owner_id === viewerUserId
  } else {
    club.is_following = false
    club.is_owner = false
  }
  return club
}

export async function assertClubOwner(clubId, userId) {
  return assertOwner(clubId, userId)
}
async function assertOwner(clubId, userId) {
  const { rows } = await pool.query('SELECT owner_id FROM clubs WHERE id = $1', [clubId])
  if (!rows[0]) throw new AppError(404, 'Club no encontrado', 'NOT_FOUND')
  if (rows[0].owner_id !== userId) throw new AppError(403, 'No eres el dueño del club', 'NOT_OWNER')
}

// ── GET /api/clubs ──
clubsRouter.get('/', async (req, res, next) => {
  try {
    const { city } = req.query
    const cond = []; const p = []
    if (city) { p.push(city); cond.push(`c.city ILIKE $${p.length}`) }
    const where = cond.length ? `WHERE ${cond.join(' AND ')}` : ''
    const { rows } = await pool.query(`
      SELECT c.*,
        (SELECT url FROM club_photos WHERE club_id = c.id ORDER BY position ASC LIMIT 1) AS cover,
        (SELECT json_agg(json_build_object('id', id, 'name', name, 'sport', sport, 'price_per_hour', price_per_hour))
           FROM courts WHERE club_id = c.id) AS courts
      FROM clubs c ${where} ORDER BY c.created_at DESC LIMIT 100`, p)
    const clubs = rows.map(r => ({
      ...r,
      courts: (r.courts || []).map(ct => ({ ...ct, price_per_hour: Number(ct.price_per_hour) })),
      photos: r.cover ? [r.cover] : [],
    }))
    res.json({ clubs })
  } catch (e) { next(e) }
})

// ── GET /api/clubs/me ── (clubes del owner)
// Importante: declarar ANTES de '/:id' para que no se solape la ruta
clubsRouter.get('/me', requireAuth, async (req, res, next) => {
  try {
    const { rows } = await pool.query(`
      SELECT c.*,
        (SELECT COUNT(*)::int FROM club_venues  WHERE club_id = c.id) AS venue_count,
        (SELECT COUNT(*)::int FROM courts       WHERE club_id = c.id) AS court_count,
        (SELECT COUNT(*)::int FROM club_followers WHERE club_id = c.id) AS followers_count,
        (SELECT url FROM club_photos WHERE club_id = c.id ORDER BY position ASC LIMIT 1) AS cover
      FROM clubs c WHERE c.owner_id = $1 ORDER BY c.id ASC`, [req.userId])
    res.json({ clubs: rows })
  } catch (e) { next(e) }
})

// ── GET /api/clubs/me/following ── (clubes que sigo)
clubsRouter.get('/me/following', requireAuth, async (req, res, next) => {
  try {
    const { rows } = await pool.query(`
      SELECT c.*,
        (SELECT url FROM club_photos WHERE club_id = c.id ORDER BY position ASC LIMIT 1) AS cover,
        f.followed_at
      FROM club_followers f JOIN clubs c ON c.id = f.club_id
      WHERE f.user_id = $1 ORDER BY f.followed_at DESC`, [req.userId])
    res.json({ clubs: rows })
  } catch (e) { next(e) }
})

// ── GET /api/clubs/:id ──
clubsRouter.get('/:id', optionalAuth, async (req, res, next) => {
  try {
    const id = Number(req.params.id)
    if (!Number.isInteger(id)) throw new AppError(400, 'ID inválido', 'BAD_ID')
    const club = await getClubFull(id, req.userId || null)
    if (!club) throw new AppError(404, 'Club no encontrado', 'NOT_FOUND')
    res.json({ club })
  } catch (e) { next(e) }
})

// ── POST /api/clubs/:id/follow ──
clubsRouter.post('/:id/follow', requireAuth, async (req, res, next) => {
  try {
    const id = Number(req.params.id)
    if (!Number.isInteger(id)) throw new AppError(400, 'ID inválido', 'BAD_ID')
    const { rows } = await pool.query('SELECT 1 FROM clubs WHERE id = $1', [id])
    if (!rows[0]) throw new AppError(404, 'Club no encontrado', 'NOT_FOUND')
    await pool.query(
      `INSERT INTO club_followers (club_id, user_id) VALUES ($1, $2)
       ON CONFLICT DO NOTHING`, [id, req.userId])
    res.status(204).end()
  } catch (e) { next(e) }
})

// ── DELETE /api/clubs/:id/follow ──
clubsRouter.delete('/:id/follow', requireAuth, async (req, res, next) => {
  try {
    const id = Number(req.params.id)
    if (!Number.isInteger(id)) throw new AppError(400, 'ID inválido', 'BAD_ID')
    await pool.query('DELETE FROM club_followers WHERE club_id = $1 AND user_id = $2', [id, req.userId])
    res.status(204).end()
  } catch (e) { next(e) }
})

// ── GET /api/clubs/:id/followers ── (público, devuelve lista de seguidores)
clubsRouter.get('/:id/followers', async (req, res, next) => {
  try {
    const id = Number(req.params.id)
    if (!Number.isInteger(id)) throw new AppError(400, 'ID inválido', 'BAD_ID')
    const { rows } = await pool.query(`
      SELECT u.id, u.username, u.name, u.avatar_url, u.city
      FROM club_followers f JOIN users u ON u.id = f.user_id
      WHERE f.club_id = $1 ORDER BY f.followed_at DESC LIMIT 200`, [id])
    res.json({ followers: rows })
  } catch (e) { next(e) }
})

// ── GET /api/clubs/:id/bookings ── (solo owner)
clubsRouter.get('/:id/bookings', requireAuth, async (req, res, next) => {
  try {
    const id = Number(req.params.id)
    if (!Number.isInteger(id)) throw new AppError(400, 'ID inválido', 'BAD_ID')
    await assertOwner(id, req.userId)
    const { rows } = await pool.query(`
      SELECT b.*, c.name AS court_name, c.sport, u.username, u.name AS user_name
      FROM bookings b
      JOIN courts c ON c.id = b.court_id
      LEFT JOIN users u ON u.id = b.user_id
      WHERE c.club_id = $1
      ORDER BY b.booking_date DESC, b.start_hour DESC LIMIT 200`, [id])
    res.json({ bookings: rows.map(r => ({ ...r, total_price: Number(r.total_price), platform_fee: Number(r.platform_fee), club_payout: Number(r.club_payout) })) })
  } catch (e) { next(e) }
})

// ── POST /api/clubs ──
const clubSchema = z.object({
  name: z.string().min(1).max(150),
  city: z.string().min(1).max(100),
  address: z.string().max(255).optional().default(''),
  description: z.string().optional().default(''),
  phone: z.string().max(20).optional().default(''),
})

clubsRouter.post('/', requireAuth, validate(clubSchema), async (req, res, next) => {
  try {
    const { name, city, address, description, phone } = req.body
    const { rows } = await pool.query(
      `INSERT INTO clubs (owner_id, name, city, address, description, phone)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [req.userId, name, city, address, description, phone])
    res.status(201).json({ club: { ...rows[0], photos: [], courts: [] } })
  } catch (e) { next(e) }
})

// ── PATCH /api/clubs/:id ──
clubsRouter.patch('/:id', requireAuth, validate(clubSchema.partial()), async (req, res, next) => {
  try {
    const id = Number(req.params.id)
    if (!Number.isInteger(id)) throw new AppError(400, 'ID inválido', 'BAD_ID')
    await assertOwner(id, req.userId)
    const map = { name: 'name', city: 'city', address: 'address', description: 'description', phone: 'phone' }
    const sets = []; const params = []
    for (const [k, col] of Object.entries(map)) {
      if (req.body[k] !== undefined) { params.push(req.body[k]); sets.push(`${col} = $${params.length}`) }
    }
    if (sets.length) {
      params.push(id)
      await pool.query(`UPDATE clubs SET ${sets.join(', ')} WHERE id = $${params.length}`, params)
    }
    res.json({ club: await getClubFull(id) })
  } catch (e) { next(e) }
})

// ── POST /api/clubs/:id/photos ──
clubsRouter.post('/:id/photos', requireAuth, upload.single('photo'), async (req, res, next) => {
  try {
    const id = Number(req.params.id)
    if (!Number.isInteger(id)) throw new AppError(400, 'ID inválido', 'BAD_ID')
    await assertOwner(id, req.userId)
    if (!req.file) throw new AppError(400, 'Falta el archivo "photo"', 'NO_FILE')
    const url = await uploadBuffer(req.file.buffer, `sportmatch/clubs/${id}`)
    await pool.query('INSERT INTO club_photos (club_id, url) VALUES ($1, $2)', [id, url])
    res.json({ url })
  } catch (e) { next(e) }
})

// ── POST /api/clubs/:id/courts ──
const courtSchema = z.object({
  name: z.string().min(1).max(100),
  sport: z.enum(['futbol','padel','baloncesto','running','tenis','ciclismo','fitness','senderismo']),
  price_per_hour: z.coerce.number().nonnegative(),
  opening_hour: z.coerce.number().int().min(0).max(23).optional().default(8),
  closing_hour: z.coerce.number().int().min(1).max(24).optional().default(22),
})

// Las CRUDs de courts y venues se han movido a routes/venues.js (Fase amigos+clubs).

// ── GET /api/courts/:id/availability ──
// Fase 3: sin tabla de bookings todavía → todos los slots libres entre opening/closing.
// La Fase 4 (Stripe) marcará como no disponibles los slots con reserva.
courtsRouter.get('/:id/availability', async (req, res, next) => {
  try {
    const id = Number(req.params.id)
    if (!Number.isInteger(id)) throw new AppError(400, 'ID inválido', 'BAD_ID')
    const date = req.query.date || new Date().toISOString().split('T')[0]
    const { rows } = await pool.query('SELECT * FROM courts WHERE id = $1', [id])
    if (!rows[0]) throw new AppError(404, 'Pista no encontrada', 'NOT_FOUND')
    const { opening_hour, closing_hour } = rows[0]
    // Cargamos reservas activas del día para marcar slots ocupados
    const { rows: bookings } = await pool.query(
      `SELECT start_hour, end_hour FROM bookings
       WHERE court_id = $1 AND booking_date = $2 AND status != 'cancelled'`, [id, date])
    const taken = new Set()
    for (const b of bookings) {
      for (let h = b.start_hour; h < b.end_hour; h++) taken.add(h)
    }
    const slots = []
    for (let h = opening_hour; h < closing_hour; h++) {
      slots.push({ hour: h, available: !taken.has(h) })
    }
    res.json({ courtId: id, date, slots })
  } catch (e) { next(e) }
})
