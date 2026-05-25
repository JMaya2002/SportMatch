# SportMatch — Fase 1: Base + Auth + Perfiles

**Objetivo:** Montar el monorepo (cliente + servidor + Postgres), implementar autenticación local (email + contraseña) y con Google OAuth con JWT en cookie httpOnly, perfiles públicos en `/@usuario` y un buscador de usuarios por deporte/nivel/ciudad.

**Arquitectura:** Monorepo `/client` (Vite + React + Tailwind) y `/server` (Express ESM + `pg` + Passport). Tablas `users` con `CHECK age >= 18`. JWT firmado guardado en cookie httpOnly + SameSite=lax. Cloudinary para avatares.

**Stack:** Node 20, Express 5 (ESM), React 18, Vite, Tailwind 3, PostgreSQL 16, `pg`, Passport (`passport-local` + `passport-google-oauth20`), `jsonwebtoken`, `bcrypt`, `zod`, `multer`, `cloudinary`, Vitest, supertest.

**Referencia:** `docs/specs/2026-05-25-sportmatch-design.md`

---

## Estructura de archivos en esta fase

```
sportmatch/
├── client/
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   ├── .env.example
│   └── src/
│       ├── main.jsx
│       ├── App.jsx
│       ├── index.css                      # Tailwind directives + Inter
│       ├── api/
│       │   └── client.js                  # fetch helper con credentials
│       ├── context/
│       │   └── AuthContext.jsx
│       ├── components/
│       │   ├── layout/
│       │   │   ├── Navbar.jsx
│       │   │   └── BottomNav.jsx
│       │   ├── ui/
│       │   │   ├── Button.jsx
│       │   │   ├── Input.jsx
│       │   │   ├── Select.jsx
│       │   │   ├── Card.jsx
│       │   │   ├── Avatar.jsx
│       │   │   └── Badge.jsx
│       │   └── forms/
│       │       ├── FilterBar.jsx
│       │       └── AgeCheckbox.jsx
│       └── pages/
│           ├── Home.jsx
│           ├── Login.jsx
│           ├── Register.jsx
│           ├── RegisterComplete.jsx       # tras Google si faltan datos
│           ├── Profile.jsx                # /@username
│           ├── Users.jsx                  # buscador
│           └── MyProfile.jsx              # /me (editar)
│
├── server/
│   ├── package.json
│   ├── .env.example
│   └── src/
│       ├── index.js                       # arranque Express
│       ├── config.js                      # lee env vars
│       ├── db.js                          # Pool de pg
│       ├── cloudinary.js                  # SDK init
│       ├── passport.js                    # estrategias local + google
│       ├── middleware/
│       │   ├── auth.js                    # requireAuth + optionalAuth
│       │   ├── validate.js                # helper zod
│       │   └── errorHandler.js
│       ├── routes/
│       │   ├── auth.js
│       │   └── users.js
│       └── db/
│           ├── schema.sql                 # tabla users (con CHECK age>=18)
│           └── seed.sql                   # usuarios de prueba
│
├── server/tests/
│   ├── setup.js                           # crea DB de test, ejecuta schema
│   ├── helpers.js                         # crear usuario, login, etc.
│   ├── auth.test.js
│   └── users.test.js
│
├── .gitignore                             # ya existe
└── README.md
```

---

## Task 1: Inicializar monorepo y README

**Files:**
- Create: `README.md`
- Create: `package.json` (raíz, solo para scripts agrupados)

- [ ] **Step 1: Crear `README.md` con instrucciones básicas**

```markdown
# SportMatch

Plataforma para conectar deportistas y reservar pistas en clubs.

## Estructura

- `client/` — Frontend React + Vite + Tailwind
- `server/` — Backend Express + Postgres
- `docs/` — Spec y planes

## Arranque rápido

1. Crea bases de datos Postgres:
   ```
   createdb sportmatch
   createdb sportmatch_test
   ```
2. Copia `.env.example` a `.env` en `server/` y `client/`, completa valores.
3. Carga schema:
   ```
   psql sportmatch -f server/src/db/schema.sql
   psql sportmatch -f server/src/db/seed.sql
   ```
4. Instala dependencias y arranca:
   ```
   npm install
   npm run dev
   ```

Backend en http://localhost:3000, frontend en http://localhost:5173.

## Tests

```
npm test
```
```

- [ ] **Step 2: Crear `package.json` raíz con scripts**

```json
{
  "name": "sportmatch",
  "private": true,
  "type": "module",
  "scripts": {
    "install": "npm install --prefix server && npm install --prefix client",
    "dev:server": "npm run dev --prefix server",
    "dev:client": "npm run dev --prefix client",
    "dev": "concurrently \"npm:dev:server\" \"npm:dev:client\"",
    "test": "npm test --prefix server"
  },
  "devDependencies": {
    "concurrently": "^9.1.0"
  }
}
```

- [ ] **Step 3: Instalar concurrently en raíz**

Run: `npm install`
Expected: Crea `node_modules/` y `package-lock.json` en raíz.

- [ ] **Step 4: Commit**

```bash
git add README.md package.json package-lock.json
git commit -m "chore: inicializar monorepo con scripts agrupados"
```

---

## Task 2: Setup del servidor Express

**Files:**
- Create: `server/package.json`
- Create: `server/.env.example`
- Create: `server/src/config.js`
- Create: `server/src/index.js`

- [ ] **Step 1: Crear `server/package.json`**

```json
{
  "name": "sportmatch-server",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "main": "src/index.js",
  "scripts": {
    "dev": "node --watch src/index.js",
    "start": "node src/index.js",
    "test": "vitest run"
  },
  "dependencies": {
    "bcrypt": "^5.1.1",
    "cloudinary": "^2.5.1",
    "cookie-parser": "^1.4.7",
    "cors": "^2.8.5",
    "dotenv": "^16.4.7",
    "express": "^5.0.1",
    "jsonwebtoken": "^9.0.2",
    "multer": "^1.4.5-lts.1",
    "passport": "^0.7.0",
    "passport-google-oauth20": "^2.0.0",
    "passport-local": "^1.0.0",
    "pg": "^8.13.1",
    "zod": "^3.24.1"
  },
  "devDependencies": {
    "supertest": "^7.0.0",
    "vitest": "^2.1.8"
  }
}
```

- [ ] **Step 2: Crear `server/.env.example`**

```
NODE_ENV=development
PORT=3000
DATABASE_URL=postgres://postgres:postgres@localhost:5432/sportmatch
TEST_DATABASE_URL=postgres://postgres:postgres@localhost:5432/sportmatch_test

JWT_SECRET=cambia-esto-por-un-string-aleatorio-largo
CLIENT_URL=http://localhost:5173

# Google OAuth (rellenar en Google Cloud Console)
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_CALLBACK_URL=http://localhost:3000/api/auth/google/callback

# Cloudinary (rellenar en cloudinary.com)
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

PLATFORM_FEE_PERCENT=10
```

- [ ] **Step 3: Crear `server/src/config.js`**

```js
// server/src/config.js
// Centraliza la lectura de variables de entorno
import dotenv from 'dotenv'
dotenv.config()

export const config = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT) || 3000,
  databaseUrl: process.env.NODE_ENV === 'test'
    ? process.env.TEST_DATABASE_URL
    : process.env.DATABASE_URL,
  jwtSecret: process.env.JWT_SECRET,
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackUrl: process.env.GOOGLE_CALLBACK_URL,
  },
  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    apiKey: process.env.CLOUDINARY_API_KEY,
    apiSecret: process.env.CLOUDINARY_API_SECRET,
  },
  platformFeePercent: Number(process.env.PLATFORM_FEE_PERCENT) || 10,
}

// Validación temprana: si falta algo crítico, fallamos al arrancar
if (!config.jwtSecret) {
  throw new Error('Falta JWT_SECRET en .env')
}
```

- [ ] **Step 4: Crear `server/src/index.js`**

```js
// server/src/index.js
// Arranque del servidor Express
import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import { config } from './config.js'

const app = express()

// CORS configurado para el cliente, permitiendo cookies
app.use(cors({
  origin: config.clientUrl,
  credentials: true,
}))

app.use(express.json())
app.use(cookieParser())

// Endpoint de salud para verificar que arranca
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' })
})

app.listen(config.port, () => {
  console.log(`Servidor escuchando en http://localhost:${config.port}`)
})
```

- [ ] **Step 5: Instalar dependencias**

Run: `cd server && npm install`
Expected: `node_modules/` creado, sin errores.

- [ ] **Step 6: Crear `.env` local (no se commitea)**

Run: `cp server/.env.example server/.env`
Edita `server/.env` y pon un `JWT_SECRET` cualquiera (ej. `JWT_SECRET=dev-secret-123456789`).

- [ ] **Step 7: Arrancar y probar health endpoint**

Run (en una terminal): `cd server && npm run dev`
Run (en otra): `curl http://localhost:3000/api/health`
Expected: `{"status":"ok"}`

Para parar el servidor: Ctrl+C en la terminal donde corre.

- [ ] **Step 8: Commit**

```bash
git add server/package.json server/package-lock.json server/.env.example server/src/
git commit -m "feat(server): setup base de Express con CORS y endpoint /api/health"
```

---

## Task 3: Schema Postgres con tabla users

**Files:**
- Create: `server/src/db.js`
- Create: `server/src/db/schema.sql`
- Create: `server/src/db/seed.sql`

- [ ] **Step 1: Crear `server/src/db.js`**

```js
// server/src/db.js
// Pool de conexiones a Postgres
import pg from 'pg'
import { config } from './config.js'

const { Pool } = pg

export const pool = new Pool({
  connectionString: config.databaseUrl,
})

// Helper: ejecuta una query y devuelve filas
export async function query(text, params) {
  const res = await pool.query(text, params)
  return res
}
```

- [ ] **Step 2: Crear `server/src/db/schema.sql`**

```sql
-- server/src/db/schema.sql
-- Esquema completo de SportMatch. Idempotente (DROP + CREATE).

DROP TABLE IF EXISTS users CASCADE;

CREATE TABLE users (
  id              SERIAL PRIMARY KEY,
  username        VARCHAR(30) UNIQUE NOT NULL,
  email           VARCHAR(255) UNIQUE NOT NULL,
  password_hash   VARCHAR(255),
  google_id       VARCHAR(255) UNIQUE,
  name            VARCHAR(100) NOT NULL,
  age             INTEGER NOT NULL CHECK (age >= 18),
  city            VARCHAR(100) NOT NULL,
  main_sport      VARCHAR(50) NOT NULL,
  level           VARCHAR(20) NOT NULL CHECK (level IN ('principiante','intermedio','avanzado')),
  avatar_url      TEXT,
  age_confirmed   BOOLEAN NOT NULL DEFAULT false,
  created_at      TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_users_filters ON users (main_sport, level, city);
```

- [ ] **Step 3: Crear `server/src/db/seed.sql` con datos de prueba**

```sql
-- server/src/db/seed.sql
-- Usuarios de prueba. Password de todos: "test1234"
-- Hash bcrypt precomputado de "test1234": $2b$10$KIXm0vEC3bnGqMyVz5vYJOlGS9fL3Wnz7gJ7K8VG4uTxJgC/QqEKy
-- (regenera con: node -e "console.log(require('bcrypt').hashSync('test1234',10))")

INSERT INTO users (username, email, password_hash, name, age, city, main_sport, level, age_confirmed)
VALUES
  ('joel',    'joel@test.com',    '$2b$10$KIXm0vEC3bnGqMyVz5vYJOlGS9fL3Wnz7gJ7K8VG4uTxJgC/QqEKy', 'Joel Maya',     28, 'Barcelona', 'padel',      'intermedio',   true),
  ('elena',   'elena@test.com',   '$2b$10$KIXm0vEC3bnGqMyVz5vYJOlGS9fL3Wnz7gJ7K8VG4uTxJgC/QqEKy', 'Elena Soler',   26, 'Barcelona', 'tenis',      'avanzado',     true),
  ('carlos',  'carlos@test.com',  '$2b$10$KIXm0vEC3bnGqMyVz5vYJOlGS9fL3Wnz7gJ7K8VG4uTxJgC/QqEKy', 'Carlos Ruiz',   34, 'Madrid',    'futbol',     'intermedio',   true),
  ('marta',   'marta@test.com',   '$2b$10$KIXm0vEC3bnGqMyVz5vYJOlGS9fL3Wnz7gJ7K8VG4uTxJgC/QqEKy', 'Marta López',   22, 'Valencia',  'running',    'principiante', true),
  ('alex',    'alex@test.com',    '$2b$10$KIXm0vEC3bnGqMyVz5vYJOlGS9fL3Wnz7gJ7K8VG4uTxJgC/QqEKy', 'Alex Torres',   30, 'Barcelona', 'baloncesto', 'avanzado',     true);
```

- [ ] **Step 4: Crear bases de datos y cargar schema**

Run:
```bash
createdb sportmatch
createdb sportmatch_test
psql sportmatch -f server/src/db/schema.sql
psql sportmatch -f server/src/db/seed.sql
psql sportmatch_test -f server/src/db/schema.sql
```

Expected: `CREATE TABLE`, `CREATE INDEX`, `INSERT 0 5` sin errores.

- [ ] **Step 5: Probar que el CHECK de edad funciona**

Run: `psql sportmatch -c "INSERT INTO users (username, email, name, age, city, main_sport, level) VALUES ('menor', 'm@m.com', 'Menor', 17, 'X', 'futbol', 'principiante');"`

Expected: ERROR del estilo `new row for relation "users" violates check constraint "users_age_check"`.

- [ ] **Step 6: Commit**

```bash
git add server/src/db.js server/src/db/
git commit -m "feat(server): añadir schema de users con CHECK age>=18 y datos seed"
```

---

## Task 4: Middleware de validación y manejo de errores

**Files:**
- Create: `server/src/middleware/errorHandler.js`
- Create: `server/src/middleware/validate.js`
- Modify: `server/src/index.js`

- [ ] **Step 1: Crear `server/src/middleware/errorHandler.js`**

```js
// server/src/middleware/errorHandler.js
// Convierte errores en respuestas JSON uniformes

export class AppError extends Error {
  constructor(status, message, code) {
    super(message)
    this.status = status
    this.code = code
  }
}

// Middleware al final de la pila. Captura cualquier error y lo formatea.
export function errorHandler(err, req, res, next) {
  // Errores controlados (AppError)
  if (err instanceof AppError) {
    return res.status(err.status).json({ error: err.message, code: err.code })
  }

  // Errores de validación de zod (los pasamos con next(err))
  if (err.name === 'ZodError') {
    return res.status(400).json({
      error: 'Datos inválidos',
      code: 'VALIDATION_ERROR',
      issues: err.issues.map(i => ({ path: i.path.join('.'), message: i.message })),
    })
  }

  // Violación UNIQUE en Postgres (código '23505')
  if (err.code === '23505') {
    return res.status(409).json({ error: 'Recurso duplicado', code: 'DUPLICATE' })
  }

  // Violación CHECK en Postgres (código '23514')
  if (err.code === '23514') {
    return res.status(400).json({ error: 'Datos inválidos', code: 'CHECK_VIOLATION' })
  }

  // Resto: bug del servidor. Logueamos y devolvemos genérico.
  console.error('[errorHandler]', err)
  res.status(500).json({ error: 'Error interno del servidor', code: 'INTERNAL' })
}
```

- [ ] **Step 2: Crear `server/src/middleware/validate.js`**

```js
// server/src/middleware/validate.js
// Valida req.body / req.query con un schema de zod

export function validate(schema, source = 'body') {
  return (req, res, next) => {
    const result = schema.safeParse(req[source])
    if (!result.success) {
      return next(result.error)  // lo captura errorHandler
    }
    req[source] = result.data    // datos parseados (con defaults aplicados)
    next()
  }
}
```

- [ ] **Step 3: Modificar `server/src/index.js` para enganchar el errorHandler**

Reemplaza el contenido por:

```js
// server/src/index.js
import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import { config } from './config.js'
import { errorHandler } from './middleware/errorHandler.js'

export function createApp() {
  const app = express()

  app.use(cors({ origin: config.clientUrl, credentials: true }))
  app.use(express.json())
  app.use(cookieParser())

  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok' })
  })

  // Aquí se montarán las rutas (auth, users, ...) en tasks siguientes

  app.use(errorHandler)
  return app
}

// Solo arrancamos el servidor si este archivo es el entry point
if (import.meta.url === `file://${process.argv[1]}`) {
  const app = createApp()
  app.listen(config.port, () => {
    console.log(`Servidor escuchando en http://localhost:${config.port}`)
  })
}
```

> Nota: exportamos `createApp` para que los tests puedan crear instancias sin levantar puerto.

- [ ] **Step 4: Verificar que sigue arrancando**

Run: `cd server && npm run dev`
En otra terminal: `curl http://localhost:3000/api/health`
Expected: `{"status":"ok"}`
Para parar: Ctrl+C.

- [ ] **Step 5: Commit**

```bash
git add server/src/
git commit -m "feat(server): middleware de validación zod y manejo uniforme de errores"
```

---

## Task 5: Setup de tests con Vitest + supertest

**Files:**
- Create: `server/tests/setup.js`
- Create: `server/tests/helpers.js`
- Create: `server/vitest.config.js`

- [ ] **Step 1: Crear `server/vitest.config.js`**

```js
// server/vitest.config.js
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    globals: false,
    setupFiles: ['./tests/setup.js'],
    fileParallel: false,  // los tests comparten DB, mejor en serie
    pool: 'forks',
    poolOptions: {
      forks: { singleFork: true },
    },
  },
})
```

- [ ] **Step 2: Crear `server/tests/setup.js`**

```js
// server/tests/setup.js
// Antes de cada test recarga el schema en la DB de test
import { beforeEach, afterAll } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

// Fuerza NODE_ENV=test antes de importar config
process.env.NODE_ENV = 'test'

const { pool } = await import('../src/db.js')

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const schemaPath = path.resolve(__dirname, '../src/db/schema.sql')
const schemaSql = fs.readFileSync(schemaPath, 'utf-8')

beforeEach(async () => {
  await pool.query(schemaSql)
})

afterAll(async () => {
  await pool.end()
})
```

- [ ] **Step 3: Crear `server/tests/helpers.js`**

```js
// server/tests/helpers.js
// Helpers compartidos por tests
import bcrypt from 'bcrypt'
import { pool } from '../src/db.js'

// Inserta un usuario de prueba y devuelve sus datos
export async function createTestUser(overrides = {}) {
  const data = {
    username: 'testuser',
    email: 'test@test.com',
    password: 'test1234',
    name: 'Test User',
    age: 25,
    city: 'Barcelona',
    main_sport: 'padel',
    level: 'intermedio',
    age_confirmed: true,
    ...overrides,
  }
  const hash = await bcrypt.hash(data.password, 10)
  const result = await pool.query(
    `INSERT INTO users (username, email, password_hash, name, age, city, main_sport, level, age_confirmed)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
    [data.username, data.email, hash, data.name, data.age, data.city, data.main_sport, data.level, data.age_confirmed]
  )
  return { ...result.rows[0], plainPassword: data.password }
}
```

- [ ] **Step 4: Crear un test mínimo de humo `server/tests/smoke.test.js`**

```js
// server/tests/smoke.test.js
import { describe, it, expect } from 'vitest'
import request from 'supertest'
import { createApp } from '../src/index.js'

describe('smoke', () => {
  it('GET /api/health responde ok', async () => {
    const app = createApp()
    const res = await request(app).get('/api/health')
    expect(res.status).toBe(200)
    expect(res.body).toEqual({ status: 'ok' })
  })
})
```

- [ ] **Step 5: Ejecutar tests**

Run: `cd server && npm test`
Expected: 1 test passes (`smoke > GET /api/health responde ok`).

- [ ] **Step 6: Commit**

```bash
git add server/vitest.config.js server/tests/
git commit -m "test(server): infraestructura Vitest + supertest con DB de test"
```

---

## Task 6: Registro de usuario (POST /api/auth/register) — TDD

**Files:**
- Create: `server/src/routes/auth.js`
- Modify: `server/src/index.js`
- Create: `server/tests/auth.test.js`

- [ ] **Step 1: Escribir tests fallidos en `server/tests/auth.test.js`**

```js
// server/tests/auth.test.js
import { describe, it, expect } from 'vitest'
import request from 'supertest'
import { createApp } from '../src/index.js'

const validRegister = {
  username: 'nuevo',
  email: 'nuevo@test.com',
  password: 'test1234',
  name: 'Nuevo Usuario',
  age: 25,
  city: 'Barcelona',
  mainSport: 'padel',
  level: 'intermedio',
  ageConfirmed: true,
}

describe('POST /api/auth/register', () => {
  it('registra un usuario válido y devuelve cookie + user', async () => {
    const app = createApp()
    const res = await request(app).post('/api/auth/register').send(validRegister)
    expect(res.status).toBe(201)
    expect(res.body.user).toMatchObject({
      username: 'nuevo',
      email: 'nuevo@test.com',
      name: 'Nuevo Usuario',
    })
    expect(res.body.user.password_hash).toBeUndefined()
    expect(res.headers['set-cookie']).toBeDefined()
    expect(res.headers['set-cookie'][0]).toMatch(/token=/)
    expect(res.headers['set-cookie'][0]).toMatch(/HttpOnly/i)
  })

  it('rechaza si edad < 18', async () => {
    const app = createApp()
    const res = await request(app)
      .post('/api/auth/register')
      .send({ ...validRegister, age: 17, username: 'menor', email: 'menor@t.com' })
    expect(res.status).toBe(400)
  })

  it('rechaza si ageConfirmed=false', async () => {
    const app = createApp()
    const res = await request(app)
      .post('/api/auth/register')
      .send({ ...validRegister, ageConfirmed: false, username: 'sin', email: 'sin@t.com' })
    expect(res.status).toBe(400)
  })

  it('rechaza username duplicado con 409', async () => {
    const app = createApp()
    await request(app).post('/api/auth/register').send(validRegister)
    const res = await request(app)
      .post('/api/auth/register')
      .send({ ...validRegister, email: 'otro@t.com' })
    expect(res.status).toBe(409)
  })
})
```

- [ ] **Step 2: Ejecutar tests para verificar que fallan**

Run: `cd server && npm test`
Expected: 4 tests fallan (404 porque la ruta no existe).

- [ ] **Step 3: Crear `server/src/routes/auth.js`**

```js
// server/src/routes/auth.js
import express from 'express'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import { z } from 'zod'
import { pool } from '../db.js'
import { config } from '../config.js'
import { validate } from '../middleware/validate.js'
import { AppError } from '../middleware/errorHandler.js'

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
```

- [ ] **Step 4: Montar el router en `server/src/index.js`**

Reemplaza la línea `// Aquí se montarán las rutas...` por:

```js
import { authRouter } from './routes/auth.js'

// ...dentro de createApp(), antes de errorHandler:
  app.use('/api/auth', authRouter)
```

El archivo completo queda:

```js
// server/src/index.js
import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import { config } from './config.js'
import { errorHandler } from './middleware/errorHandler.js'
import { authRouter } from './routes/auth.js'

export function createApp() {
  const app = express()

  app.use(cors({ origin: config.clientUrl, credentials: true }))
  app.use(express.json())
  app.use(cookieParser())

  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok' })
  })

  app.use('/api/auth', authRouter)

  app.use(errorHandler)
  return app
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const app = createApp()
  app.listen(config.port, () => {
    console.log(`Servidor escuchando en http://localhost:${config.port}`)
  })
}
```

- [ ] **Step 5: Ejecutar tests — deben pasar**

Run: `cd server && npm test`
Expected: 5 tests pass (1 smoke + 4 register).

- [ ] **Step 6: Commit**

```bash
git add server/src/routes/auth.js server/src/index.js server/tests/auth.test.js
git commit -m "feat(auth): endpoint POST /api/auth/register con JWT en cookie httpOnly"
```

---

## Task 7: Login local (POST /api/auth/login) — TDD

**Files:**
- Modify: `server/src/routes/auth.js`
- Modify: `server/tests/auth.test.js`

- [ ] **Step 1: Añadir tests de login al final de `server/tests/auth.test.js`**

```js
// (añadir al final del archivo)
import { createTestUser } from './helpers.js'

describe('POST /api/auth/login', () => {
  it('login válido devuelve cookie + user', async () => {
    const user = await createTestUser({ email: 'login@t.com', username: 'loguser' })
    const app = createApp()
    const res = await request(app).post('/api/auth/login').send({
      email: 'login@t.com',
      password: user.plainPassword,
    })
    expect(res.status).toBe(200)
    expect(res.body.user.username).toBe('loguser')
    expect(res.headers['set-cookie'][0]).toMatch(/token=/)
  })

  it('contraseña incorrecta devuelve 401', async () => {
    await createTestUser({ email: 'login2@t.com', username: 'loguser2' })
    const app = createApp()
    const res = await request(app).post('/api/auth/login').send({
      email: 'login2@t.com',
      password: 'wrong-password',
    })
    expect(res.status).toBe(401)
  })

  it('usuario inexistente devuelve 401', async () => {
    const app = createApp()
    const res = await request(app).post('/api/auth/login').send({
      email: 'noexiste@t.com',
      password: 'whatever',
    })
    expect(res.status).toBe(401)
  })
})
```

- [ ] **Step 2: Ejecutar tests — fallan**

Run: `cd server && npm test`
Expected: 3 nuevos tests fallan (404).

- [ ] **Step 3: Añadir endpoint login a `server/src/routes/auth.js`**

Añade al final del archivo:

```js
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
```

- [ ] **Step 4: Ejecutar tests — pasan**

Run: `cd server && npm test`
Expected: 8 tests pass total.

- [ ] **Step 5: Commit**

```bash
git add server/src/routes/auth.js server/tests/auth.test.js
git commit -m "feat(auth): endpoint POST /api/auth/login con bcrypt y mensaje neutro"
```

---

## Task 8: Middleware requireAuth + endpoints /me y /logout — TDD

**Files:**
- Create: `server/src/middleware/auth.js`
- Modify: `server/src/routes/auth.js`
- Modify: `server/tests/auth.test.js`

- [ ] **Step 1: Añadir tests al final de `server/tests/auth.test.js`**

```js
describe('GET /api/auth/me', () => {
  it('sin cookie devuelve 401', async () => {
    const app = createApp()
    const res = await request(app).get('/api/auth/me')
    expect(res.status).toBe(401)
  })

  it('con cookie válida devuelve el usuario', async () => {
    const user = await createTestUser({ email: 'me@t.com', username: 'meuser' })
    const app = createApp()
    const login = await request(app).post('/api/auth/login').send({
      email: 'me@t.com',
      password: user.plainPassword,
    })
    const cookie = login.headers['set-cookie']
    const res = await request(app).get('/api/auth/me').set('Cookie', cookie)
    expect(res.status).toBe(200)
    expect(res.body.user.username).toBe('meuser')
  })
})

describe('POST /api/auth/logout', () => {
  it('limpia la cookie', async () => {
    const user = await createTestUser({ email: 'lo@t.com', username: 'lo' })
    const app = createApp()
    const login = await request(app).post('/api/auth/login').send({
      email: 'lo@t.com',
      password: user.plainPassword,
    })
    const cookie = login.headers['set-cookie']
    const res = await request(app).post('/api/auth/logout').set('Cookie', cookie)
    expect(res.status).toBe(204)
    expect(res.headers['set-cookie'][0]).toMatch(/token=;/)
  })
})
```

- [ ] **Step 2: Ejecutar — fallan**

Run: `cd server && npm test`
Expected: 3 nuevos tests fallan.

- [ ] **Step 3: Crear `server/src/middleware/auth.js`**

```js
// server/src/middleware/auth.js
// Verifica JWT desde la cookie 'token'
import jwt from 'jsonwebtoken'
import { config } from '../config.js'
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

// Variante: no falla si no hay token, solo no setea req.userId
export function optionalAuth(req, res, next) {
  const token = req.cookies?.token
  if (!token) return next()
  try {
    const payload = jwt.verify(token, config.jwtSecret)
    req.userId = payload.userId
  } catch { /* ignoramos */ }
  next()
}
```

- [ ] **Step 4: Añadir /me y /logout a `server/src/routes/auth.js`**

Añade el import al inicio:

```js
import { requireAuth } from '../middleware/auth.js'
```

Y al final del archivo:

```js
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
```

- [ ] **Step 5: Ejecutar — pasan**

Run: `cd server && npm test`
Expected: 11 tests pass.

- [ ] **Step 6: Commit**

```bash
git add server/src/middleware/auth.js server/src/routes/auth.js server/tests/auth.test.js
git commit -m "feat(auth): middleware requireAuth + endpoints GET /me y POST /logout"
```

---

## Task 9: Google OAuth con Passport — TDD parcial (smoke)

**Files:**
- Create: `server/src/passport.js`
- Modify: `server/src/routes/auth.js`
- Modify: `server/src/index.js`

> Nota: el flujo Google es difícil de testear en CI sin mocks pesados. Hacemos un smoke test que verifica que `/api/auth/google` redirige a `accounts.google.com`. El happy path completo se valida manualmente.

- [ ] **Step 1: Añadir test smoke al final de `server/tests/auth.test.js`**

```js
describe('GET /api/auth/google', () => {
  it('redirige a accounts.google.com', async () => {
    const app = createApp()
    const res = await request(app).get('/api/auth/google')
    expect([301, 302]).toContain(res.status)
    expect(res.headers.location).toMatch(/accounts\.google\.com/)
  })
})
```

- [ ] **Step 2: Crear `server/src/passport.js`**

```js
// server/src/passport.js
// Configura las estrategias de Passport: Google OAuth
import passport from 'passport'
import { Strategy as GoogleStrategy } from 'passport-google-oauth20'
import { pool } from './db.js'
import { config } from './config.js'

// Solo registramos Google si hay credenciales (en tests no las hay)
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

      // Buscar por google_id primero
      let { rows } = await pool.query('SELECT * FROM users WHERE google_id = $1', [googleId])
      if (rows[0]) return done(null, { user: rows[0], needsCompletion: false })

      // Buscar por email (vincular cuenta existente)
      ;({ rows } = await pool.query('SELECT * FROM users WHERE email = $1', [email]))
      if (rows[0]) {
        await pool.query('UPDATE users SET google_id = $1 WHERE id = $2', [googleId, rows[0].id])
        return done(null, { user: rows[0], needsCompletion: false })
      }

      // Nuevo usuario: marcamos que necesita completar registro
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
```

- [ ] **Step 3: Inicializar Passport en `server/src/index.js`**

Añade el import:

```js
import { passport } from './passport.js'
```

Y dentro de `createApp()` después de `cookieParser`:

```js
  app.use(passport.initialize())
```

- [ ] **Step 4: Añadir rutas Google a `server/src/routes/auth.js`**

Añade el import:

```js
import { passport } from '../passport.js'
```

Y al final:

```js
// ─── GET /api/auth/google ─────────────────────────────────
authRouter.get('/google', passport.authenticate('google', {
  scope: ['profile', 'email'],
  session: false,
}))

// ─── GET /api/auth/google/callback ────────────────────────
authRouter.get('/google/callback',
  passport.authenticate('google', { session: false, failureRedirect: `${config.clientUrl}/login?error=google` }),
  (req, res) => {
    const { user, googleProfile, needsCompletion } = req.user
    if (needsCompletion) {
      // Pasamos los datos por query string para que el frontend complete el alta
      const params = new URLSearchParams(googleProfile).toString()
      return res.redirect(`${config.clientUrl}/register/complete?${params}`)
    }
    issueToken(res, user.id)
    res.redirect(config.clientUrl)
  }
)

// ─── POST /api/auth/register/complete ─────────────────────
// Tras Google, cuando faltan datos del perfil
const completeSchema = z.object({
  googleId: z.string(),
  email: z.string().email(),
  name: z.string().min(1).max(100),
  username: z.string().min(3).max(30).regex(/^[a-z0-9_]+$/i),
  age: z.number().int().min(18),
  city: z.string().min(1).max(100),
  mainSport: z.enum(['futbol','padel','baloncesto','running','tenis','ciclismo','fitness','senderismo']),
  level: z.enum(['principiante','intermedio','avanzado']),
  ageConfirmed: z.literal(true),
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
```

- [ ] **Step 5: Configurar credenciales Google en `.env` (manual)**

Para que el test smoke pase, necesitas credenciales reales aunque sean dummy:
- Ve a https://console.cloud.google.com/, crea un OAuth 2.0 Client ID (Web).
- Authorized redirect URI: `http://localhost:3000/api/auth/google/callback`.
- Copia `Client ID` y `Client Secret` a `server/.env`.

Para el **test** específicamente, edita `server/tests/setup.js` y añade al inicio (antes del `await import`):

```js
process.env.GOOGLE_CLIENT_ID = 'test-client-id'
process.env.GOOGLE_CLIENT_SECRET = 'test-client-secret'
process.env.GOOGLE_CALLBACK_URL = 'http://localhost:3000/api/auth/google/callback'
```

- [ ] **Step 6: Ejecutar tests**

Run: `cd server && npm test`
Expected: 12 tests pass.

- [ ] **Step 7: Probar manualmente Google OAuth**

Run: `cd server && npm run dev`
Abre en navegador: http://localhost:3000/api/auth/google
Expected: redirige a Google → tras login redirige de vuelta. Si no tienes la cuenta enlazada, te lleva a `/register/complete?...`. Si ya estás registrado, te lleva a `/`.

Para parar: Ctrl+C.

- [ ] **Step 8: Commit**

```bash
git add server/src/passport.js server/src/index.js server/src/routes/auth.js server/tests/setup.js server/tests/auth.test.js
git commit -m "feat(auth): Google OAuth con Passport + flujo register/complete"
```

---

## Task 10: Endpoints de usuarios (GET listado, GET por username, PATCH /me) — TDD

**Files:**
- Create: `server/src/routes/users.js`
- Modify: `server/src/index.js`
- Create: `server/tests/users.test.js`

- [ ] **Step 1: Escribir tests fallidos en `server/tests/users.test.js`**

```js
// server/tests/users.test.js
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

describe('GET /api/users', () => {
  it('devuelve lista de usuarios', async () => {
    await createTestUser({ username: 'a', email: 'a@t.com' })
    await createTestUser({ username: 'b', email: 'b@t.com', city: 'Madrid' })
    const app = createApp()
    const res = await request(app).get('/api/users')
    expect(res.status).toBe(200)
    expect(res.body.users).toHaveLength(2)
    expect(res.body.users[0]).not.toHaveProperty('password_hash')
  })

  it('filtra por ciudad', async () => {
    await createTestUser({ username: 'bcn', email: 'bcn@t.com', city: 'Barcelona' })
    await createTestUser({ username: 'mad', email: 'mad@t.com', city: 'Madrid' })
    const app = createApp()
    const res = await request(app).get('/api/users?city=Madrid')
    expect(res.body.users).toHaveLength(1)
    expect(res.body.users[0].username).toBe('mad')
  })

  it('filtra por deporte y nivel combinados', async () => {
    await createTestUser({ username: 'p1', email: 'p1@t.com', main_sport: 'padel', level: 'intermedio' })
    await createTestUser({ username: 'p2', email: 'p2@t.com', main_sport: 'padel', level: 'avanzado' })
    await createTestUser({ username: 't1', email: 't1@t.com', main_sport: 'tenis', level: 'intermedio' })
    const app = createApp()
    const res = await request(app).get('/api/users?sport=padel&level=intermedio')
    expect(res.body.users).toHaveLength(1)
    expect(res.body.users[0].username).toBe('p1')
  })
})

describe('GET /api/users/:username', () => {
  it('devuelve perfil público', async () => {
    await createTestUser({ username: 'publicuser', email: 'pub@t.com' })
    const app = createApp()
    const res = await request(app).get('/api/users/publicuser')
    expect(res.status).toBe(200)
    expect(res.body.user.username).toBe('publicuser')
    expect(res.body.user.password_hash).toBeUndefined()
    expect(res.body.user.email).toBeUndefined()  // email no es público
  })

  it('404 si no existe', async () => {
    const app = createApp()
    const res = await request(app).get('/api/users/inexistente')
    expect(res.status).toBe(404)
  })
})

describe('PATCH /api/users/me', () => {
  it('actualiza datos editables', async () => {
    const user = await createTestUser({ username: 'edit', email: 'edit@t.com' })
    const app = createApp()
    const cookie = await loginAs(app, user)
    const res = await request(app)
      .patch('/api/users/me')
      .set('Cookie', cookie)
      .send({ city: 'Valencia', level: 'avanzado' })
    expect(res.status).toBe(200)
    expect(res.body.user.city).toBe('Valencia')
    expect(res.body.user.level).toBe('avanzado')
  })

  it('sin auth devuelve 401', async () => {
    const app = createApp()
    const res = await request(app).patch('/api/users/me').send({ city: 'X' })
    expect(res.status).toBe(401)
  })
})
```

- [ ] **Step 2: Ejecutar — fallan**

Run: `cd server && npm test`
Expected: nuevos tests fallan (404).

- [ ] **Step 3: Crear `server/src/routes/users.js`**

```js
// server/src/routes/users.js
import express from 'express'
import { z } from 'zod'
import { pool } from '../db.js'
import { validate } from '../middleware/validate.js'
import { requireAuth } from '../middleware/auth.js'
import { AppError } from '../middleware/errorHandler.js'

export const usersRouter = express.Router()

// Lo que se muestra en el perfil público (sin email ni hashes)
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
  }
}

// ─── GET /api/users  (con filtros opcionales) ─────────────
const filterSchema = z.object({
  sport: z.string().optional(),
  level: z.enum(['principiante','intermedio','avanzado']).optional(),
  city: z.string().optional(),
})

usersRouter.get('/', validate(filterSchema, 'query'), async (req, res, next) => {
  try {
    const { sport, level, city } = req.query
    const conditions = []
    const params = []
    if (sport) { params.push(sport); conditions.push(`main_sport = $${params.length}`) }
    if (level) { params.push(level); conditions.push(`level = $${params.length}`) }
    if (city)  { params.push(city);  conditions.push(`city ILIKE $${params.length}`) }
    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''
    const { rows } = await pool.query(`SELECT * FROM users ${where} ORDER BY created_at DESC LIMIT 50`, params)
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
  level: z.enum(['principiante','intermedio','avanzado']).optional(),
})

usersRouter.patch('/me', requireAuth, validate(updateSchema), async (req, res, next) => {
  try {
    const fields = req.body
    const sets = []
    const params = []
    const map = { name: 'name', city: 'city', mainSport: 'main_sport', level: 'level' }
    for (const [key, col] of Object.entries(map)) {
      if (fields[key] !== undefined) {
        params.push(fields[key])
        sets.push(`${col} = $${params.length}`)
      }
    }
    if (!sets.length) return res.json({ user: null })  // nada que actualizar
    params.push(req.userId)
    const { rows } = await pool.query(
      `UPDATE users SET ${sets.join(', ')} WHERE id = $${params.length} RETURNING *`,
      params
    )
    const { password_hash, google_id, ...publicUser } = rows[0]
    res.json({ user: publicUser })
  } catch (err) {
    next(err)
  }
})
```

- [ ] **Step 4: Montar el router en `server/src/index.js`**

Añade el import:

```js
import { usersRouter } from './routes/users.js'
```

Y dentro de `createApp()` después de `app.use('/api/auth', authRouter)`:

```js
  app.use('/api/users', usersRouter)
```

- [ ] **Step 5: Ejecutar tests — pasan**

Run: `cd server && npm test`
Expected: ~18 tests pass.

- [ ] **Step 6: Commit**

```bash
git add server/src/routes/users.js server/src/index.js server/tests/users.test.js
git commit -m "feat(users): endpoints GET listado con filtros, GET /:username, PATCH /me"
```

---

## Task 11: Subida de avatar a Cloudinary

**Files:**
- Create: `server/src/cloudinary.js`
- Modify: `server/src/routes/users.js`

> Nota: skipeable en TDD por la dependencia externa. Verificamos manualmente.

- [ ] **Step 1: Crear `server/src/cloudinary.js`**

```js
// server/src/cloudinary.js
import { v2 as cloudinary } from 'cloudinary'
import { config } from './config.js'

if (config.cloudinary.cloudName) {
  cloudinary.config({
    cloud_name: config.cloudinary.cloudName,
    api_key: config.cloudinary.apiKey,
    api_secret: config.cloudinary.apiSecret,
  })
}

// Sube un buffer a Cloudinary y devuelve la URL segura
export function uploadBuffer(buffer, folder) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder, resource_type: 'image' },
      (err, result) => err ? reject(err) : resolve(result.secure_url)
    )
    stream.end(buffer)
  })
}
```

- [ ] **Step 2: Añadir endpoint POST /api/users/me/avatar a `server/src/routes/users.js`**

Añade los imports al inicio:

```js
import multer from 'multer'
import { uploadBuffer } from '../cloudinary.js'

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },  // 5 MB
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) return cb(new Error('Solo imágenes'))
    cb(null, true)
  },
})
```

Y añade el endpoint al final del archivo:

```js
// ─── POST /api/users/me/avatar ────────────────────────────
usersRouter.post('/me/avatar', requireAuth, upload.single('avatar'), async (req, res, next) => {
  try {
    if (!req.file) throw new AppError(400, 'Falta archivo', 'NO_FILE')
    const url = await uploadBuffer(req.file.buffer, 'sportmatch/avatars')
    await pool.query('UPDATE users SET avatar_url = $1 WHERE id = $2', [url, req.userId])
    res.json({ url })
  } catch (err) {
    next(err)
  }
})
```

- [ ] **Step 3: Probar manualmente con curl**

(Requiere credenciales Cloudinary en `.env` y un usuario logueado.)

Run: `cd server && npm run dev` (en otra terminal)

```bash
# 1. Login y guardar cookie
curl -c cookies.txt -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"joel@test.com","password":"test1234"}'

# 2. Subir avatar
curl -b cookies.txt -X POST http://localhost:3000/api/users/me/avatar \
  -F "avatar=@/ruta/a/una/imagen.jpg"
```

Expected: `{"url":"https://res.cloudinary.com/..."}`.

Para parar el servidor: Ctrl+C.

- [ ] **Step 4: Commit**

```bash
git add server/src/cloudinary.js server/src/routes/users.js
git commit -m "feat(users): subida de avatar a Cloudinary con multer"
```

---

## Task 12: Setup del cliente Vite + React + Tailwind

**Files:**
- Create: `client/package.json`
- Create: `client/vite.config.js`
- Create: `client/index.html`
- Create: `client/tailwind.config.js`
- Create: `client/postcss.config.js`
- Create: `client/.env.example`
- Create: `client/src/main.jsx`
- Create: `client/src/App.jsx`
- Create: `client/src/index.css`

- [ ] **Step 1: Crear `client/package.json`**

```json
{
  "name": "sportmatch-client",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "react-router-dom": "^6.28.0"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^4.3.4",
    "autoprefixer": "^10.4.20",
    "postcss": "^8.4.49",
    "tailwindcss": "^3.4.17",
    "vite": "^6.0.7"
  }
}
```

- [ ] **Step 2: Crear `client/vite.config.js`**

```js
// client/vite.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      // Las llamadas a /api se redirigen al backend en dev
      '/api': 'http://localhost:3000',
    },
  },
})
```

- [ ] **Step 3: Crear `client/index.html`**

```html
<!DOCTYPE html>
<html lang="es">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700&display=swap" rel="stylesheet">
    <title>SportMatch</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
```

- [ ] **Step 4: Crear `client/tailwind.config.js`**

```js
// client/tailwind.config.js
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        // Aliases semánticos para usar en componentes
        brand: {
          DEFAULT: '#10B981',  // emerald-500
          dark: '#059669',     // emerald-600
        },
        accent: '#F97316',     // orange-500
      },
    },
  },
  plugins: [],
}
```

- [ ] **Step 5: Crear `client/postcss.config.js`**

```js
// client/postcss.config.js
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
```

- [ ] **Step 6: Crear `client/.env.example`**

```
VITE_API_URL=/api
```

- [ ] **Step 7: Crear `client/src/index.css`**

```css
/* client/src/index.css */
@tailwind base;
@tailwind components;
@tailwind utilities;

html, body, #root {
  height: 100%;
}

body {
  font-family: 'Inter', system-ui, sans-serif;
  @apply bg-slate-50 text-slate-900;
}
```

- [ ] **Step 8: Crear `client/src/main.jsx`**

```jsx
// client/src/main.jsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import './index.css'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>
)
```

- [ ] **Step 9: Crear `client/src/App.jsx` mínimo**

```jsx
// client/src/App.jsx
// Componente raíz con un placeholder. Las rutas se montan en task siguiente.
export default function App() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-brand">SportMatch</h1>
        <p className="text-slate-600 mt-2">Cargando...</p>
      </div>
    </div>
  )
}
```

- [ ] **Step 10: Instalar y arrancar**

Run: `cd client && npm install && cp .env.example .env`
Run: `npm run dev`
Abre http://localhost:5173 — debes ver "SportMatch" en color verde sobre fondo claro.
Para parar: Ctrl+C.

- [ ] **Step 11: Commit**

```bash
git add client/package.json client/package-lock.json client/vite.config.js client/index.html client/tailwind.config.js client/postcss.config.js client/.env.example client/src/
git commit -m "feat(client): setup Vite + React + Tailwind con tipografía Inter"
```

---

## Task 13: Cliente API + AuthContext

**Files:**
- Create: `client/src/api/client.js`
- Create: `client/src/context/AuthContext.jsx`
- Modify: `client/src/main.jsx`

- [ ] **Step 1: Crear `client/src/api/client.js`**

```js
// client/src/api/client.js
// Helper de fetch que envía cookies y maneja errores de forma uniforme.

const BASE = import.meta.env.VITE_API_URL || '/api'

export class ApiError extends Error {
  constructor(status, body) {
    super(body?.error || `Error ${status}`)
    this.status = status
    this.code = body?.code
    this.body = body
  }
}

async function request(method, path, { body, isFormData } = {}) {
  const opts = {
    method,
    credentials: 'include',
    headers: {},
  }
  if (body !== undefined) {
    if (isFormData) {
      opts.body = body
    } else {
      opts.headers['Content-Type'] = 'application/json'
      opts.body = JSON.stringify(body)
    }
  }
  const res = await fetch(`${BASE}${path}`, opts)
  const data = res.status === 204 ? null : await res.json().catch(() => null)
  if (!res.ok) throw new ApiError(res.status, data)
  return data
}

export const api = {
  get:    (path)            => request('GET', path),
  post:   (path, body, opts) => request('POST', path, { body, ...opts }),
  patch:  (path, body)       => request('PATCH', path, { body }),
  delete: (path)             => request('DELETE', path),
}
```

- [ ] **Step 2: Crear `client/src/context/AuthContext.jsx`**

```jsx
// client/src/context/AuthContext.jsx
// Proveedor de autenticación: usuario actual + login / logout / register
import { createContext, useContext, useEffect, useState } from 'react'
import { api, ApiError } from '../api/client.js'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  // Al montar: intentamos cargar el usuario actual desde la cookie existente
  useEffect(() => {
    api.get('/auth/me')
      .then(({ user }) => setUser(user))
      .catch(err => {
        if (!(err instanceof ApiError) || err.status !== 401) console.error(err)
      })
      .finally(() => setLoading(false))
  }, [])

  async function login(email, password) {
    const { user } = await api.post('/auth/login', { email, password })
    setUser(user)
  }

  async function register(data) {
    const { user } = await api.post('/auth/register', data)
    setUser(user)
  }

  async function logout() {
    await api.post('/auth/logout')
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, setUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth debe usarse dentro de <AuthProvider>')
  return ctx
}
```

- [ ] **Step 3: Envolver `<App />` con `<AuthProvider>` en `client/src/main.jsx`**

Reemplaza el contenido:

```jsx
// client/src/main.jsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import { AuthProvider } from './context/AuthContext.jsx'
import './index.css'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>
)
```

- [ ] **Step 4: Commit**

```bash
git add client/src/api/ client/src/context/ client/src/main.jsx
git commit -m "feat(client): cliente API con cookies + AuthContext (login/logout/register)"
```

---

## Task 14: Componentes UI básicos reutilizables

**Files:**
- Create: `client/src/components/ui/Button.jsx`
- Create: `client/src/components/ui/Input.jsx`
- Create: `client/src/components/ui/Select.jsx`
- Create: `client/src/components/ui/Card.jsx`
- Create: `client/src/components/ui/Avatar.jsx`
- Create: `client/src/components/ui/Badge.jsx`
- Create: `client/src/components/forms/AgeCheckbox.jsx`
- Create: `client/src/components/forms/FilterBar.jsx`

- [ ] **Step 1: Crear `Button.jsx`**

```jsx
// client/src/components/ui/Button.jsx
// Variantes: primary (verde), accent (naranja), ghost (sin fondo)
export function Button({ variant = 'primary', className = '', ...props }) {
  const base = 'inline-flex items-center justify-center font-medium rounded-lg px-4 py-2 transition disabled:opacity-50 disabled:cursor-not-allowed'
  const variants = {
    primary: 'bg-brand text-white hover:bg-brand-dark',
    accent:  'bg-accent text-white hover:bg-orange-600',
    ghost:   'text-slate-700 hover:bg-slate-100',
    danger:  'bg-rose-500 text-white hover:bg-rose-600',
  }
  return <button className={`${base} ${variants[variant]} ${className}`} {...props} />
}
```

- [ ] **Step 2: Crear `Input.jsx`**

```jsx
// client/src/components/ui/Input.jsx
export function Input({ label, error, className = '', ...props }) {
  return (
    <label className="block">
      {label && <span className="block text-sm font-medium text-slate-700 mb-1">{label}</span>}
      <input
        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand ${error ? 'border-rose-500' : 'border-slate-300'} ${className}`}
        {...props}
      />
      {error && <span className="block text-sm text-rose-600 mt-1">{error}</span>}
    </label>
  )
}
```

- [ ] **Step 3: Crear `Select.jsx`**

```jsx
// client/src/components/ui/Select.jsx
export function Select({ label, error, options = [], className = '', ...props }) {
  return (
    <label className="block">
      {label && <span className="block text-sm font-medium text-slate-700 mb-1">{label}</span>}
      <select
        className={`w-full px-3 py-2 border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-brand ${error ? 'border-rose-500' : 'border-slate-300'} ${className}`}
        {...props}
      >
        {options.map(o => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
      {error && <span className="block text-sm text-rose-600 mt-1">{error}</span>}
    </label>
  )
}
```

- [ ] **Step 4: Crear `Card.jsx`**

```jsx
// client/src/components/ui/Card.jsx
export function Card({ children, className = '', ...props }) {
  return (
    <div className={`bg-white rounded-xl shadow-sm border border-slate-200 p-4 ${className}`} {...props}>
      {children}
    </div>
  )
}
```

- [ ] **Step 5: Crear `Avatar.jsx`**

```jsx
// client/src/components/ui/Avatar.jsx
export function Avatar({ src, name = '', size = 'md' }) {
  const sizes = { sm: 'w-8 h-8 text-xs', md: 'w-12 h-12 text-base', lg: 'w-20 h-20 text-2xl' }
  const initials = name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()
  if (src) {
    return <img src={src} alt={name} className={`${sizes[size]} rounded-full object-cover`} />
  }
  return (
    <div className={`${sizes[size]} rounded-full bg-brand text-white flex items-center justify-center font-semibold`}>
      {initials || '?'}
    </div>
  )
}
```

- [ ] **Step 6: Crear `Badge.jsx`**

```jsx
// client/src/components/ui/Badge.jsx
// Color por nivel deportivo
const levelColors = {
  principiante: 'bg-sky-100 text-sky-700',
  intermedio:   'bg-amber-100 text-amber-700',
  avanzado:     'bg-rose-100 text-rose-700',
}

export function Badge({ children, level, className = '' }) {
  const color = level ? levelColors[level] : 'bg-slate-100 text-slate-700'
  return (
    <span className={`inline-block px-2 py-0.5 text-xs font-medium rounded ${color} ${className}`}>
      {children}
    </span>
  )
}
```

- [ ] **Step 7: Crear `AgeCheckbox.jsx`**

```jsx
// client/src/components/forms/AgeCheckbox.jsx
// Casilla obligatoria de confirmación +18
export function AgeCheckbox({ checked, onChange, error }) {
  return (
    <label className="flex items-start gap-2 cursor-pointer">
      <input
        type="checkbox"
        checked={checked}
        onChange={e => onChange(e.target.checked)}
        className="mt-1 w-4 h-4 accent-brand"
      />
      <span className="text-sm text-slate-700">
        Confirmo que tengo <strong>18 años o más</strong>.
      </span>
      {error && <span className="text-sm text-rose-600 ml-2">{error}</span>}
    </label>
  )
}
```

- [ ] **Step 8: Crear `FilterBar.jsx`**

```jsx
// client/src/components/forms/FilterBar.jsx
// Filtros reutilizables: deporte, nivel, ciudad
import { Select } from '../ui/Select.jsx'
import { Input } from '../ui/Input.jsx'

const SPORTS = [
  { value: '',           label: 'Todos los deportes' },
  { value: 'futbol',     label: 'Fútbol' },
  { value: 'padel',      label: 'Pádel' },
  { value: 'baloncesto', label: 'Baloncesto' },
  { value: 'running',    label: 'Running' },
  { value: 'tenis',      label: 'Tenis' },
  { value: 'ciclismo',   label: 'Ciclismo' },
  { value: 'fitness',    label: 'Fitness' },
  { value: 'senderismo', label: 'Senderismo' },
]
const LEVELS = [
  { value: '',             label: 'Todos los niveles' },
  { value: 'principiante', label: 'Principiante' },
  { value: 'intermedio',   label: 'Intermedio' },
  { value: 'avanzado',     label: 'Avanzado' },
]

export function FilterBar({ filters, onChange }) {
  function update(key, value) {
    onChange({ ...filters, [key]: value })
  }
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
      <Select label="Deporte" options={SPORTS} value={filters.sport || ''} onChange={e => update('sport', e.target.value)} />
      <Select label="Nivel"   options={LEVELS} value={filters.level || ''} onChange={e => update('level', e.target.value)} />
      <Input  label="Ciudad"  placeholder="Cualquier ciudad" value={filters.city || ''} onChange={e => update('city', e.target.value)} />
    </div>
  )
}

export { SPORTS, LEVELS }
```

- [ ] **Step 9: Verificar que el cliente sigue arrancando**

Run: `cd client && npm run dev`
Expected: la página sigue cargando sin errores en consola.
Para parar: Ctrl+C.

- [ ] **Step 10: Commit**

```bash
git add client/src/components/
git commit -m "feat(client): componentes UI básicos (Button/Input/Select/Card/Avatar/Badge/FilterBar/AgeCheckbox)"
```

---

## Task 15: Layout (Navbar + BottomNav)

**Files:**
- Create: `client/src/components/layout/Navbar.jsx`
- Create: `client/src/components/layout/BottomNav.jsx`

- [ ] **Step 1: Crear `Navbar.jsx`**

```jsx
// client/src/components/layout/Navbar.jsx
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext.jsx'
import { Avatar } from '../ui/Avatar.jsx'
import { Button } from '../ui/Button.jsx'

export function Navbar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  async function handleLogout() {
    await logout()
    navigate('/')
  }

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
      <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link to="/" className="text-xl font-bold text-brand">SportMatch</Link>
        <nav className="flex items-center gap-3">
          {user ? (
            <>
              <Link to={`/@${user.username}`} className="flex items-center gap-2">
                <Avatar src={user.avatar_url} name={user.name} size="sm" />
                <span className="hidden sm:inline text-sm">{user.name}</span>
              </Link>
              <Button variant="ghost" onClick={handleLogout}>Salir</Button>
            </>
          ) : (
            <>
              <Link to="/login"    className="text-sm text-slate-700 hover:text-slate-900">Entrar</Link>
              <Link to="/register" className="text-sm bg-brand text-white px-3 py-1.5 rounded-lg">Registro</Link>
            </>
          )}
        </nav>
      </div>
    </header>
  )
}
```

- [ ] **Step 2: Crear `BottomNav.jsx`**

```jsx
// client/src/components/layout/BottomNav.jsx
// Navegación inferior en móvil
import { NavLink } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext.jsx'

export function BottomNav() {
  const { user } = useAuth()
  const items = [
    { to: '/',         label: 'Inicio' },
    { to: '/users',    label: 'Deportistas' },
    // /meetups y /clubs se añaden en fases 2 y 3
    { to: user ? `/@${user.username}` : '/login', label: 'Yo' },
  ]
  return (
    <nav className="sm:hidden fixed bottom-0 inset-x-0 bg-white border-t border-slate-200 flex justify-around py-2 z-10">
      {items.map(it => (
        <NavLink
          key={it.to}
          to={it.to}
          className={({ isActive }) => `text-xs px-3 py-1 ${isActive ? 'text-brand font-semibold' : 'text-slate-600'}`}
        >
          {it.label}
        </NavLink>
      ))}
    </nav>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add client/src/components/layout/
git commit -m "feat(client): Navbar (sticky) + BottomNav (mobile)"
```

---

## Task 16: Páginas de auth (Login, Register, RegisterComplete)

**Files:**
- Create: `client/src/pages/Login.jsx`
- Create: `client/src/pages/Register.jsx`
- Create: `client/src/pages/RegisterComplete.jsx`

- [ ] **Step 1: Crear `Login.jsx`**

```jsx
// client/src/pages/Login.jsx
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { Input } from '../components/ui/Input.jsx'
import { Button } from '../components/ui/Button.jsx'
import { Card } from '../components/ui/Card.jsx'

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null); setLoading(true)
    try {
      await login(email, password)
      navigate('/')
    } catch (err) {
      setError(err.message || 'Error al iniciar sesión')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-md mx-auto p-4">
      <Card>
        <h1 className="text-2xl font-bold mb-4">Iniciar sesión</h1>
        <form onSubmit={handleSubmit} className="space-y-3">
          <Input label="Email" type="email" required value={email} onChange={e => setEmail(e.target.value)} />
          <Input label="Contraseña" type="password" required value={password} onChange={e => setPassword(e.target.value)} />
          {error && <p className="text-sm text-rose-600">{error}</p>}
          <Button type="submit" disabled={loading} className="w-full">
            {loading ? 'Entrando...' : 'Entrar'}
          </Button>
        </form>
        <div className="my-4 text-center text-sm text-slate-500">o</div>
        <a
          href="/api/auth/google"
          className="block w-full text-center border border-slate-300 rounded-lg py-2 hover:bg-slate-50"
        >
          Continuar con Google
        </a>
        <p className="text-sm text-center mt-4 text-slate-600">
          ¿No tienes cuenta? <Link to="/register" className="text-brand font-medium">Regístrate</Link>
        </p>
      </Card>
    </div>
  )
}
```

- [ ] **Step 2: Crear `Register.jsx`**

```jsx
// client/src/pages/Register.jsx
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { Input } from '../components/ui/Input.jsx'
import { Select } from '../components/ui/Select.jsx'
import { Button } from '../components/ui/Button.jsx'
import { Card } from '../components/ui/Card.jsx'
import { AgeCheckbox } from '../components/forms/AgeCheckbox.jsx'
import { SPORTS, LEVELS } from '../components/forms/FilterBar.jsx'

export default function Register() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({
    username: '', email: '', password: '', name: '',
    age: '', city: '',
    mainSport: 'padel', level: 'intermedio',
    ageConfirmed: false,
  })
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  function update(k, v) { setForm(f => ({ ...f, [k]: v })) }

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null); setLoading(true)
    try {
      await register({
        ...form,
        age: Number(form.age),
      })
      navigate('/')
    } catch (err) {
      setError(err.message || 'Error al registrar')
    } finally {
      setLoading(false)
    }
  }

  const canSubmit = form.ageConfirmed && form.age >= 18

  return (
    <div className="max-w-md mx-auto p-4">
      <Card>
        <h1 className="text-2xl font-bold mb-4">Crear cuenta</h1>
        <form onSubmit={handleSubmit} className="space-y-3">
          <Input label="Nombre de usuario (@)" required value={form.username} onChange={e => update('username', e.target.value)} />
          <Input label="Nombre completo"        required value={form.name}     onChange={e => update('name', e.target.value)} />
          <Input label="Email" type="email"     required value={form.email}    onChange={e => update('email', e.target.value)} />
          <Input label="Contraseña" type="password" required minLength={8} value={form.password} onChange={e => update('password', e.target.value)} />
          <Input label="Edad" type="number" min={18} required value={form.age} onChange={e => update('age', e.target.value)} />
          <Input label="Ciudad" required value={form.city} onChange={e => update('city', e.target.value)} />
          <Select label="Deporte principal" options={SPORTS.filter(s => s.value)} value={form.mainSport} onChange={e => update('mainSport', e.target.value)} />
          <Select label="Nivel"              options={LEVELS.filter(s => s.value)} value={form.level}     onChange={e => update('level', e.target.value)} />
          <AgeCheckbox checked={form.ageConfirmed} onChange={v => update('ageConfirmed', v)} />
          {error && <p className="text-sm text-rose-600">{error}</p>}
          <Button type="submit" disabled={loading || !canSubmit} className="w-full">
            {loading ? 'Creando...' : 'Crear cuenta'}
          </Button>
        </form>
        <p className="text-sm text-center mt-4 text-slate-600">
          ¿Ya tienes cuenta? <Link to="/login" className="text-brand font-medium">Inicia sesión</Link>
        </p>
      </Card>
    </div>
  )
}
```

- [ ] **Step 3: Crear `RegisterComplete.jsx`**

```jsx
// client/src/pages/RegisterComplete.jsx
// Tras Google OAuth, completar datos que faltan (username, edad, etc).
import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { api } from '../api/client.js'
import { useAuth } from '../context/AuthContext.jsx'
import { Input } from '../components/ui/Input.jsx'
import { Select } from '../components/ui/Select.jsx'
import { Button } from '../components/ui/Button.jsx'
import { Card } from '../components/ui/Card.jsx'
import { AgeCheckbox } from '../components/forms/AgeCheckbox.jsx'
import { SPORTS, LEVELS } from '../components/forms/FilterBar.jsx'

export default function RegisterComplete() {
  const [params] = useSearchParams()
  const { setUser } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({
    googleId: params.get('googleId') || '',
    email:    params.get('email')    || '',
    name:     params.get('name')     || '',
    username: '',
    age: '',
    city: '',
    mainSport: 'padel',
    level: 'intermedio',
    ageConfirmed: false,
  })
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  function update(k, v) { setForm(f => ({ ...f, [k]: v })) }

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null); setLoading(true)
    try {
      const { user } = await api.post('/auth/register/complete', { ...form, age: Number(form.age) })
      setUser(user)
      navigate('/')
    } catch (err) {
      setError(err.message || 'Error al completar registro')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-md mx-auto p-4">
      <Card>
        <h1 className="text-2xl font-bold mb-2">Casi listo</h1>
        <p className="text-sm text-slate-600 mb-4">Necesitamos algunos datos más para terminar tu perfil.</p>
        <form onSubmit={handleSubmit} className="space-y-3">
          <Input label="Nombre de usuario (@)" required value={form.username} onChange={e => update('username', e.target.value)} />
          <Input label="Edad" type="number" min={18} required value={form.age} onChange={e => update('age', e.target.value)} />
          <Input label="Ciudad" required value={form.city} onChange={e => update('city', e.target.value)} />
          <Select label="Deporte principal" options={SPORTS.filter(s => s.value)} value={form.mainSport} onChange={e => update('mainSport', e.target.value)} />
          <Select label="Nivel"              options={LEVELS.filter(s => s.value)} value={form.level}     onChange={e => update('level', e.target.value)} />
          <AgeCheckbox checked={form.ageConfirmed} onChange={v => update('ageConfirmed', v)} />
          {error && <p className="text-sm text-rose-600">{error}</p>}
          <Button type="submit" disabled={loading || !form.ageConfirmed} className="w-full">
            {loading ? 'Guardando...' : 'Continuar'}
          </Button>
        </form>
      </Card>
    </div>
  )
}
```

- [ ] **Step 4: Commit**

```bash
git add client/src/pages/Login.jsx client/src/pages/Register.jsx client/src/pages/RegisterComplete.jsx
git commit -m "feat(client): páginas Login, Register (+18) y RegisterComplete (post-Google)"
```

---

## Task 17: Páginas Home, Users (buscador) y Profile (/@username)

**Files:**
- Create: `client/src/pages/Home.jsx`
- Create: `client/src/pages/Users.jsx`
- Create: `client/src/pages/Profile.jsx`

- [ ] **Step 1: Crear `Home.jsx`**

```jsx
// client/src/pages/Home.jsx
import { Link } from 'react-router-dom'
import { Button } from '../components/ui/Button.jsx'
import { useAuth } from '../context/AuthContext.jsx'

export default function Home() {
  const { user } = useAuth()
  return (
    <div className="max-w-4xl mx-auto p-4">
      <section className="text-center py-12">
        <h1 className="text-4xl sm:text-5xl font-bold">Encuentra con quién hacer deporte</h1>
        <p className="text-lg text-slate-600 mt-4">
          Conecta con deportistas cerca de ti y reserva pistas en clubs.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <Link to="/users"><Button variant="primary">Ver deportistas</Button></Link>
          {!user && (
            <Link to="/register"><Button variant="accent">Regístrate gratis</Button></Link>
          )}
        </div>
      </section>
    </div>
  )
}
```

- [ ] **Step 2: Crear `Users.jsx`**

```jsx
// client/src/pages/Users.jsx
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api/client.js'
import { FilterBar } from '../components/forms/FilterBar.jsx'
import { Card } from '../components/ui/Card.jsx'
import { Avatar } from '../components/ui/Avatar.jsx'
import { Badge } from '../components/ui/Badge.jsx'

export default function Users() {
  const [filters, setFilters] = useState({ sport: '', level: '', city: '' })
  const [users, setUsers]     = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState(null)

  useEffect(() => {
    setLoading(true); setError(null)
    const params = new URLSearchParams()
    if (filters.sport) params.set('sport', filters.sport)
    if (filters.level) params.set('level', filters.level)
    if (filters.city)  params.set('city',  filters.city)
    const qs = params.toString()
    api.get(`/users${qs ? `?${qs}` : ''}`)
      .then(({ users }) => setUsers(users))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [filters])

  return (
    <div className="max-w-4xl mx-auto p-4 pb-20">
      <h1 className="text-2xl font-bold mb-4">Deportistas</h1>
      <FilterBar filters={filters} onChange={setFilters} />
      {loading && <p className="text-slate-500">Cargando...</p>}
      {error && <p className="text-rose-600">{error}</p>}
      {!loading && users.length === 0 && <p className="text-slate-500">No hay resultados.</p>}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {users.map(u => (
          <Link key={u.id} to={`/@${u.username}`}>
            <Card className="flex items-center gap-3 hover:shadow-md transition">
              <Avatar src={u.avatar_url} name={u.name} size="md" />
              <div className="flex-1">
                <div className="font-semibold">{u.name}</div>
                <div className="text-sm text-slate-500">@{u.username} · {u.city}</div>
                <div className="mt-1 flex gap-2 text-xs">
                  <Badge>{u.main_sport}</Badge>
                  <Badge level={u.level}>{u.level}</Badge>
                </div>
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Crear `Profile.jsx`**

```jsx
// client/src/pages/Profile.jsx
import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { api, ApiError } from '../api/client.js'
import { Card } from '../components/ui/Card.jsx'
import { Avatar } from '../components/ui/Avatar.jsx'
import { Badge } from '../components/ui/Badge.jsx'

export default function Profile() {
  // La ruta es /@:username, pero React Router no admite @ en el path,
  // así que la montamos como /:slug (slug = "@username") y limpiamos.
  const { slug } = useParams()
  const username = slug?.startsWith('@') ? slug.slice(1) : slug

  const [user, setUser] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    setError(null); setUser(null)
    api.get(`/users/${username}`)
      .then(({ user }) => setUser(user))
      .catch(err => {
        if (err instanceof ApiError && err.status === 404) setError('Usuario no encontrado')
        else setError(err.message)
      })
  }, [username])

  if (error) return <p className="p-4 text-rose-600">{error}</p>
  if (!user) return <p className="p-4 text-slate-500">Cargando...</p>

  return (
    <div className="max-w-2xl mx-auto p-4 pb-20">
      <Card>
        <div className="flex items-center gap-4">
          <Avatar src={user.avatar_url} name={user.name} size="lg" />
          <div>
            <h1 className="text-2xl font-bold">{user.name}</h1>
            <p className="text-slate-500">@{user.username}</p>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
          <div><span className="text-slate-500">Edad:</span> {user.age}</div>
          <div><span className="text-slate-500">Ciudad:</span> {user.city}</div>
          <div><span className="text-slate-500">Deporte:</span> {user.main_sport}</div>
          <div><span className="text-slate-500">Nivel:</span> <Badge level={user.level}>{user.level}</Badge></div>
        </div>
      </Card>
    </div>
  )
}
```

- [ ] **Step 4: Commit**

```bash
git add client/src/pages/Home.jsx client/src/pages/Users.jsx client/src/pages/Profile.jsx
git commit -m "feat(client): páginas Home, Users (buscador con filtros) y Profile (/@username)"
```

---

## Task 18: Página MyProfile (editar perfil + subir avatar)

**Files:**
- Create: `client/src/pages/MyProfile.jsx`

- [ ] **Step 1: Crear `MyProfile.jsx`**

```jsx
// client/src/pages/MyProfile.jsx
import { useState } from 'react'
import { useAuth } from '../context/AuthContext.jsx'
import { api } from '../api/client.js'
import { Input } from '../components/ui/Input.jsx'
import { Select } from '../components/ui/Select.jsx'
import { Button } from '../components/ui/Button.jsx'
import { Card } from '../components/ui/Card.jsx'
import { Avatar } from '../components/ui/Avatar.jsx'
import { SPORTS, LEVELS } from '../components/forms/FilterBar.jsx'

export default function MyProfile() {
  const { user, setUser } = useAuth()
  const [form, setForm] = useState({
    name: user?.name || '',
    city: user?.city || '',
    mainSport: user?.main_sport || 'padel',
    level: user?.level || 'intermedio',
  })
  const [saving, setSaving] = useState(false)
  const [msg, setMsg]       = useState(null)

  function update(k, v) { setForm(f => ({ ...f, [k]: v })) }

  async function save(e) {
    e.preventDefault()
    setSaving(true); setMsg(null)
    try {
      const { user: updated } = await api.patch('/users/me', form)
      setUser(updated)
      setMsg('Guardado ✓')
    } catch (err) {
      setMsg(err.message)
    } finally {
      setSaving(false)
    }
  }

  async function uploadAvatar(file) {
    const fd = new FormData()
    fd.append('avatar', file)
    try {
      const { url } = await api.post('/users/me/avatar', fd, { isFormData: true })
      setUser({ ...user, avatar_url: url })
    } catch (err) {
      setMsg(err.message)
    }
  }

  if (!user) return <p className="p-4">Necesitas iniciar sesión.</p>

  return (
    <div className="max-w-md mx-auto p-4 pb-20">
      <Card>
        <h1 className="text-2xl font-bold mb-4">Mi perfil</h1>
        <div className="flex items-center gap-4 mb-4">
          <Avatar src={user.avatar_url} name={user.name} size="lg" />
          <label className="cursor-pointer text-sm text-brand">
            Cambiar foto
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={e => e.target.files?.[0] && uploadAvatar(e.target.files[0])}
            />
          </label>
        </div>
        <form onSubmit={save} className="space-y-3">
          <Input label="Nombre" value={form.name} onChange={e => update('name', e.target.value)} />
          <Input label="Ciudad" value={form.city} onChange={e => update('city', e.target.value)} />
          <Select label="Deporte" options={SPORTS.filter(s => s.value)} value={form.mainSport} onChange={e => update('mainSport', e.target.value)} />
          <Select label="Nivel"   options={LEVELS.filter(s => s.value)} value={form.level}     onChange={e => update('level', e.target.value)} />
          {msg && <p className="text-sm text-slate-600">{msg}</p>}
          <Button type="submit" disabled={saving} className="w-full">
            {saving ? 'Guardando...' : 'Guardar'}
          </Button>
        </form>
      </Card>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add client/src/pages/MyProfile.jsx
git commit -m "feat(client): página MyProfile con editar perfil + subida de avatar"
```

---

## Task 19: Router y App con todas las rutas conectadas

**Files:**
- Modify: `client/src/App.jsx`

- [ ] **Step 1: Reemplazar contenido de `client/src/App.jsx`**

```jsx
// client/src/App.jsx
// Router con todas las páginas de la fase 1
import { Routes, Route, Navigate } from 'react-router-dom'
import { Navbar } from './components/layout/Navbar.jsx'
import { BottomNav } from './components/layout/BottomNav.jsx'
import { useAuth } from './context/AuthContext.jsx'

import Home from './pages/Home.jsx'
import Login from './pages/Login.jsx'
import Register from './pages/Register.jsx'
import RegisterComplete from './pages/RegisterComplete.jsx'
import Users from './pages/Users.jsx'
import Profile from './pages/Profile.jsx'
import MyProfile from './pages/MyProfile.jsx'

// Wrapper para rutas privadas
function Protected({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <p className="p-4">Cargando...</p>
  if (!user) return <Navigate to="/login" replace />
  return children
}

export default function App() {
  const { loading } = useAuth()
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-slate-500">Cargando SportMatch...</p>
      </div>
    )
  }
  return (
    <div className="min-h-screen">
      <Navbar />
      <main>
        <Routes>
          <Route path="/"                  element={<Home />} />
          <Route path="/login"             element={<Login />} />
          <Route path="/register"          element={<Register />} />
          <Route path="/register/complete" element={<RegisterComplete />} />
          <Route path="/users"             element={<Users />} />
          <Route path="/:slug"             element={<Profile />} />   {/* /@username */}
          <Route path="/me"                element={<Protected><MyProfile /></Protected>} />
        </Routes>
      </main>
      <BottomNav />
    </div>
  )
}
```

- [ ] **Step 2: Arrancar y verificar manualmente todo el flujo**

Run (terminal 1): `cd server && npm run dev`
Run (terminal 2): `cd client && npm run dev`
Abre http://localhost:5173

**Checklist manual:**
- [ ] Home muestra el hero
- [ ] Click en "Regístrate" → formulario completo
- [ ] Intentar enviar con edad 17 → no permitido (HTML5 + backend)
- [ ] Enviar sin marcar +18 → botón disabled
- [ ] Registro válido → redirige a `/`, Navbar muestra avatar
- [ ] Click en avatar → va a `/@miusuario` y muestra el perfil
- [ ] Logout funciona
- [ ] Login con email funciona
- [ ] "Continuar con Google" → redirige a Google → vuelve a la app
- [ ] `/users` muestra todos los deportistas
- [ ] Filtros por deporte/nivel/ciudad funcionan
- [ ] `/me` permite editar y guardar
- [ ] Subir foto de perfil cambia el avatar
- [ ] En móvil (375px DevTools) el BottomNav aparece

Para parar ambos: Ctrl+C en cada terminal.

- [ ] **Step 3: Commit**

```bash
git add client/src/App.jsx
git commit -m "feat(client): router con todas las rutas de la fase 1 conectadas"
```

---

## Task 20: README final de la fase 1

**Files:**
- Modify: `README.md`

- [ ] **Step 1: Actualizar `README.md` con el estado de fase 1**

```markdown
# SportMatch

Plataforma para conectar deportistas y reservar pistas en clubs.

## Estado del proyecto

✅ **Fase 1 — Base + Auth + Perfiles** (completada)
- Registro local con casilla obligatoria +18
- Login con Google OAuth
- JWT en cookie httpOnly
- Perfiles públicos en `/@usuario`
- Buscador de usuarios por deporte/nivel/ciudad
- Subida de avatar a Cloudinary

⏳ **Fase 2 — Quedadas** (siguiente)
⏳ **Fase 3 — Clubs + pistas**
⏳ **Fase 4 — Reservas + pagos (Stripe)**

## Estructura

- `client/` — Frontend React + Vite + Tailwind
- `server/` — Backend Express + Postgres
- `docs/specs/` — Spec de diseño
- `docs/plans/` — Planes de implementación

## Arranque

1. Postgres:
   ```
   createdb sportmatch
   createdb sportmatch_test
   ```
2. Variables de entorno:
   ```
   cp server/.env.example server/.env
   cp client/.env.example client/.env
   ```
   Rellena `server/.env` con: `JWT_SECRET`, credenciales de Google OAuth y Cloudinary.
3. Schema y datos de prueba:
   ```
   psql sportmatch -f server/src/db/schema.sql
   psql sportmatch -f server/src/db/seed.sql
   psql sportmatch_test -f server/src/db/schema.sql
   ```
4. Instalar dependencias:
   ```
   npm install
   ```
5. Arrancar todo:
   ```
   npm run dev
   ```
   - Backend: http://localhost:3000
   - Frontend: http://localhost:5173

## Tests

```
npm test
```

## Datos de prueba

Tras `seed.sql`, hay 5 usuarios con contraseña `test1234`:
- `joel@test.com` (Barcelona, pádel)
- `elena@test.com` (Barcelona, tenis)
- `carlos@test.com` (Madrid, fútbol)
- `marta@test.com` (Valencia, running)
- `alex@test.com` (Barcelona, baloncesto)
```

- [ ] **Step 2: Commit**

```bash
git add README.md
git commit -m "docs: actualizar README con estado tras fase 1"
```

---

## Resumen de fase 1

Al terminar todas las tasks tendrás:

- **Backend:** Express con `/api/health`, `/api/auth/*` (register, login, logout, me, google, register/complete), `/api/users/*` (lista con filtros, perfil público, editar /me, subir avatar)
- **Frontend:** React + Tailwind con Home, Login, Register (+18 obligatorio), Profile público, Buscador con filtros, MyProfile editable
- **DB:** Tabla `users` con `CHECK age >= 18`, índice de búsqueda
- **Auth:** JWT en cookie httpOnly + Google OAuth
- **Tests:** ~18 tests de backend pasando
- **Documentación:** README actualizado

**Total de tasks:** 20.
**Commits esperados:** 20.

Cuando esté listo, pasamos a la **Fase 2 (Quedadas)** con un plan análogo.
