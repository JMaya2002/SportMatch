# Sportivo v2 — Design Spec

**Fecha:** 2026-05-27  
**Estado:** Aprobado

---

## Resumen

Evolución de SportMatch a "Sportivo". Seis áreas de cambio: branding, niveles, filtros de ubicación, multi-deporte, contadores en vivo y campos de perfil ampliados.

---

## 1. Branding — Rename a "Sportivo"

**Ficheros afectados:**
- `client/index.html` → `<title>Sportivo — Conecta. Juega. Reserva.</title>`
- `client/src/components/layout/Navbar.jsx` → texto `SportMatch` → `Sportivo`
- `client/src/App.jsx` → loading screen texto `SportMatch` → `Sportivo`
- `client/src/pages/Home.jsx` → subtítulo hero → `"Encuentra jugadores, equipos y clubes cerca de ti."`

---

## 2. Nivel "experto"

Añadir `'experto'` al enum de niveles en todos los puntos del sistema.

**Backend:**
- `server/src/db/schema.sql` — CHECK constraint en `users.level` y `meetups.level`: `('principiante','intermedio','avanzado','experto')`
- `server/src/routes/auth.js` — `registerSchema` y `completeSchema`: añadir `'experto'`
- `server/src/routes/users.js` — `updateSchema` nivel
- `server/src/routes/admin.js` — `userCreateSchema`, `userUpdateSchema`, `meetupCreateSchema`, `meetupUpdateSchema`
- `server/src/routes/meetups.js` — `filterSchema` y `createSchema`

**Frontend:**
- `client/src/components/forms/FilterBar.jsx` — `LEVELS` array + `{ value: 'experto', label: 'Experto' }`
- `client/src/mock/data.js` — 2 usuarios mock actualizados a `'experto'`

**Migración:** La columna `level` tiene un CHECK constraint. Al re-ejecutar `schema.sql` (DROP + CREATE) se aplica automáticamente. Se actualiza seed.

---

## 3. Filtro provincia / municipio

### Componente nuevo: `SearchableSelect`

`client/src/components/ui/SearchableSelect.jsx`

- Dropdown con input de búsqueda interno (icono lupa)
- Misma API visual que `Select.jsx`: `{ label, value, options, onChange, placeholder }`
- Sin librería externa. ~70 líneas. Cierra al hacer clic fuera (useEffect + ref).
- Mismo estilo: `border-slate-300`, `focus:ring-brand/30`, etc.

### Datos estáticos

`client/src/data/locations.js`

```js
export const PROVINCES = ['Barcelona', 'Madrid', 'Valencia', ...]  // 52 provincias

export const CITIES_BY_PROVINCE = {
  'Barcelona': ['Barcelona', 'Hospitalet de Llobregat', 'Badalona', ...],
  'Madrid':    ['Madrid', 'Móstoles', 'Alcalá de Henares', ...],
  // ... 52 entradas, ~30 ciudades cada una
}
```

### FilterBar

`FilterBar.jsx` — nuevos props y lógica:
- Reemplaza el `Input` libre de ciudad por dos `SearchableSelect` en cascada:
  1. Provincia → `filters.province`
  2. Ciudad → `filters.city`, opciones filtradas según provincia elegida
- Al cambiar provincia: resetear ciudad
- Ambos opcionales ("Todas las provincias", "Todas las ciudades")

### Schema DB

Nuevas columnas (nullable):
- `users.province TEXT`
- `meetups.province TEXT`

### Backend filtros

- `GET /api/users?province=X` — nuevo filtro en `users.js`
- `GET /api/meetups?province=X` — nuevo filtro en `meetups.js`
- `GET /api/meetups?city=X&province=X` — ambos combinables

### Formularios

- `Register.jsx` y `MyProfile.jsx` — sustituir Input libre de ciudad por cascada provincia→ciudad
- `CreateMeetup.jsx` — mismo patrón para localización del partido

---

## 4. Hasta 3 deportes principales

### Schema DB

```sql
ALTER TABLE users ADD COLUMN sports TEXT[] DEFAULT '{}';
```

Se mantiene `main_sport` para compatibilidad con filtros, badges y displays existentes. Se auto-asigna a `sports[0]`.

### Backend

- `auth.js` `registerSchema`: `sports: z.array(sportEnum).min(1).max(3)`; se deriva `mainSport = sports[0]`
- `auth.js` `completeSchema`: ídem
- `users.js` `updateSchema`: `sports` opcional, array 1–3; si se actualiza, actualizar también `main_sport`
- `publicCard` y `privateProfile`: incluir `sports` en respuesta
- `admin.js`: schemas actualizados

### Frontend — SportPicker

`client/src/components/forms/SportPicker.jsx` — nuevo componente:
- Grid de chips clicables (8 deportes)
- Chip seleccionado: fondo `bg-brand`, texto blanco
- Máximo 3: los no seleccionados se deshabilitan al llegar a 3 (cursor-not-allowed, opacidad reducida)
- Contador debajo: "1/3", "2/3", "3/3 (máximo)"
- Reutiliza los emojis de `Home.jsx`

Usado en `Register.jsx` y `MyProfile.jsx` reemplazando el `Select` de deporte.

### Mock

- `mock.js` `register`: acepta `sports`, lo almacena en `newUser`
- `mock.js` `updateMe`: acepta `sports`
- `MOCK_USERS`: añadir campo `sports: ['padel']` (retrocompat)

---

## 5. Contadores en vivo

### Endpoint público nuevo

`server/src/routes/stats.js` → `GET /api/stats` (sin auth)

```sql
SELECT
  -- Jugadores activos: registrados en 90 días o con actividad en meetups en 30 días
  (SELECT COUNT(DISTINCT u.id) FROM users u
   WHERE u.created_at > NOW() - INTERVAL '90 days'
      OR u.id IN (
        SELECT user_id FROM meetup_participants
        WHERE joined_at > NOW() - INTERVAL '30 days'
      )
  )::int AS active_players,

  -- Total clubes
  (SELECT COUNT(*)::int FROM clubs) AS clubs_count,

  -- Meetups de la semana actual (no cancelados)
  (SELECT COUNT(*)::int FROM meetups
   WHERE meetup_date >= date_trunc('week', NOW())
     AND meetup_date < date_trunc('week', NOW()) + INTERVAL '7 days'
     AND status != 'cancelled'
  ) AS meetups_this_week
```

**Supuesto documentado:** "Jugadores activos" = usuarios con registro o participación en meetups reciente. No existe campo `last_login`. Se puede refinar en el futuro añadiendo dicho campo.

Montado en `index.js` como `app.use('/api/stats', statsRouter)` (sin auth).

### Frontend

`client/src/api/real.js` — añadir `publicStats: () => request('GET', '/stats')`  
`client/src/api/mock.js` — `publicStats()` calcula desde `MOCK_USERS`, `MOCK_CLUBS`, `MOCK_MEETUPS`

`Home.jsx`:
```jsx
const [stats, setStats] = useState(null)
const [statsError, setStatsError] = useState(false)
useEffect(() => {
  api.publicStats().then(setStats).catch(() => setStatsError(true))
}, [])
```

Loading: muestra `—` en lugar de número  
Error: muestra `?`  
Formato: `stats.active_players.toLocaleString('es-ES')`

---

## 6. Campos ampliados de perfil

### Schema DB

```sql
ALTER TABLE users
  ADD COLUMN position    TEXT,
  ADD COLUMN availability TEXT[] DEFAULT '{}',
  ADD COLUMN objectives   TEXT[] DEFAULT '{}';
```

### Valores

**Posiciones** (solo aplica a algunos deportes):
```js
export const POSITIONS_BY_SPORT = {
  futbol:     ['Portero','Defensa','Centrocampista','Delantero'],
  baloncesto: ['Base','Escolta','Alero','Ala-Pívot','Pívot'],
  padel:      ['Drive','Revés'],
  tenis:      ['Fondo','Red'],
  futsal:     ['Portero','Cierre','Ala','Pívot'],
}
// running, ciclismo, fitness, senderismo → sin posición
```

**Disponibilidad** (checkboxes múltiples):
- `mananas_semana` — Mañanas entre semana
- `tardes_semana` — Tardes entre semana
- `noches_semana` — Noches entre semana
- `mananas_finde` — Mañanas fin de semana
- `tardes_finde` — Tardes fin de semana

**Objetivos** (chips múltiples):
- `competir` — 🏆 Competir
- `entrenar` — 💪 Entrenar
- `pasarlo_bien` — 😄 Pasarlo bien
- `buscar_equipo` — 🔍 Buscar equipo

### Backend

`users.js` `updateSchema`: añadir `position`, `availability`, `objectives`  
`publicCard`: incluir los tres campos  
`auth.js` `registerSchema`: todos opcionales (pueden completarse después)

### Frontend

`MyProfile.jsx`:
- Selector de posición: `Select` condicional (solo si el deporte actual tiene posiciones)
- Disponibilidad: checkboxes en grid 2 col
- Objetivos: chips clicables (mismo estilo que `SportPicker`)

`Profile.jsx`: sección nueva "Sobre mí" que muestra posición, disponibilidad y objetivos si están rellenos. Condicional por campo.

---

## Ficheros a crear

| Fichero | Descripción |
|---|---|
| `client/src/components/ui/SearchableSelect.jsx` | Dropdown con búsqueda |
| `client/src/components/forms/SportPicker.jsx` | Selector de chips multi-deporte |
| `client/src/data/locations.js` | 52 provincias + ciudades |
| `server/src/routes/stats.js` | Endpoint público `/api/stats` |
| `docs/superpowers/specs/2026-05-27-sportivo-v2-design.md` | Este fichero |

## Ficheros a modificar

### Backend
- `server/src/db/schema.sql`
- `server/src/db/seed.sql`
- `server/src/routes/auth.js`
- `server/src/routes/users.js`
- `server/src/routes/meetups.js`
- `server/src/routes/admin.js`
- `server/src/index.js`

### Frontend
- `client/index.html`
- `client/src/components/layout/Navbar.jsx`
- `client/src/App.jsx`
- `client/src/pages/Home.jsx`
- `client/src/components/forms/FilterBar.jsx`
- `client/src/pages/Register.jsx`
- `client/src/pages/MyProfile.jsx`
- `client/src/pages/Profile.jsx`
- `client/src/pages/CreateMeetup.jsx`
- `client/src/mock/data.js`
- `client/src/api/mock.js`
- `client/src/api/real.js`

---

## No se rompe

- Todos los campos nuevos son nullable/opcionales en DB
- `main_sport` se mantiene para compatibilidad con filtros y displays existentes
- Los tests existentes no se tocan (no hay tests de nivel/deporte específico en las suites actuales)
- La demo mock funciona sin backend gracias a los cálculos locales de stats y los datos actualizados
