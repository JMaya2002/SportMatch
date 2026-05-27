// server/src/routes/users.js
import express from 'express'
import multer from 'multer'
import { z } from 'zod'
import { pool } from '../db.js'
import { validate } from '../middleware/validate.js'
import { requireAuth } from '../middleware/auth.js'
import { AppError } from '../middleware/errorHandler.js'
import { uploadBuffer } from '../cloudinary.js'

export const usersRouter = express.Router()

// Multer en memoria: máx 5 MB y solo imágenes
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) return cb(new AppError(400, 'Solo se permiten imágenes', 'BAD_FILE'))
    cb(null, true)
  },
})

// Forma pública: sin email, sin hash, sin google_id
function publicCard(row) {
  return {
    id: row.id,
    username: row.username,
    name: row.name,
    age: row.age,
    city: row.city,
    main_sport: row.main_sport,
    level: row.level,
    avatar_url: row.avatar_url,
    bio: row.bio,
  }
}

// Forma para "mi propio perfil" (incluye email)
function privateProfile(row) {
  const { password_hash, google_id, ...rest } = row
  return rest
}

// ─── GET /api/users  (con filtros opcionales) ─────────────
const filterSchema = z.object({
  sport: z.string().optional(),
  level: z.enum(['principiante','intermedio','avanzado','experto']).optional(),
  city: z.string().optional(),
})

usersRouter.get('/', validate(filterSchema, 'query'), async (req, res, next) => {
  try {
    const { sport, level, city } = req.validatedQuery
    const conditions = []
    const params = []
    if (sport) { params.push(sport); conditions.push(`main_sport = $${params.length}`) }
    if (level) { params.push(level); conditions.push(`level = $${params.length}`) }
    if (city)  { params.push(city);  conditions.push(`city ILIKE $${params.length}`) }
    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''
    const { rows } = await pool.query(
      `SELECT * FROM users ${where} ORDER BY created_at DESC LIMIT 50`,
      params
    )
    res.json({ users: rows.map(publicCard) })
  } catch (err) {
    next(err)
  }
})

// ─── GET /api/users/:username ─────────────────────────────
usersRouter.get('/:username', async (req, res, next) => {
  try {
    const { rows } = await pool.query('SELECT * FROM users WHERE username = $1', [req.params.username])
    if (!rows[0]) throw new AppError(404, 'Usuario no encontrado', 'NOT_FOUND')
    res.json({ user: publicCard(rows[0]) })
  } catch (err) {
    next(err)
  }
})

// ─── PATCH /api/users/me ──────────────────────────────────
const updateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  city: z.string().min(1).max(100).optional(),
  mainSport: z.enum(['futbol','padel','baloncesto','running','tenis','ciclismo','fitness','senderismo']).optional(),
  level: z.enum(['principiante','intermedio','avanzado','experto']).optional(),
  bio: z.string().max(500).optional(),
})

usersRouter.patch('/me', requireAuth, validate(updateSchema), async (req, res, next) => {
  try {
    // Mapeo camelCase (API) -> snake_case (DB)
    const map = { name: 'name', city: 'city', mainSport: 'main_sport', level: 'level', bio: 'bio' }
    const sets = []
    const params = []
    for (const [key, col] of Object.entries(map)) {
      if (req.body[key] !== undefined) {
        params.push(req.body[key])
        sets.push(`${col} = $${params.length}`)
      }
    }
    if (!sets.length) {
      // Nada que actualizar: devolvemos el usuario tal cual
      const { rows } = await pool.query('SELECT * FROM users WHERE id = $1', [req.userId])
      return res.json({ user: privateProfile(rows[0]) })
    }
    params.push(req.userId)
    const { rows } = await pool.query(
      `UPDATE users SET ${sets.join(', ')} WHERE id = $${params.length} RETURNING *`,
      params
    )
    res.json({ user: privateProfile(rows[0]) })
  } catch (err) {
    next(err)
  }
})

// ─── GET /api/users/me/meetups ────────────────────────────
// Devuelve quedadas creadas + quedadas a las que el usuario se ha unido
usersRouter.get('/me/meetups', requireAuth, async (req, res, next) => {
  try {
    const { rows: created } = await pool.query(`
      SELECT m.*, (SELECT COUNT(*)::int FROM meetup_participants p WHERE p.meetup_id = m.id) AS current_players
      FROM meetups m WHERE m.creator_id = $1 ORDER BY m.meetup_date DESC`, [req.userId])
    const { rows: joined } = await pool.query(`
      SELECT m.*, (SELECT COUNT(*)::int FROM meetup_participants p WHERE p.meetup_id = m.id) AS current_players
      FROM meetups m
      JOIN meetup_participants mp ON mp.meetup_id = m.id
      WHERE mp.user_id = $1 AND m.creator_id != $1
      ORDER BY m.meetup_date DESC`, [req.userId])
    res.json({ created, joined })
  } catch (e) { next(e) }
})

// ─── POST /api/users/me/avatar ────────────────────────────
// Sube una imagen a Cloudinary y guarda la URL en users.avatar_url
usersRouter.post('/me/avatar', requireAuth, upload.single('avatar'), async (req, res, next) => {
  try {
    if (!req.file) throw new AppError(400, 'Falta el archivo "avatar"', 'NO_FILE')
    const url = await uploadBuffer(req.file.buffer, 'sportmatch/avatars')
    await pool.query('UPDATE users SET avatar_url = $1 WHERE id = $2', [url, req.userId])
    res.json({ url })
  } catch (err) {
    next(err)
  }
})
