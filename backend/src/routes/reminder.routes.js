import { Router } from 'express'
import ReminderList from '../models/ReminderList.js'
import { protect } from '../middleware/auth.js'
import { asyncHandler } from '../utils/asyncHandler.js'

const router = Router()
router.use(protect)

const MAX_REMINDERS = 500

// Devuelve los recordatorios del usuario con sesión iniciada
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const list = await ReminderList.findOne({ user: req.user._id })
    res.json(list?.items || [])
  })
)

// Reemplaza la lista completa de recordatorios del usuario
router.put(
  '/',
  asyncHandler(async (req, res) => {
    const items = req.body?.items

    if (!Array.isArray(items)) {
      return res.status(400).json({ message: 'Se esperaba una lista de recordatorios' })
    }

    if (items.length > MAX_REMINDERS) {
      return res.status(400).json({ message: `Máximo ${MAX_REMINDERS} recordatorios` })
    }

    const list = await ReminderList.findOneAndUpdate(
      { user: req.user._id },
      { items },
      { upsert: true, new: true }
    )

    res.json(list.items)
  })
)

export default router
