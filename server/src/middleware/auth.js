// server/src/middleware/auth.js
// Verifica JWT desde la cookie 'token'
import jwt from 'jsonwebtoken'
import { config } from '../config.js'
import { pool } from '../db.js'
import { AppError } from './errorHandler.js'

export function requireAuth(req, res, next) {
  const token = req.cookies?.token
  if (!token) return next(new AppError(401, 'No autenticado', 'NO_AUTH'))
  try {
    const payload = jwt.verify(token, config.jwtSecret)
    req.userId = payload.userId
    next()
  } catch {
    next(new AppError(401, 'Token inválido', 'BAD_TOKEN'))
  }
}

// Verifica que el usuario sea admin (carga la fila users y comprueba is_admin)
export function requireAdmin(req, res, next) {
  requireAuth(req, res, async (err) => {
    if (err) return next(err)
    try {
      const { rows } = await pool.query('SELECT is_admin FROM users WHERE id = $1', [req.userId])
      if (!rows[0] || !rows[0].is_admin) {
        return next(new AppError(403, 'Acceso solo para administradores', 'NOT_ADMIN'))
      }
      next()
    } catch (e) { next(e) }
  })
}

// Variante: no falla si no hay token, solo no setea req.userId
export function optionalAuth(req, res, next) {
  const token = req.cookies?.token
  if (!token) return next()
  try {
    const payload = jwt.verify(token, config.jwtSecret)
    req.userId = payload.userId
  } catch { /* token inválido, lo ignoramos en este middleware */ }
  next()
}
