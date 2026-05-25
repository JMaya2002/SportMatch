import express from 'express'
import { z } from 'zod'
import { pool } from '../db.js'
import { validate } from '../middleware/validate.js'
import { requireAuth } from '../middleware/auth.js'
import { AppError } from '../middleware/errorHandler.js'
import { config } from '../config.js'
import { stripe } from '../stripe.js'

export const bookingsRouter = express.Router()

const createSchema = z.object({
  courtId: z.coerce.number().int().positive(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato YYYY-MM-DD'),
  startHour: z.coerce.number().int().min(0).max(23),
  endHour: z.coerce.number().int().min(1).max(24),
})

// ── POST /api/bookings ──
bookingsRouter.post('/', requireAuth, validate(createSchema), async (req, res, next) => {
  const client = await pool.connect()
  try {
    const { courtId, date, startHour, endHour } = req.body
    if (endHour <= startHour) throw new AppError(400, 'endHour debe ser mayor que startHour', 'BAD_RANGE')

    await client.query('BEGIN')

    // Comprueba pista y horario
    const { rows: courts } = await client.query('SELECT * FROM courts WHERE id = $1', [courtId])
    if (!courts[0]) throw new AppError(404, 'Pista no encontrada', 'NOT_FOUND')
    const court = courts[0]
    if (startHour < court.opening_hour || endHour > court.closing_hour) {
      throw new AppError(400, 'Fuera del horario de la pista', 'OUT_OF_HOURS')
    }

    // Comprueba solape con otras reservas activas
    const { rows: clash } = await client.query(
      `SELECT 1 FROM bookings
       WHERE court_id = $1 AND booking_date = $2 AND status != 'cancelled'
         AND start_hour < $4 AND end_hour > $3
       LIMIT 1`,
      [courtId, date, startHour, endHour])
    if (clash[0]) throw new AppError(409, 'Slot ya reservado', 'SLOT_TAKEN')

    const hours = endHour - startHour
    const total = Number(court.price_per_hour) * hours
    const fee = Math.round(total * config.platformFeePercent) / 100
    const payout = Math.round((total - fee) * 100) / 100

    const ins = await client.query(
      `INSERT INTO bookings (court_id, user_id, booking_date, start_hour, end_hour, total_price, platform_fee, club_payout, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,'pending') RETURNING id`,
      [courtId, req.userId, date, startHour, endHour, total, fee, payout])
    const bookingId = ins.rows[0].id

    let checkoutUrl
    if (stripe) {
      const session = await stripe.checkout.sessions.create({
        mode: 'payment',
        line_items: [{
          price_data: {
            currency: 'eur',
            unit_amount: Math.round(total * 100),
            product_data: { name: `${court.name} · ${startHour}-${endHour}h · ${date}` },
          },
          quantity: 1,
        }],
        success_url: `${config.clientUrl}/#/booking/${bookingId}/success`,
        cancel_url:  `${config.clientUrl}/#/booking/${bookingId}/cancel`,
        metadata: { bookingId: String(bookingId) },
      })
      await client.query('UPDATE bookings SET stripe_session_id = $1 WHERE id = $2', [session.id, bookingId])
      checkoutUrl = session.url
    } else {
      // Modo dev sin Stripe: marcamos como paid directamente (demo)
      await client.query("UPDATE bookings SET status = 'paid' WHERE id = $1", [bookingId])
      checkoutUrl = `${config.clientUrl}/#/booking/${bookingId}/success`
    }

    await client.query('COMMIT')
    res.status(201).json({ bookingId, checkoutUrl, total, fee, payout })
  } catch (e) {
    await client.query('ROLLBACK').catch(() => {})
    next(e)
  } finally {
    client.release()
  }
})

// ── GET /api/bookings/me ──
bookingsRouter.get('/me', requireAuth, async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      `SELECT b.*, c.name AS court_name, c.sport, cl.name AS club_name, cl.city
       FROM bookings b
       JOIN courts c ON c.id = b.court_id
       JOIN clubs cl ON cl.id = c.club_id
       WHERE b.user_id = $1
       ORDER BY b.booking_date DESC, b.start_hour DESC`,
      [req.userId])
    res.json({ bookings: rows.map(r => ({ ...r, total_price: Number(r.total_price), platform_fee: Number(r.platform_fee), club_payout: Number(r.club_payout) })) })
  } catch (e) { next(e) }
})

// ── GET /api/bookings/:id ──
bookingsRouter.get('/:id', requireAuth, async (req, res, next) => {
  try {
    const id = Number(req.params.id)
    if (!Number.isInteger(id)) throw new AppError(400, 'ID inválido', 'BAD_ID')
    const { rows } = await pool.query(
      `SELECT b.*, c.name AS court_name, c.sport, cl.name AS club_name, cl.city
       FROM bookings b
       JOIN courts c ON c.id = b.court_id
       JOIN clubs cl ON cl.id = c.club_id
       WHERE b.id = $1 AND b.user_id = $2`,
      [id, req.userId])
    if (!rows[0]) throw new AppError(404, 'Reserva no encontrada', 'NOT_FOUND')
    const r = rows[0]
    res.json({ booking: { ...r, total_price: Number(r.total_price), platform_fee: Number(r.platform_fee), club_payout: Number(r.club_payout) } })
  } catch (e) { next(e) }
})
