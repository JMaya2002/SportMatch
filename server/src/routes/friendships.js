// server/src/routes/friendships.js
// Sistema de amistades sencillo.
//   friendships(requester_id, receiver_id, status='pending'|'accepted')
//
// Estado de la amistad para un viewer respecto a otro usuario:
//   'none'     → sin relación
//   'sent'     → viewer envió la solicitud
//   'received' → viewer recibió la solicitud
//   'friends'  → aceptada

import express from 'express'
import { pool } from '../db.js'
import { requireAuth } from '../middleware/auth.js'
import { AppError } from '../middleware/errorHandler.js'

export const friendshipsRouter = express.Router()

// Helper: estado entre dos usuarios desde la perspectiva de "viewer"
async function getStatus(viewerId, otherId) {
  if (viewerId === otherId) return 'self'
  const { rows } = await pool.query(`
    SELECT requester_id, receiver_id, status FROM friendships
    WHERE (requester_id = $1 AND receiver_id = $2) OR (requester_id = $2 AND receiver_id = $1)
    LIMIT 1`, [viewerId, otherId])
  if (!rows[0]) return 'none'
  const f = rows[0]
  if (f.status === 'accepted') return 'friends'
  return f.requester_id === viewerId ? 'sent' : 'received'
}

// ── GET /api/users/me/friends ──
// Devuelve {friends, sent, received}
friendshipsRouter.get('/me/friends', requireAuth, async (req, res, next) => {
  try {
    const me = req.userId
    const { rows: friends } = await pool.query(`
      SELECT u.id, u.username, u.name, u.avatar_url, u.city, u.main_sport, u.level
      FROM users u JOIN friendships f
        ON ((f.requester_id = u.id AND f.receiver_id = $1)
         OR (f.receiver_id  = u.id AND f.requester_id = $1))
      WHERE f.status = 'accepted'
      ORDER BY u.username ASC`, [me])
    const { rows: received } = await pool.query(`
      SELECT u.id, u.username, u.name, u.avatar_url, u.city
      FROM users u JOIN friendships f ON f.requester_id = u.id
      WHERE f.receiver_id = $1 AND f.status = 'pending'`, [me])
    const { rows: sent } = await pool.query(`
      SELECT u.id, u.username, u.name, u.avatar_url, u.city
      FROM users u JOIN friendships f ON f.receiver_id = u.id
      WHERE f.requester_id = $1 AND f.status = 'pending'`, [me])
    res.json({ friends, received, sent })
  } catch (e) { next(e) }
})

// ── GET /api/users/:id/friendship ── (estado relativo al viewer)
friendshipsRouter.get('/:id/friendship', requireAuth, async (req, res, next) => {
  try {
    const otherId = Number(req.params.id)
    if (!Number.isInteger(otherId)) throw new AppError(400, 'ID inválido', 'BAD_ID')
    res.json({ status: await getStatus(req.userId, otherId) })
  } catch (e) { next(e) }
})

// ── POST /api/users/:id/friend-request ──
friendshipsRouter.post('/:id/friend-request', requireAuth, async (req, res, next) => {
  try {
    const otherId = Number(req.params.id)
    if (!Number.isInteger(otherId)) throw new AppError(400, 'ID inválido', 'BAD_ID')
    if (otherId === req.userId) throw new AppError(400, 'No puedes mandarte una solicitud a ti mismo', 'SELF')
    const { rows: u } = await pool.query('SELECT 1 FROM users WHERE id = $1', [otherId])
    if (!u[0]) throw new AppError(404, 'Usuario no encontrado', 'NOT_FOUND')
    // Si ya hay relación en cualquier dirección, no hacemos nada nuevo
    const current = await getStatus(req.userId, otherId)
    if (current === 'friends')  throw new AppError(409, 'Ya sois amigos', 'ALREADY_FRIENDS')
    if (current === 'sent')     throw new AppError(409, 'Ya enviaste una solicitud', 'ALREADY_SENT')
    if (current === 'received') throw new AppError(409, 'Esta persona ya te envió una solicitud', 'ALREADY_RECEIVED')
    await pool.query(
      `INSERT INTO friendships (requester_id, receiver_id, status) VALUES ($1, $2, 'pending')`,
      [req.userId, otherId])
    res.status(201).json({ status: 'sent' })
  } catch (e) { next(e) }
})

// ── POST /api/users/:id/friend-accept ──
// Acepta una solicitud pendiente que viene del usuario :id
friendshipsRouter.post('/:id/friend-accept', requireAuth, async (req, res, next) => {
  try {
    const otherId = Number(req.params.id)
    if (!Number.isInteger(otherId)) throw new AppError(400, 'ID inválido', 'BAD_ID')
    const r = await pool.query(
      `UPDATE friendships SET status = 'accepted'
       WHERE requester_id = $1 AND receiver_id = $2 AND status = 'pending'`,
      [otherId, req.userId])
    if (r.rowCount === 0) throw new AppError(404, 'No hay solicitud pendiente', 'NO_REQUEST')
    res.json({ status: 'friends' })
  } catch (e) { next(e) }
})

// ── DELETE /api/users/:id/friend ──
// Sirve para: rechazar solicitud recibida, cancelar solicitud enviada, eliminar amistad
friendshipsRouter.delete('/:id/friend', requireAuth, async (req, res, next) => {
  try {
    const otherId = Number(req.params.id)
    if (!Number.isInteger(otherId)) throw new AppError(400, 'ID inválido', 'BAD_ID')
    await pool.query(
      `DELETE FROM friendships
       WHERE (requester_id = $1 AND receiver_id = $2)
          OR (requester_id = $2 AND receiver_id = $1)`,
      [req.userId, otherId])
    res.status(204).end()
  } catch (e) { next(e) }
})
