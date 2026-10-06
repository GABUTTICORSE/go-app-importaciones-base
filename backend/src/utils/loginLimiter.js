// Límite de intentos de inicio de sesión.
// Después de 3 claves incorrectas seguidas (por correo y conexión),
// se bloquea el inicio de sesión durante 15 minutos.
const MAX_ATTEMPTS = 3
const LOCK_MINUTES = 15
const WINDOW_MS = LOCK_MINUTES * 60 * 1000

const attempts = new Map()

export function loginKey(req, email) {
  return `${String(email).toLowerCase().trim()}|${req.ip}`
}

// Devuelve los minutos que faltan de bloqueo (0 si no está bloqueado)
export function getLockMinutes(key) {
  const entry = attempts.get(key)
  if (!entry?.lockedUntil) return 0

  const remainingMs = entry.lockedUntil - Date.now()
  if (remainingMs <= 0) {
    attempts.delete(key)
    return 0
  }
  return Math.ceil(remainingMs / 60000)
}

// Registra un intento fallido y devuelve cuántos intentos quedan
export function registerFailure(key) {
  const now = Date.now()
  let entry = attempts.get(key)

  // Si el último error fue hace más de 15 minutos, se empieza de cero
  if (!entry || now - entry.firstAt > WINDOW_MS) {
    entry = { count: 0, firstAt: now, lockedUntil: 0 }
  }

  entry.count += 1
  if (entry.count >= MAX_ATTEMPTS) {
    entry.lockedUntil = now + WINDOW_MS
  }

  attempts.set(key, entry)
  return Math.max(MAX_ATTEMPTS - entry.count, 0)
}

export function clearFailures(key) {
  attempts.delete(key)
}

// Limpieza periódica para que la memoria no crezca
setInterval(() => {
  const now = Date.now()
  for (const [key, entry] of attempts) {
    const expired = entry.lockedUntil
      ? entry.lockedUntil < now
      : now - entry.firstAt > WINDOW_MS
    if (expired) attempts.delete(key)
  }
}, 30 * 60 * 1000).unref()
