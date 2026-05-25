// client/src/api/client.js
// Punto único de entrada para llamadas API. Elige entre mock y real según
// la variable de entorno VITE_API_MODE.
//
//   VITE_API_MODE=real  → fetch contra el backend Express en /api
//   VITE_API_MODE=mock  → datos en memoria (para la demo de GitHub Pages)
//
// Por defecto: mock (seguro para producción estática).

import { mockApi } from './mock.js'
import { realApi } from './real.js'

const MODE = import.meta.env.VITE_API_MODE || 'mock'

export const api = MODE === 'real' ? realApi : mockApi
export const API_MODE = MODE
export { ApiError } from './real.js'
