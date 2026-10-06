import { Router } from 'express'
import * as controller from '../controllers/operation.controller.js'
import { protect } from '../middleware/auth.js'
import { wrapAll } from '../utils/asyncHandler.js'

const { addTracking, calculate, create, get, list, remove, update } =
  wrapAll(controller)

const router = Router()
router.use(protect)

router.post('/calculate', calculate)
router.get('/', list)
router.get('/:id', get)
router.post('/', create)
router.put('/:id', update)
router.delete('/:id', remove)
router.post('/:id/tracking', addTracking)

export default router
