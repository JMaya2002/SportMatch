// server/src/middleware/validate.js
// Valida req.body / req.query con un schema de zod

export function validate(schema, source = 'body') {
  return (req, res, next) => {
    const result = schema.safeParse(req[source])
    if (!result.success) {
      return next(result.error)  // lo captura errorHandler
    }
    // Si la fuente es req.query, no podemos reasignar en Express 5 (es getter).
    // Para body sí se puede.
    if (source === 'body') {
      req[source] = result.data
    } else {
      req.validatedQuery = result.data
    }
    next()
  }
}
