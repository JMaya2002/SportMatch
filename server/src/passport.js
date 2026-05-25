// server/src/passport.js
// Configura las estrategias de Passport: Google OAuth
import passport from 'passport'
import { Strategy as GoogleStrategy } from 'passport-google-oauth20'
import { pool } from './db.js'
import { config } from './config.js'

// Solo registramos Google si hay credenciales (en tests pueden no estar)
if (config.google.clientId && config.google.clientSecret) {
  passport.use(new GoogleStrategy({
    clientID: config.google.clientId,
    clientSecret: config.google.clientSecret,
    callbackURL: config.google.callbackUrl,
  }, async (accessToken, refreshToken, profile, done) => {
    try {
      const googleId = profile.id
      const email = profile.emails?.[0]?.value
      const name = profile.displayName || 'Sin nombre'

      // 1. Busca por google_id (usuario que ya entró por Google antes)
      let { rows } = await pool.query('SELECT * FROM users WHERE google_id = $1', [googleId])
      if (rows[0]) return done(null, { user: rows[0], needsCompletion: false })

      // 2. Busca por email (usuario registrado por email, vinculamos Google)
      ;({ rows } = await pool.query('SELECT * FROM users WHERE email = $1', [email]))
      if (rows[0]) {
        await pool.query('UPDATE users SET google_id = $1 WHERE id = $2', [googleId, rows[0].id])
        return done(null, { user: rows[0], needsCompletion: false })
      }

      // 3. Usuario nuevo: necesita completar datos (username, edad, etc.)
      return done(null, { user: null, googleProfile: { googleId, email, name }, needsCompletion: true })
    } catch (err) {
      done(err)
    }
  }))
}

// No usamos sesiones de Passport (vamos con JWT), pero la librería las requiere
passport.serializeUser((data, done) => done(null, data))
passport.deserializeUser((data, done) => done(null, data))

export { passport }
