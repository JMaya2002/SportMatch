// server/src/routes/auth.js
import express from 'express'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import { z } from 'zod'
import { pool } from '../db.js'
import { config } from '../config.js'
import { validate } from '../middleware/validate.js'
import { AppError } from '../middleware/errorHandler.js'
import { requireAuth } from '../middleware/auth.js'
import { passport } from '../passport.js'

export const authRouter = express.Router()

// ─── Schemas zod ──────────────────────────────────────────
const registerSchema = z.object({
  username: z.string().min(3).max(30).regex(/^[a-z0-9_]+$/i, 'Solo letras, números y _'),
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(1).max(100),
  age: z.number().int().min(18, 'Debes ser mayor de 18'),
  city: z.string().min(1).max(100),
  mainSport: z.enum(['futbol','padel','baloncesto','running','tenis','ciclismo','fitness','senderismo']),
  level: z.enum(['principiante','intermedio','avanzado']),
  ageConfirmed: z.literal(true, { errorMap: () => ({ message: 'Debes confirmar que eres mayor de 18' }) }),
})

// ─── Helpers ──────────────────────────────────────────────
function issueToken(res, userId) {
  const token = jwt.sign({ userId }, config.jwtSecret, { expiresIn: '7d' })
  res.cookie('token', token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: config.nodeEnv === 'production',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  })
}

function publicUser(row) {
  if (!row) return null
  const { password_hash, google_id, ...rest } = row
  return rest
}

// ─── POST /api/auth/register ──────────────────────────────
authRouter.post('/register', validate(registerSchema), async (req, res, next) => {
  try {
    const { username, email, password, name, age, city, mainSport, level, ageConfirmed } = req.body
    const hash = await bcrypt.hash(password, 10)
    const result = await pool.query(
      `INSERT INTO users (username, email, password_hash, name, age, city, main_sport, level, age_confirmed)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
      [username, email, hash, name, age, city, mainSport, level, ageConfirmed]
    )
    issueToken(res, result.rows[0].id)
    res.status(201).json({ user: publicUser(result.rows[0]) })
  } catch (err) {
    next(err)
  }
})

// ─── POST /api/auth/login ─────────────────────────────────
const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

authRouter.post('/login', validate(loginSchema), async (req, res, next) => {
  try {
    const { email, password } = req.body
    const { rows } = await pool.query('SELECT * FROM users WHERE email = $1', [email])
    const user = rows[0]
    // Mensaje neutro tanto si el usuario no existe como si la contraseña falla
    // (evita revelar qué emails están registrados)
    if (!user || !user.password_hash) {
      throw new AppError(401, 'Credenciales inválidas', 'BAD_CREDENTIALS')
    }
    const ok = await bcrypt.compare(password, user.password_hash)
    if (!ok) {
      throw new AppError(401, 'Credenciales inválidas', 'BAD_CREDENTIALS')
    }
    issueToken(res, user.id)
    res.json({ user: publicUser(user) })
  } catch (err) {
    next(err)
  }
})

// ─── GET /api/auth/me ─────────────────────────────────────
authRouter.get('/me', requireAuth, async (req, res, next) => {
  try {
    const { rows } = await pool.query('SELECT * FROM users WHERE id = $1', [req.userId])
    if (!rows[0]) throw new AppError(404, 'Usuario no encontrado', 'NOT_FOUND')
    res.json({ user: publicUser(rows[0]) })
  } catch (err) {
    next(err)
  }
})

// ─── POST /api/auth/logout ────────────────────────────────
authRouter.post('/logout', (req, res) => {
  res.clearCookie('token')
  res.status(204).end()
})

// ─── GET /api/auth/google ─────────────────────────────────
// Redirige al usuario a la pantalla de consentimiento de Google
authRouter.get('/google', passport.authenticate('google', {
  scope: ['profile', 'email'],
  session: false,
}))

// ─── GET /api/auth/google/callback ────────────────────────
// Google vuelve aquí tras autenticar. Tres caminos:
//  - Usuario existente -> JWT en cookie y redirect a /
//  - Usuario nuevo     -> redirect a /register/complete con sus datos
//  - Error             -> redirect a /login?error=google
authRouter.get('/google/callback',
  passport.authenticate('google', {
    session: false,
    failureRedirect: `${config.clientUrl}/#/login?error=google`,
  }),
  (req, res) => {
    const { user, googleProfile, needsCompletion } = req.user
    if (needsCompletion) {
      const params = new URLSearchParams(googleProfile).toString()
      return res.redirect(`${config.clientUrl}/#/register/complete?${params}`)
    }
    issueToken(res, user.id)
    res.redirect(config.clientUrl)
  }
)

// ─── POST /api/auth/register/complete ─────────────────────
// Tras Google, cuando faltan datos del perfil (username, edad, etc.)
const completeSchema = z.object({
  googleId: z.string().min(1),
  email: z.string().email(),
  name: z.string().min(1).max(100),
  username: z.string().min(3).max(30).regex(/^[a-z0-9_]+$/i, 'Solo letras, números y _'),
  age: z.number().int().min(18, 'Debes ser mayor de 18'),
  city: z.string().min(1).max(100),
  mainSport: z.enum(['futbol','padel','baloncesto','running','tenis','ciclismo','fitness','senderismo']),
  level: z.enum(['principiante','intermedio','avanzado']),
  ageConfirmed: z.literal(true, { errorMap: () => ({ message: 'Debes confirmar que eres mayor de 18' }) }),
})

authRouter.post('/register/complete', validate(completeSchema), async (req, res, next) => {
  try {
    const { googleId, email, name, username, age, city, mainSport, level, ageConfirmed } = req.body
    const result = await pool.query(
      `INSERT INTO users (username, email, google_id, name, age, city, main_sport, level, age_confirmed)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
      [username, email, googleId, name, age, city, mainSport, level, ageConfirmed]
    )
    issueToken(res, result.rows[0].id)
    res.status(201).json({ user: publicUser(result.rows[0]) })
  } catch (err) {
    next(err)
  }
})
