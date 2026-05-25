# SportMatch

Plataforma para conectar deportistas y reservar pistas en clubs.

## Estructura

- `client/` — Frontend React + Vite + Tailwind
- `server/` — Backend Express + Postgres
- `docs/` — Spec y planes

## Arranque rápido

1. Crea dos bases de datos Postgres (recomendado: Neon, https://neon.tech).
2. Copia `.env.example` a `.env` en `server/` y `client/`, completa `DATABASE_URL` y `TEST_DATABASE_URL`.
3. Carga schema y datos seed:
   ```
   cd server
   node scripts/setup-db.mjs --seed          # MAIN DB con seed
   node scripts/setup-db.mjs --test          # TEST DB (solo schema)
   cd ..
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
