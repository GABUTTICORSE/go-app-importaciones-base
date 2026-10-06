import express from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import User from '../models/User.js'
import { protect, optionalAuth } from '../middleware/auth.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import {
  clearFailures,
  getLockMinutes,
  loginKey,
  registerFailure,
} from '../utils/loginLimiter.js'

const router = express.Router()

// El registro abierto está desactivado por defecto: solo un admin con sesión
// iniciada puede crear cuentas. Para permitir que cualquiera se registre,
// define ALLOW_PUBLIC_SIGNUP=true en el .env (no recomendado en producción).
const allowPublicSignup = process.env.ALLOW_PUBLIC_SIGNUP === 'true'

const MIN_PASSWORD_LENGTH = 8

function getInitials(name = '') {
  return String(name)
    .split(' ')
    .filter(Boolean)
    .map((word) => word[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

function publicUser(user) {
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    initials: getInitials(user.name),
  }
}

router.get('/me', protect, (req, res) => {
  res.json({ user: publicUser(req.user) })
})

router.post(
  '/register',
  optionalAuth,
  asyncHandler(async (req, res) => {
    const isAdmin = req.user?.role === 'admin'

    if (!allowPublicSignup && !isAdmin) {
      return res.status(403).json({
        message:
          'El registro está cerrado. Pide a un administrador que te cree una cuenta.',
      })
    }

    const { name, email, password } = req.body

    if (!name || !email || !password) {
      return res
        .status(400)
        .json({ message: 'Nombre, email y password son requeridos' })
    }

    if (String(password).length < MIN_PASSWORD_LENGTH) {
      return res.status(400).json({
        message: `La contraseña debe tener al menos ${MIN_PASSWORD_LENGTH} caracteres`,
      })
    }

    const exists = await User.findOne({ email })

    if (exists) {
      return res.status(409).json({ message: 'Email ya registrado' })
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      // Solo un admin puede crear otro admin enviando role: 'admin'
      role: isAdmin && req.body.role === 'admin' ? 'admin' : 'user',
    })

    res.status(201).json({ user: publicUser(user) })
  })
)

router.post(
  '/login',
  asyncHandler(async (req, res) => {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({ message: 'Email y contraseña son requeridos' })
    }

    const key = loginKey(req, email)
    const lockMinutes = getLockMinutes(key)

    if (lockMinutes > 0) {
      return res.status(429).json({
        message: `Demasiados intentos fallidos. Intenta de nuevo en ${lockMinutes} minuto${lockMinutes === 1 ? '' : 's'}.`,
      })
    }

    const user = await User.findOne({ email })
    const isValidPassword = user
      ? await bcrypt.compare(password, user.password)
      : false

    if (!isValidPassword) {
      const remaining = registerFailure(key)

      if (remaining === 0) {
        return res.status(429).json({
          message:
            'Demasiados intentos fallidos. El acceso quedó bloqueado por 15 minutos.',
        })
      }

      return res.status(401).json({
        message: `Credenciales inválidas. Te quedan ${remaining} intento${remaining === 1 ? '' : 's'}.`,
      })
    }

    clearFailures(key)

    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    )

    res.json({ token, user: publicUser(user) })
  })
)

export default router
