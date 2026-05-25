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
