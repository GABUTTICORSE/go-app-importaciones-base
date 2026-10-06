// Envuelve funciones async para que cualquier error llegue al manejador de
// errores de Express en vez de botar el servidor completo.
export const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next)

// Aplica asyncHandler a todas las funciones de un objeto (útil para controladores).
export const wrapAll = (handlers) =>
  Object.fromEntries(
    Object.entries(handlers).map(([name, fn]) => [name, asyncHandler(fn)])
  )
