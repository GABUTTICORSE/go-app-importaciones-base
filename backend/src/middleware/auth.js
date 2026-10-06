import jwt from 'jsonwebtoken'
import User from '../models/User.js'

export async function protect(req, res, next) {
  try {
    const authHeader = req.headers.authorization

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'No autorizado' })
    }

    const token = authHeader.split(' ')[1]

    const decoded = jwt.verify(token, process.env.JWT_SECRET)

    const user = await User.findById(decoded.id).select('-password')

    if (!user) {
      return res.status(401).json({ message: 'Usuario no encontrado' })
    }

    req.user = user
    next()
  } catch (error) {
    return res.status(401).json({ message: 'Token inválido o expirado' })
  }
}

// Solo deja pasar a usuarios con rol "admin". Usar después de protect.
export function requireAdmin(req, res, next) {
  if (req.user?.role !== 'admin') {
    return res
      .status(403)
      .json({ message: 'Solo un administrador puede realizar esta acción' })
  }
  next()
}

// Igual que protect, pero no bloquea si no hay token: solo carga req.user si existe.
export async function optionalAuth(req, _res, next) {
  const authHeader = req.headers.authorization
  if (!authHeader || !authHeader.startsWith('Bearer ')) return next()

  try {
    const decoded = jwt.verify(authHeader.split(' ')[1], process.env.JWT_SECRET)
    req.user = await User.findById(decoded.id).select('-password')
  } catch {
    // token inválido: se trata como visitante sin sesión
  }
  next()
}
