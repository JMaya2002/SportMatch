// server/src/index.js
import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import { pathToFileURL } from 'node:url'
import { config } from './config.js'
import { pool } from './db.js'
import { errorHandler } from './middleware/errorHandler.js'
import { authRouter } from './routes/auth.js'
import { usersRouter } from './routes/users.js'
import { meetupsRouter } from './routes/meetups.js'
import { clubsRouter, courtsRouter } from './routes/clubs.js'
import { bookingsRouter } from './routes/bookings.js'
import { adminRouter } from './routes/admin.js'
import { clubVenuesRouter, venuesRouter, courtsAdminRouter } from './routes/venues.js'
import { friendshipsRouter } from './routes/friendships.js'
import { statsRouter } from './routes/stats.js'
import { passport } from './passport.js'
import { stripe } from './stripe.js'

export function createApp() {
  const app = express()

  app.use(cors({ origin: config.clientUrl, credentials: true }))

  // ── Webhook de Stripe: necesita raw body, mount ANTES de express.json() ──
  app.post('/api/stripe/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
    if (!stripe || !config.stripe.webhookSecret) {
      return res.status(503).json({ error: 'Stripe no configurado' })
    }
    let event
    try {
      event = stripe.webhooks.constructEvent(
        req.body,
        req.headers['stripe-signature'],
        config.stripe.webhookSecret
      )
    } catch (err) {
      console.error('[webhook] firma inválida:', err.message)
      return res.status(400).send(`Webhook Error: ${err.message}`)
    }
    if (event.type === 'checkout.session.completed') {
      const bookingId = Number(event.data.object.metadata?.bookingId)
      if (bookingId) {
        await pool.query("UPDATE bookings SET status = 'paid' WHERE id = $1", [bookingId])
      }
    }
    res.json({ received: true })
  })

  app.use(express.json())
  app.use(cookieParser())
  app.use(passport.initialize())

  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok' })
  })

  app.use('/api/auth', authRouter)
  app.use('/api/users', usersRouter)
  app.use('/api/meetups', meetupsRouter)
  app.use('/api/clubs', clubsRouter)
  app.use('/api/courts', courtsRouter)
  app.use('/api/bookings', bookingsRouter)
  app.use('/api/admin', adminRouter)
  app.use('/api/clubs/:id/venues', clubVenuesRouter)
  app.use('/api/venues', venuesRouter)
  app.use('/api/courts', courtsAdminRouter)
  app.use('/api/users', friendshipsRouter)
  app.use('/api/stats', statsRouter)

  app.use(errorHandler)
  return app
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const app = createApp()
  app.listen(config.port, () => {
    console.log(`Servidor escuchando en http://localhost:${config.port}`)
  })
}
