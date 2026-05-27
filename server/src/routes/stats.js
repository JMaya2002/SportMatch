import express from 'express'
import { pool } from '../db.js'

export const statsRouter = express.Router()

statsRouter.get('/', async (req, res, next) => {
  try {
    const { rows } = await pool.query(`
      SELECT
        -- Jugadores activos: registrados en 90 días o con actividad en meetups en 30 días
        (SELECT COUNT(DISTINCT u.id)::int FROM users u
         WHERE u.created_at > NOW() - INTERVAL '90 days'
            OR u.id IN (
              SELECT user_id FROM meetup_participants
              WHERE joined_at > NOW() - INTERVAL '30 days'
            )
        ) AS active_players,

        -- Total clubes
        (SELECT COUNT(*)::int FROM clubs) AS clubs_count,

        -- Quedadas de la semana actual (no canceladas)
        (SELECT COUNT(*)::int FROM meetups
         WHERE meetup_date >= date_trunc('week', NOW())
           AND meetup_date < date_trunc('week', NOW()) + INTERVAL '7 days'
           AND status != 'cancelled'
        ) AS meetups_this_week
    `)
    res.json(rows[0])
  } catch (e) { next(e) }
})
