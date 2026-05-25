# SportMatch — Diseño técnico (MVP)

**Fecha:** 2026-05-25
**Estado:** Aprobado, listo para plan de implementación
**Autor:** Joel

---

## 1. Visión

SportMatch es una plataforma web mobile-first que conecta dos mundos:

1. **Red social deportiva** — usuarios mayores de edad crean perfiles, descubren a otros deportistas y organizan quedadas (partidos, salidas, entrenamientos).
2. **Marketplace de clubs deportivos** — clubs publican sus pistas, los usuarios reservan por horas y pagan online; la plataforma se queda una comisión.

Deportes soportados en MVP: Fútbol, Pádel, Baloncesto, Running, Tenis, Ciclismo, Fitness, Senderismo.

**Principios:**
- Priorizar funcionalidad sobre complejidad — MVP entregable
- Código simple, legible y editable a mano (sin abstracciones mágicas)
- Mobile-first desde el primer commit
- Solo +18 (validado en frontend, backend y base de datos)

---

## 2. Stack técnica

| Capa | Tecnología | Justificación |
|---|---|---|
| Frontend | React 18 + Vite + Tailwind CSS | Stack familiar al usuario, mobile-first nativo con Tailwind |
| Router | React Router v6 | Estándar |
| Estado | Context API + `useState` | Sin librerías pesadas, suficiente para MVP |
| Backend | Node 20 + Express 5 (ESM) | Mismo estilo que `mi-primera-api` del usuario |
| Base de datos | PostgreSQL 16 | Robusto, gratis, encaja con `pg` |
| Driver DB | `pg` (sin ORM) | SQL a mano, transparencia total |
| Auth | Passport.js (local + Google) + JWT en cookie httpOnly | Combina Google OAuth con sesiones seguras |
| Validación | `zod` | Schemas por endpoint, mensajes claros |
| Subida de archivos | `multer` | Multipart en backend |
| Imágenes | Cloudinary | Tier gratis, CDN, transformaciones automáticas |
| Pagos | Stripe Checkout + webhook | Sin manejar tarjetas nosotros |
| Tests | Vitest + supertest | Backend; frontend con checklist manual |

---

## 3. Arquitectura y estructura del proyecto

Monorepo simple con dos subcarpetas:

```
sportmatch/
├── client/                    # Vite + React (puerto 5173)
│   ├── src/
│   │   ├── pages/
│   │   ├── components/
│   │   ├── api/
│   │   ├── context/
│   │   └── App.jsx
│   └── package.json
│
├── server/                    # Express + ESM (puerto 3000)
│   ├── src/
│   │   ├── index.js
│   │   ├── db.js
│   │   ├── config.js
│   │   ├── middleware/
│   │   │   ├── auth.js
│   │   │   └── errorHandler.js
│   │   ├── routes/
│   │   │   ├── auth.js
│   │   │   ├── users.js
│   │   │   ├── meetups.js
│   │   │   ├── clubs.js
│   │   │   ├── courts.js
│   │   │   ├── bookings.js
│   │   │   └── payments.js
│   │   └── db/
│   │       ├── schema.sql
│   │       └── seed.sql
│   └── package.json
│
├── docs/
│   └── specs/
└── README.md
```

**Flujo de datos:**

```
Browser ──fetch('/api/...', credentials:'include')──> Express (CORS+cookies)
                                                            │
                                                            ├─ middleware auth (verifica JWT)
                                                            ├─ ruta valida con zod
                                                            ├─ consulta pg
                                                            └─ responde JSON
```

---

## 4. Modelo de datos (Postgres)

```sql
-- ============================================
-- USUARIOS Y AUTENTICACIÓN
-- ============================================
CREATE TABLE users (
  id              SERIAL PRIMARY KEY,
  username        VARCHAR(30) UNIQUE NOT NULL,
  email           VARCHAR(255) UNIQUE NOT NULL,
  password_hash   VARCHAR(255),                       -- NULL si solo Google
  google_id       VARCHAR(255) UNIQUE,                -- NULL si solo local
  name            VARCHAR(100) NOT NULL,
  age             INTEGER NOT NULL CHECK (age >= 18), -- bloqueo a nivel DB
  city            VARCHAR(100) NOT NULL,
  main_sport      VARCHAR(50) NOT NULL,
  level           VARCHAR(20) NOT NULL,               -- principiante|intermedio|avanzado
  avatar_url      TEXT,
  age_confirmed   BOOLEAN NOT NULL DEFAULT false,
  created_at      TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- QUEDADAS
-- ============================================
CREATE TABLE meetups (
  id            SERIAL PRIMARY KEY,
  creator_id    INTEGER REFERENCES users(id) ON DELETE CASCADE,
  title         VARCHAR(200) NOT NULL,
  description   TEXT,
  sport         VARCHAR(50) NOT NULL,
  level         VARCHAR(20) NOT NULL,
  city          VARCHAR(100) NOT NULL,
  location      VARCHAR(255),
  meetup_date   TIMESTAMP NOT NULL,
  max_players   INTEGER NOT NULL,
  status        VARCHAR(20) DEFAULT 'open',           -- open|full|cancelled
  created_at    TIMESTAMP DEFAULT NOW()
);

CREATE TABLE meetup_participants (
  meetup_id   INTEGER REFERENCES meetups(id) ON DELETE CASCADE,
  user_id     INTEGER REFERENCES users(id) ON DELETE CASCADE,
  joined_at   TIMESTAMP DEFAULT NOW(),
  PRIMARY KEY (meetup_id, user_id)
);

-- ============================================
-- CLUBS
-- ============================================
CREATE TABLE clubs (
  id          SERIAL PRIMARY KEY,
  owner_id    INTEGER REFERENCES users(id),
  name        VARCHAR(150) NOT NULL,
  city        VARCHAR(100) NOT NULL,
  address     VARCHAR(255),
  description TEXT,
  phone       VARCHAR(20),
  created_at  TIMESTAMP DEFAULT NOW()
);

CREATE TABLE club_photos (
  id        SERIAL PRIMARY KEY,
  club_id   INTEGER REFERENCES clubs(id) ON DELETE CASCADE,
  url       TEXT NOT NULL,
  position  INTEGER DEFAULT 0
);

CREATE TABLE courts (
  id              SERIAL PRIMARY KEY,
  club_id         INTEGER REFERENCES clubs(id) ON DELETE CASCADE,
  name            VARCHAR(100) NOT NULL,
  sport           VARCHAR(50) NOT NULL,
  price_per_hour  NUMERIC(8,2) NOT NULL,
  opening_hour    INTEGER NOT NULL DEFAULT 8,
  closing_hour    INTEGER NOT NULL DEFAULT 22
);

-- ============================================
-- RESERVAS Y PAGOS
-- ============================================
CREATE TABLE bookings (
  id                SERIAL PRIMARY KEY,
  court_id          INTEGER REFERENCES courts(id),
  user_id           INTEGER REFERENCES users(id),
  booking_date      DATE NOT NULL,
  start_hour        INTEGER NOT NULL,
  end_hour          INTEGER NOT NULL,
  total_price       NUMERIC(8,2) NOT NULL,
  platform_fee     NUMERIC(8,2) NOT NULL,
  club_payout       NUMERIC(8,2) NOT NULL,
  status            VARCHAR(20) DEFAULT 'pending',    -- pending|paid|cancelled
  stripe_session_id VARCHAR(255),
  created_at        TIMESTAMP DEFAULT NOW(),
  UNIQUE (court_id, booking_date, start_hour)         -- evita doble reserva
);

-- Índices útiles
CREATE INDEX idx_users_filters    ON users (main_sport, level, city);
CREATE INDEX idx_meetups_filters  ON meetups (sport, level, city, status);
CREATE INDEX idx_clubs_city       ON clubs (city);
CREATE INDEX idx_bookings_user    ON bookings (user_id, status);
```

**Decisiones clave:**

- **Slots por hora entera** (no minutos): drásticamente más simple, una reserva = N horas seguidas.
- **`UNIQUE (court_id, booking_date, start_hour)`** garantiza que dos usuarios no puedan reservar el mismo slot — el conflicto se detecta en DB, no en aplicación.
- **Comisión congelada en columnas** (`platform_fee`, `club_payout`) — si cambiamos el % después, las reservas antiguas mantienen su valor (auditable).
- **+18 bloqueado en tres capas:** UI (casilla obligatoria + validación de fecha), backend (zod), DB (`CHECK age >= 18`).
- **Cloudinary** guarda solo la URL en DB.

---

## 5. API REST

Todos los endpoints viven bajo `/api`.
🔒 = requiere JWT (cookie). 👤 = requiere ser dueño del recurso.

### Auth

| Método | Ruta | Body / Query | Respuesta |
|---|---|---|---|
| POST | `/api/auth/register` | `{username, email, password, name, age, city, mainSport, level, ageConfirmed}` | set-cookie + `{user}` |
| POST | `/api/auth/login` | `{email, password}` | set-cookie + `{user}` |
| POST | `/api/auth/logout` 🔒 | — | clear-cookie |
| GET | `/api/auth/me` 🔒 | — | `{user}` |
| GET | `/api/auth/google` | — | redirige a Google |
| GET | `/api/auth/google/callback` | — | set-cookie + redirect a `/` (o a `/register/complete` si faltan datos) |
| POST | `/api/auth/register/complete` | `{googleId, username, age, city, mainSport, level, ageConfirmed}` | set-cookie + `{user}` |

### Usuarios

| Método | Ruta | Body / Query | Respuesta |
|---|---|---|---|
| GET | `/api/users` | `?sport=&level=&city=` | lista filtrada |
| GET | `/api/users/:username` | — | perfil público |
| PATCH | `/api/users/me` 🔒 | campos editables | `{user}` |
| POST | `/api/users/me/avatar` 🔒 | multipart `avatar` | `{url}` |

### Quedadas

| Método | Ruta | Body / Query | Respuesta |
|---|---|---|---|
| GET | `/api/meetups` | `?sport=&level=&city=` | lista |
| GET | `/api/meetups/:id` | — | detalle + participantes |
| POST | `/api/meetups` 🔒 | datos quedada | `{meetup}` |
| POST | `/api/meetups/:id/join` 🔒 | — | 204 |
| DELETE | `/api/meetups/:id/join` 🔒 | — | 204 |
| DELETE | `/api/meetups/:id` 🔒 👤 | — | 204 |

### Clubs y pistas

| Método | Ruta | Body / Query | Respuesta |
|---|---|---|---|
| GET | `/api/clubs` | `?city=` | lista |
| GET | `/api/clubs/:id` | — | detalle + fotos + pistas |
| POST | `/api/clubs` 🔒 | datos club | `{club}` (usuario pasa a ser owner) |
| PATCH | `/api/clubs/:id` 🔒 👤 | campos editables | `{club}` |
| POST | `/api/clubs/:id/photos` 🔒 👤 | multipart `photo` | `{url}` |
| POST | `/api/clubs/:id/courts` 🔒 👤 | `{name, sport, pricePerHour, openingHour, closingHour}` | `{court}` |
| PATCH | `/api/courts/:id` 🔒 👤 | campos | `{court}` |
| DELETE | `/api/courts/:id` 🔒 👤 | — | 204 |
| GET | `/api/courts/:id/availability` | `?date=YYYY-MM-DD` | `{date, slots:[{hour, available}]}` |

### Reservas y pagos

| Método | Ruta | Body / Query | Respuesta |
|---|---|---|---|
| POST | `/api/bookings` 🔒 | `{courtId, date, startHour, endHour}` | `{bookingId, checkoutUrl}` |
| GET | `/api/bookings/me` 🔒 | — | lista de mis reservas |
| GET | `/api/bookings/:id` 🔒 | — | detalle |
| POST | `/api/stripe/webhook` | (Stripe) | 200 |

**Formato de error uniforme:**

```json
{ "error": "Mensaje corto en español", "code": "SLUG_ESTABLE" }
```

| HTTP | Cuándo |
|---|---|
| 400 | Validación falla (zod) |
| 401 | Sin auth / JWT inválido |
| 403 | Auth ok pero sin permiso |
| 404 | Recurso no encontrado |
| 409 | Conflicto (username duplicado, slot ya reservado) |
| 500 | Bug del servidor (stack logueado) |

---

## 6. Frontend — páginas y componentes

### Rutas

**Públicas:**

- `/` — Landing con hero + buscador rápido
- `/login`, `/register` — formularios; registro con casilla obligatoria +18
- `/@:username` — perfil público
- `/meetups`, `/meetups/:id` — listado y detalle
- `/clubs`, `/clubs/:id` — listado y detalle

**Privadas 🔒:**

- `/me` — editar mi perfil
- `/me/bookings` — mis reservas
- `/me/meetups` — quedadas creadas / a las que voy
- `/meetups/new` — crear quedada
- `/clubs/new` — registrar club
- `/clubs/:id/manage` 👤 — panel del dueño
- `/booking/:id/success`, `/booking/:id/cancel` — retorno de Stripe

### Componentes principales

```
components/
  layout/      Navbar, BottomNav (móvil), Footer
  ui/          Button, Input, Select, Card, Avatar, Badge, SportIcon, Modal
  forms/       FilterBar, AgeCheckbox
  meetups/     MeetupCard, MeetupForm, JoinButton
  clubs/       ClubCard, CourtList, AvailabilityGrid
  booking/     BookingSummary, PayButton
```

### Diseño visual

| Token | Valor | Uso |
|---|---|---|
| `emerald-500` | `#10B981` | Color primario, energía deportiva |
| `orange-500` | `#F97316` | CTAs, urgencia |
| `slate-50` | `#F8FAFC` | Fondo |
| `slate-900` | `#0F172A` | Texto principal |
| `sky-500` | — | Badge principiante |
| `amber-500` | — | Badge intermedio |
| `rose-500` | — | Badge avanzado |

Tipografía: **Inter** (400/500/700) desde Google Fonts.

**Pieza UX clave — `AvailabilityGrid`:** cuadrícula `días × horas` con slots libres/ocupados. Click en libre → modal de resumen → "Pagar XX€" → redirige a Stripe.

---

## 7. Flujos críticos

### 7.1 Autenticación

**Registro local:**

1. POST `/api/auth/register` con todos los campos
2. Validación zod: edad >= 18, `ageConfirmed === true`, username único, email único
3. `bcrypt.hash(password, 10)` → `password_hash`
4. `INSERT INTO users`
5. `jwt.sign({userId}, SECRET, {expiresIn:'7d'})`
6. `res.cookie('token', jwt, {httpOnly:true, sameSite:'lax', secure:NODE_ENV==='production', maxAge: 7d})`
7. Devuelve `{user}` sin `password_hash`

**Login con Google:**

1. Click → `window.location = /api/auth/google`
2. Passport redirige a Google con scopes `[profile, email]`
3. Callback `/api/auth/google/callback?code=...`
4. `passport-google-oauth20` obtiene perfil
5. Busca por `google_id` o `email`:
   - Existe → genera JWT, set cookie, redirect a `/`
   - No existe → redirect a `/register/complete?email=...&name=...` (faltan username, age, city, sport, level, +18)
6. Tras completar, `INSERT` con `google_id` y cookie

**Middleware `requireAuth`:**

```js
// server/src/middleware/auth.js
export function requireAuth(req, res, next) {
  const token = req.cookies.token
  if (!token) return res.status(401).json({ error: 'No autenticado', code: 'NO_AUTH' })
  try {
    const { userId } = jwt.verify(token, process.env.JWT_SECRET)
    req.userId = userId
    next()
  } catch {
    res.status(401).json({ error: 'Token inválido', code: 'BAD_TOKEN' })
  }
}
```

**Logout:** `res.clearCookie('token')`. El JWT es stateless, no hay que invalidar nada en DB.

**Por qué cookie httpOnly + JWT:**

- `httpOnly` → inmune a XSS (JS no puede leerla)
- `SameSite=lax` → bloquea CSRF cross-site
- JWT firmado → no necesitamos consultar DB en cada request

### 7.2 Reserva + pago

```
1) Usuario elige slot
   Frontend GET /api/courts/:id/availability?date=2026-06-01
   → pinta AvailabilityGrid → click en slot libre

2) Crear booking 'pending'
   Frontend POST /api/bookings { courtId, date, startHour:18, endHour:20 }
   Backend:
     a) BEGIN TRANSACTION
     b) hours = endHour - startHour
        total = hours * price_per_hour
        fee = round(total * (PLATFORM_FEE_PERCENT / 100), 2)
        payout = total - fee
     c) INSERT INTO bookings (..., status='pending')
        → si violación UNIQUE (código pg '23505') → 409 'Slot ya reservado'
     d) stripe.checkout.sessions.create({
          mode:'payment',
          line_items:[{ price_data:{ currency:'eur',
                        unit_amount: total*100,
                        product_data:{ name:`Pista X · ${startHour}-${endHour}h · ${date}` }},
                        quantity:1 }],
          success_url: CLIENT_URL + '/booking/{id}/success',
          cancel_url:  CLIENT_URL + '/booking/{id}/cancel',
          metadata: { bookingId }
        })
     e) UPDATE bookings SET stripe_session_id = session.id
     f) COMMIT
     g) Devuelve { bookingId, checkoutUrl: session.url }

3) Frontend redirige
   window.location = checkoutUrl  → Stripe Checkout

4) Webhook (asíncrono)
   Stripe POST /api/stripe/webhook (event: checkout.session.completed)
   Backend:
     a) Verifica firma con STRIPE_WEBHOOK_SECRET (express.raw para body crudo)
     b) Extrae bookingId del metadata
     c) UPDATE bookings SET status='paid' WHERE id=$1
     d) Responde 200

5) Vuelta del usuario
   /booking/:id/success → fetch booking → "Reserva confirmada ✓"
   Si timing: el frontend hace polling cada 2s durante 10s hasta ver 'paid'
```

**Limpieza opcional (fase futura):** cron que borra bookings `pending` con más de 30 min, liberando el slot.

---

## 8. Manejo de errores

**Backend:** middleware global `errorHandler` al final de Express. Las rutas hacen `next(err)` o lanzan `AppError`.

**Frontend:**

- `api/client.js` lanza `ApiError {status, message, code}`
- Cada página tres estados: `loading | error | data`
- Toast simple para errores no fatales
- Página `/error` para 500 inesperados
- Formularios marcan campos inválidos con el mensaje del backend

**Errores específicos:**

- Registro <18 → bloqueado en UI + zod + `CHECK` DB
- Doble reserva → `pg` error `23505` → 409
- Webhook con firma inválida → 400, no se marca paid
- Cloudinary falla → 502 con mensaje claro, no rompe operación principal

---

## 9. Testing

**Backend (Vitest + supertest):**

```
server/tests/
  auth.test.js       Registro válido / <18 rechazado / sin casilla rechazado
                     Login ok / password incorrecto / cookie se setea
  meetups.test.js    Crear y unirse / filtros por sport+level+city
  bookings.test.js   Crear / doble reserva = 409 / comisión correcta
  webhook.test.js    Firma válida marca paid / firma inválida rechazada
```

DB de test `sportmatch_test`, se recrea con `schema.sql` antes de cada suite.

**Frontend:** verificación manual con checklist en README:

- [ ] Registro <18 no permitido
- [ ] Login con Google funciona
- [ ] Crear quedada y verla en `/meetups`
- [ ] Reservar pista, pagar (modo test Stripe), ver `paid`
- [ ] Navegar en móvil (375px DevTools)

**Stripe modo test:** tarjeta `4242 4242 4242 4242` durante todo el desarrollo.

---

## 10. Variables de entorno

**`server/.env`:**

```
NODE_ENV=development
PORT=3000
DATABASE_URL=postgres://user:pass@localhost:5432/sportmatch
JWT_SECRET=<aleatorio largo>
CLIENT_URL=http://localhost:5173

# Google OAuth
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_CALLBACK_URL=http://localhost:3000/api/auth/google/callback

# Cloudinary
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

PLATFORM_FEE_PERCENT=10
```

**`client/.env`:**

```
VITE_API_URL=http://localhost:3000/api
```

---

## 11. Fases de implementación

El proyecto se construye en 4 fases. Cada fase es funcional por sí sola.

| Fase | Alcance | Tablas | Endpoints clave |
|---|---|---|---|
| **1. Base** | Setup monorepo, schema, auth local + Google, perfiles, página `/@usuario`, buscador, casilla +18 | `users` | `/auth/*`, `/users` |
| **2. Quedadas** | Crear/listar/filtrar/unirse a quedadas | `meetups`, `meetup_participants` | `/meetups/*` |
| **3. Marketplace** | Registrar clubs, fotos (Cloudinary), pistas, disponibilidad | `clubs`, `club_photos`, `courts` | `/clubs/*`, `/courts/*` |
| **4. Pagos** | Reservas + Stripe Checkout + webhook + comisión | `bookings` | `/bookings`, `/stripe/webhook` |

---

## 12. Fuera de alcance (MVP)

Para mantener el MVP entregable, **NO** se incluye:

- Chat entre usuarios
- Mapas avanzados (Google Maps embebido más allá de mostrar dirección)
- Sistema de valoraciones / reseñas
- Stripe Connect (split automático) — usamos cuenta única + transferencias manuales
- Notificaciones push o email transaccional (más allá de confirmación visual)
- Panel de admin de la plataforma
- App móvil nativa (es web mobile-first)
- Internacionalización (todo en español)
- Recuperación de contraseña (fase 2)
- 2FA

Estas funcionalidades pueden añadirse en iteraciones posteriores sobre la misma base.
