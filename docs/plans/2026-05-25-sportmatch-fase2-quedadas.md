# SportMatch — Fase 2: Quedadas

**Objetivo:** Implementar el sistema de quedadas deportivas. Los usuarios pueden crear quedadas (deporte/nivel/ciudad/fecha/plazas), listarlas con filtros, unirse o salirse, y verlas en un detalle con la lista de participantes.

**Arquitectura:** Dos tablas nuevas (`meetups` y `meetup_participants`) con relaciones. Endpoints REST protegidos por `requireAuth` donde corresponde. Conexión del frontend (`Meetups.jsx`, `MeetupDetail.jsx`, `CreateMeetup.jsx`) al backend real sustituyendo los mocks.

**Stack:** sin nuevas dependencias — reutiliza `pg`, `zod`, `Vitest`, `supertest`.

**Referencia:** `docs/specs/2026-05-25-sportmatch-design.md` (sección 4 y 5)

---

## Estructura de archivos

```
server/
├── src/
│   ├── db/
│   │   ├── schema.sql           # AÑADIR meetups + meetup_participants
│   │   └── seed.sql             # AÑADIR quedadas de prueba
│   └── routes/
│       └── meetups.js           # CREAR endpoints CRUD
├── tests/
│   └── meetups.test.js          # CREAR tests TDD
client/
├── src/
│   └── api/
│       └── real.js              # MODIFICAR: implementar meetups con fetch
```

---

## Task 1: Schema y seed de quedadas

**Files:**
- Modify: `server/src/db/schema.sql`
- Modify: `server/src/db/seed.sql`

- [ ] **Step 1: Añadir tablas a `schema.sql`** después del `CREATE TABLE users`:

```sql
DROP TABLE IF EXISTS meetup_participants CASCADE;
DROP TABLE IF EXISTS meetups CASCADE;

CREATE TABLE meetups (
  id            SERIAL PRIMARY KEY,
  creator_id    INTEGER REFERENCES users(id) ON DELETE CASCADE,
  title         VARCHAR(200) NOT NULL,
  description   TEXT,
  sport         VARCHAR(50) NOT NULL,
  level         VARCHAR(20) NOT NULL CHECK (level IN ('principiante','intermedio','avanzado')),
  city          VARCHAR(100) NOT NULL,
  location      VARCHAR(255),
  meetup_date   TIMESTAMP NOT NULL,
  max_players   INTEGER NOT NULL CHECK (max_players >= 2),
  status        VARCHAR(20) NOT NULL DEFAULT 'open' CHECK (status IN ('open','full','cancelled')),
  created_at    TIMESTAMP DEFAULT NOW()
);

CREATE TABLE meetup_participants (
  meetup_id   INTEGER REFERENCES meetups(id) ON DELETE CASCADE,
  user_id     INTEGER REFERENCES users(id) ON DELETE CASCADE,
  joined_at   TIMESTAMP DEFAULT NOW(),
  PRIMARY KEY (meetup_id, user_id)
);

CREATE INDEX idx_meetups_filters ON meetups (sport, level, city, status);
CREATE INDEX idx_meetups_date    ON meetups (meetup_date);
```

> Nota: en `DROP TABLE IF EXISTS users CASCADE` ya cae todo lo que dependa de users, pero los DROP explícitos hacen el script más legible.

- [ ] **Step 2: Añadir quedadas a `seed.sql`** al final del archivo:

```sql
-- ============================================
-- QUEDADAS DE PRUEBA
-- ============================================
INSERT INTO meetups (creator_id, title, description, sport, level, city, location, meetup_date, max_players)
VALUES
  (1, 'Partido de pádel — domingo mañana',
   'Buscamos 2 jugadores nivel intermedio para partido amistoso. Llevamos pelotas.',
   'padel', 'intermedio', 'Barcelona', 'Club Pádel Sant Cugat',
   NOW() + INTERVAL '5 days' + INTERVAL '10 hours', 4),
  (3, 'Fútbol 7 los miércoles',
   'Partido semanal. Faltan jugadores para esta semana. Llevamos petos.',
   'futbol', 'intermedio', 'Madrid', 'Campo municipal de Carabanchel',
   NOW() + INTERVAL '2 days' + INTERVAL '19 hours', 14),
  (4, 'Carrera 5K — Domingo del Turia',
   'Trote suave de 5K por el cauce. Ritmo cómodo (~6:30 min/km). Cualquier nivel bienvenido.',
   'running', 'principiante', 'Valencia', 'Jardín del Turia',
   NOW() + INTERVAL '6 days' + INTERVAL '9 hours', 20);

-- El creador es automáticamente participante
INSERT INTO meetup_participants (meetup_id, user_id) VALUES (1, 1), (2, 3), (3, 4);
```

- [ ] **Step 3: Recargar la DB**

```bash
cd server
node scripts/setup-db.mjs --seed    # MAIN DB
node scripts/setup-db.mjs --test    # TEST DB (schema only)
```

Expected: "Conectado a MAIN DB / Schema cargado / Datos seed insertados / Listo".

---

## Task 2: Tests TDD de endpoints de quedadas

**Files:**
- Create: `server/tests/meetups.test.js`

- [ ] **Step 1: Crear el archivo de tests**

```js
// server/tests/meetups.test.js
import { describe, it, expect } from 'vitest'
import request from 'supertest'
import { createApp } from '../src/index.js'
import { createTestUser } from './helpers.js'

async function loginAs(app, user) {
  const res = await request(app).post('/api/auth/login').send({
    email: user.email,
    password: user.plainPassword,
  })
  return res.headers['set-cookie']
}

const validMeetup = {
  title: 'Partido de prueba',
  description: 'Descripción',
  sport: 'padel',
  level: 'intermedio',
  city: 'Barcelona',
  location: 'Club X',
  meetup_date: '2027-06-01T18:00:00',
  max_players: 4,
}

describe('POST /api/meetups', () => {
  it('crea quedada y añade al creador como participante', async () => {
    const user = await createTestUser({ username: 'c1', email: 'c1@t.com' })
    const app = createApp()
    const cookie = await loginAs(app, user)
    const res = await request(app).post('/api/meetups').set('Cookie', cookie).send(validMeetup)
    expect(res.status).toBe(201)
    expect(res.body.meetup.title).toBe('Partido de prueba')
    expect(res.body.meetup.creator_id).toBe(user.id)
    expect(res.body.meetup.current_players).toBe(1)
  })

  it('sin auth devuelve 401', async () => {
    const app = createApp()
    const res = await request(app).post('/api/meetups').send(validMeetup)
    expect(res.status).toBe(401)
  })

  it('rechaza max_players < 2', async () => {
    const user = await createTestUser({ username: 'c2', email: 'c2@t.com' })
    const app = createApp()
    const cookie = await loginAs(app, user)
    const res = await request(app).post('/api/meetups').set('Cookie', cookie).send({ ...validMeetup, max_players: 1 })
    expect(res.status).toBe(400)
  })
})

describe('GET /api/meetups', () => {
  it('lista quedadas con creador y participantes', async () => {
    const user = await createTestUser({ username: 'g1', email: 'g1@t.com' })
    const app = createApp()
    const cookie = await loginAs(app, user)
    await request(app).post('/api/meetups').set('Cookie', cookie).send(validMeetup)
    const res = await request(app).get('/api/meetups')
    expect(res.status).toBe(200)
    expect(res.body.meetups).toHaveLength(1)
    expect(res.body.meetups[0].creator.username).toBe('g1')
    expect(res.body.meetups[0].current_players).toBe(1)
  })

  it('filtra por deporte y ciudad', async () => {
    const u1 = await createTestUser({ username: 'f1', email: 'f1@t.com' })
    const app = createApp()
    const c1 = await loginAs(app, u1)
    await request(app).post('/api/meetups').set('Cookie', c1).send({ ...validMeetup, sport: 'padel', city: 'Barcelona' })
    await request(app).post('/api/meetups').set('Cookie', c1).send({ ...validMeetup, sport: 'tenis', city: 'Madrid' })
    const res = await request(app).get('/api/meetups?sport=padel&city=Barcelona')
    expect(res.body.meetups).toHaveLength(1)
    expect(res.body.meetups[0].sport).toBe('padel')
  })
})

describe('GET /api/meetups/:id', () => {
  it('devuelve detalle con lista de participantes', async () => {
    const user = await createTestUser({ username: 'd1', email: 'd1@t.com' })
    const app = createApp()
    const cookie = await loginAs(app, user)
    const created = await request(app).post('/api/meetups').set('Cookie', cookie).send(validMeetup)
    const res = await request(app).get(`/api/meetups/${created.body.meetup.id}`)
    expect(res.status).toBe(200)
    expect(res.body.meetup.participants).toHaveLength(1)
    expect(res.body.meetup.participants[0].username).toBe('d1')
  })

  it('404 si no existe', async () => {
    const app = createApp()
    const res = await request(app).get('/api/meetups/9999')
    expect(res.status).toBe(404)
  })
})

describe('POST /api/meetups/:id/join', () => {
  it('un segundo usuario se une', async () => {
    const creator = await createTestUser({ username: 'j1', email: 'j1@t.com' })
    const joiner = await createTestUser({ username: 'j2', email: 'j2@t.com' })
    const app = createApp()
    const cookie1 = await loginAs(app, creator)
    const created = await request(app).post('/api/meetups').set('Cookie', cookie1).send(validMeetup)
    const cookie2 = await loginAs(app, joiner)
    const res = await request(app).post(`/api/meetups/${created.body.meetup.id}/join`).set('Cookie', cookie2)
    expect(res.status).toBe(204)
    const detail = await request(app).get(`/api/meetups/${created.body.meetup.id}`)
    expect(detail.body.meetup.participants).toHaveLength(2)
  })

  it('unirse dos veces no duplica', async () => {
    const creator = await createTestUser({ username: 'k1', email: 'k1@t.com' })
    const app = createApp()
    const cookie = await loginAs(app, creator)
    const created = await request(app).post('/api/meetups').set('Cookie', cookie).send(validMeetup)
    // El creador ya está dentro. Si intenta unirse otra vez, no rompe.
    const res = await request(app).post(`/api/meetups/${created.body.meetup.id}/join`).set('Cookie', cookie)
    expect([204, 409]).toContain(res.status)
    const detail = await request(app).get(`/api/meetups/${created.body.meetup.id}`)
    expect(detail.body.meetup.participants).toHaveLength(1)
  })

  it('quedada llena devuelve 409', async () => {
    const creator = await createTestUser({ username: 'l1', email: 'l1@t.com' })
    const joiner = await createTestUser({ username: 'l2', email: 'l2@t.com' })
    const app = createApp()
    const c1 = await loginAs(app, creator)
    const created = await request(app).post('/api/meetups').set('Cookie', c1).send({ ...validMeetup, max_players: 2 })
    const c2 = await loginAs(app, joiner)
    await request(app).post(`/api/meetups/${created.body.meetup.id}/join`).set('Cookie', c2)
    // Tercer usuario intenta unirse a una quedada de 2 que ya tiene 2
    const third = await createTestUser({ username: 'l3', email: 'l3@t.com' })
    const c3 = await loginAs(app, third)
    const res = await request(app).post(`/api/meetups/${created.body.meetup.id}/join`).set('Cookie', c3)
    expect(res.status).toBe(409)
  })
})

describe('DELETE /api/meetups/:id/join', () => {
  it('un participante se sale', async () => {
    const creator = await createTestUser({ username: 's1', email: 's1@t.com' })
    const joiner = await createTestUser({ username: 's2', email: 's2@t.com' })
    const app = createApp()
    const c1 = await loginAs(app, creator)
    const created = await request(app).post('/api/meetups').set('Cookie', c1).send(validMeetup)
    const c2 = await loginAs(app, joiner)
    await request(app).post(`/api/meetups/${created.body.meetup.id}/join`).set('Cookie', c2)
    const res = await request(app).delete(`/api/meetups/${created.body.meetup.id}/join`).set('Cookie', c2)
    expect(res.status).toBe(204)
    const detail = await request(app).get(`/api/meetups/${created.body.meetup.id}`)
    expect(detail.body.meetup.participants).toHaveLength(1)
  })
})

describe('DELETE /api/meetups/:id', () => {
  it('solo el creador puede borrar su quedada', async () => {
    const creator = await createTestUser({ username: 'del1', email: 'del1@t.com' })
    const other   = await createTestUser({ username: 'del2', email: 'del2@t.com' })
    const app = createApp()
    const c1 = await loginAs(app, creator)
    const created = await request(app).post('/api/meetups').set('Cookie', c1).send(validMeetup)
    const c2 = await loginAs(app, other)
    const forbidden = await request(app).delete(`/api/meetups/${created.body.meetup.id}`).set('Cookie', c2)
    expect(forbidden.status).toBe(403)
    const ok = await request(app).delete(`/api/meetups/${created.body.meetup.id}`).set('Cookie', c1)
    expect(ok.status).toBe(204)
  })
})
```

- [ ] **Step 2: Correr tests, deben fallar todos**

```
npm test
```
Expected: ~10 tests nuevos fallando (404 porque no existen las rutas).

---

## Task 3: Implementar router de quedadas

**Files:**
- Create: `server/src/routes/meetups.js`
- Modify: `server/src/index.js`

- [ ] **Step 1: Crear `server/src/routes/meetups.js`**

```js
// server/src/routes/meetups.js
import express from 'express'
import { z } from 'zod'
import { pool } from '../db.js'
import { validate } from '../middleware/validate.js'
import { requireAuth } from '../middleware/auth.js'
import { AppError } from '../middleware/errorHandler.js'

export const meetupsRouter = express.Router()

// Helper: dado un row de meetup + creador + count de participantes,
// monta el objeto que devolvemos al cliente.
function shapeMeetup(row) {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    sport: row.sport,
    level: row.level,
    city: row.city,
    location: row.location,
    meetup_date: row.meetup_date,
    max_players: row.max_players,
    current_players: Number(row.current_players ?? 0),
    status: row.status,
    creator_id: row.creator_id,
    creator: row.creator_username ? {
      id: row.creator_id,
      username: row.creator_username,
      name: row.creator_name,
      avatar_url: row.creator_avatar_url,
    } : null,
    created_at: row.created_at,
  }
}

// Query reutilizable: meetup + creador + count de participantes
const SELECT_MEETUP = `
  SELECT
    m.*,
    u.username  AS creator_username,
    u.name      AS creator_name,
    u.avatar_url AS creator_avatar_url,
    (SELECT COUNT(*) FROM meetup_participants p WHERE p.meetup_id = m.id) AS current_players
  FROM meetups m
  LEFT JOIN users u ON u.id = m.creator_id
`

// ─── GET /api/meetups ─────────────────────────────────────
const filterSchema = z.object({
  sport: z.string().optional(),
  level: z.enum(['principiante','intermedio','avanzado']).optional(),
  city: z.string().optional(),
})

meetupsRouter.get('/', validate(filterSchema, 'query'), async (req, res, next) => {
  try {
    const { sport, level, city } = req.validatedQuery
    const conditions = ["m.status != 'cancelled'"]
    const params = []
    if (sport) { params.push(sport); conditions.push(`m.sport = $${params.length}`) }
    if (level) { params.push(level); conditions.push(`m.level = $${params.length}`) }
    if (city)  { params.push(city);  conditions.push(`m.city ILIKE $${params.length}`) }
    const where = `WHERE ${conditions.join(' AND ')}`
    const { rows } = await pool.query(
      `${SELECT_MEETUP} ${where} ORDER BY m.meetup_date ASC LIMIT 100`,
      params
    )
    res.json({ meetups: rows.map(shapeMeetup) })
  } catch (err) { next(err) }
})

// ─── GET /api/meetups/:id ─────────────────────────────────
meetupsRouter.get('/:id', async (req, res, next) => {
  try {
    const id = Number(req.params.id)
    if (!Number.isInteger(id)) throw new AppError(400, 'ID inválido', 'BAD_ID')
    const { rows } = await pool.query(`${SELECT_MEETUP} WHERE m.id = $1`, [id])
    if (!rows[0]) throw new AppError(404, 'Quedada no encontrada', 'NOT_FOUND')
    const meetup = shapeMeetup(rows[0])
    const { rows: parts } = await pool.query(
      `SELECT u.id, u.username, u.name, u.avatar_url, u.city, p.joined_at
       FROM meetup_participants p JOIN users u ON u.id = p.user_id
       WHERE p.meetup_id = $1
       ORDER BY p.joined_at ASC`,
      [id]
    )
    meetup.participants = parts
    res.json({ meetup })
  } catch (err) { next(err) }
})

// ─── POST /api/meetups ────────────────────────────────────
const createSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().optional().default(''),
  sport: z.enum(['futbol','padel','baloncesto','running','tenis','ciclismo','fitness','senderismo']),
  level: z.enum(['principiante','intermedio','avanzado']),
  city: z.string().min(1).max(100),
  location: z.string().max(255).optional().default(''),
  meetup_date: z.string().min(1),
  max_players: z.coerce.number().int().min(2).max(50),
})

meetupsRouter.post('/', requireAuth, validate(createSchema), async (req, res, next) => {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    const { title, description, sport, level, city, location, meetup_date, max_players } = req.body
    const ins = await client.query(
      `INSERT INTO meetups (creator_id, title, description, sport, level, city, location, meetup_date, max_players)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING id`,
      [req.userId, title, description, sport, level, city, location, meetup_date, max_players]
    )
    const meetupId = ins.rows[0].id
    // El creador se auto-inscribe
    await client.query(
      `INSERT INTO meetup_participants (meetup_id, user_id) VALUES ($1, $2)`,
      [meetupId, req.userId]
    )
    await client.query('COMMIT')
    const { rows } = await pool.query(`${SELECT_MEETUP} WHERE m.id = $1`, [meetupId])
    res.status(201).json({ meetup: shapeMeetup(rows[0]) })
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {})
    next(err)
  } finally {
    client.release()
  }
})

// ─── POST /api/meetups/:id/join ───────────────────────────
meetupsRouter.post('/:id/join', requireAuth, async (req, res, next) => {
  try {
    const id = Number(req.params.id)
    if (!Number.isInteger(id)) throw new AppError(400, 'ID inválido', 'BAD_ID')
    // Comprueba existencia y capacidad
    const { rows } = await pool.query(
      `SELECT m.*, (SELECT COUNT(*) FROM meetup_participants p WHERE p.meetup_id = m.id) AS current_players
       FROM meetups m WHERE m.id = $1`,
      [id]
    )
    if (!rows[0]) throw new AppError(404, 'Quedada no encontrada', 'NOT_FOUND')
    if (rows[0].status === 'cancelled') throw new AppError(409, 'Quedada cancelada', 'CANCELLED')
    if (Number(rows[0].current_players) >= rows[0].max_players) {
      throw new AppError(409, 'Quedada completa', 'FULL')
    }
    // INSERT — la PK (meetup_id, user_id) evita duplicados (23505 -> 409 via errorHandler)
    await pool.query(
      `INSERT INTO meetup_participants (meetup_id, user_id) VALUES ($1, $2)`,
      [id, req.userId]
    )
    res.status(204).end()
  } catch (err) { next(err) }
})

// ─── DELETE /api/meetups/:id/join ─────────────────────────
meetupsRouter.delete('/:id/join', requireAuth, async (req, res, next) => {
  try {
    const id = Number(req.params.id)
    if (!Number.isInteger(id)) throw new AppError(400, 'ID inválido', 'BAD_ID')
    await pool.query(
      `DELETE FROM meetup_participants WHERE meetup_id = $1 AND user_id = $2`,
      [id, req.userId]
    )
    res.status(204).end()
  } catch (err) { next(err) }
})

// ─── DELETE /api/meetups/:id ──────────────────────────────
meetupsRouter.delete('/:id', requireAuth, async (req, res, next) => {
  try {
    const id = Number(req.params.id)
    if (!Number.isInteger(id)) throw new AppError(400, 'ID inválido', 'BAD_ID')
    const { rows } = await pool.query('SELECT creator_id FROM meetups WHERE id = $1', [id])
    if (!rows[0]) throw new AppError(404, 'Quedada no encontrada', 'NOT_FOUND')
    if (rows[0].creator_id !== req.userId) throw new AppError(403, 'No eres el creador', 'NOT_OWNER')
    await pool.query('DELETE FROM meetups WHERE id = $1', [id])
    res.status(204).end()
  } catch (err) { next(err) }
})
```

- [ ] **Step 2: Montar router en `server/src/index.js`**

Añadir el import:
```js
import { meetupsRouter } from './routes/meetups.js'
```

Y dentro de `createApp()`:
```js
app.use('/api/meetups', meetupsRouter)
```

- [ ] **Step 3: Correr tests**

```
npm test
```
Expected: todos verdes (suite previa + ~10 nuevos).

---

## Task 4: Conectar el frontend a los endpoints reales

**Files:**
- Modify: `client/src/api/real.js`

- [ ] **Step 1: Sustituir las funciones de meetups mock por reales**

Reemplaza la sección `// MEETUPS / CLUBS — todavía mock` en `real.js` por:

```js
  // ── MEETUPS (reales) ──
  listMeetups: (filters = {}) => {
    const params = new URLSearchParams()
    if (filters.sport) params.set('sport', filters.sport)
    if (filters.level) params.set('level', filters.level)
    if (filters.city)  params.set('city', filters.city)
    const qs = params.toString()
    return request('GET', `/meetups${qs ? `?${qs}` : ''}`)
  },
  getMeetup: (id) => request('GET', `/meetups/${id}`),
  joinMeetup: (id) => request('POST', `/meetups/${id}/join`),
  leaveMeetup: (id) => request('DELETE', `/meetups/${id}/join`),
  createMeetup: (data) => request('POST', '/meetups', { body: data }),
  deleteMeetup: (id) => request('DELETE', `/meetups/${id}`),

  // ── CLUBS — siguen mock (Fase 3 pendiente) ──
  listClubs:       mockApi.listClubs,
  getClub:         mockApi.getClub,
  getAvailability: mockApi.getAvailability,
  createBooking:   mockApi.createBooking,
```

- [ ] **Step 2: Adaptar la página CreateMeetup**

En `client/src/pages/CreateMeetup.jsx`, el backend espera `max_players` como número y los nombres de campos coinciden. Verificar que el formulario envía exactamente esos nombres (revisar el código actual — ya usa `meetup_date` y `max_players`).

Si hace falta cambio, asegurarse de:
- `meetup_date`: input `datetime-local` produce string ISO sin Z → el backend lo acepta como TIMESTAMP
- `max_players`: convertir a Number antes de enviar (el form lo manda como string)

- [ ] **Step 3: Verificación manual end-to-end**

Terminal 1: `npm run dev` en `server/`
Terminal 2: `npm run dev` en `client/`

En http://localhost:5173:
- [ ] Login con `joel@test.com` / `test1234`
- [ ] Ir a `/meetups` → ver las 3 quedadas del seed
- [ ] Aplicar filtro `padel` → solo la primera
- [ ] Crear quedada nueva → debe aparecer en la lista
- [ ] Click en una quedada → ver detalle con participantes
- [ ] Logout, login como `carlos@test.com` → unirse a la quedada de Joel → ver 2 participantes
- [ ] Salirse → vuelve a 1

---

## Task 5: Commit y push

```bash
git add -A
git commit --amend -m "."
git push -f origin main
```

---

## Resumen al terminar

- Tablas: `meetups`, `meetup_participants` con índices y constraints
- 6 endpoints REST cubiertos por ~10 tests TDD
- Frontend de quedadas conectado al backend real
- Comisión, pagos y Stripe quedan para Fase 4. Clubs y pistas para Fase 3.
