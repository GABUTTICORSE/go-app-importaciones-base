import { Router } from 'express'
import Supplier from '../models/Supplier.js'
import { crud } from '../controllers/crud.controller.js'
import { protect } from '../middleware/auth.js'
import { wrapAll } from '../utils/asyncHandler.js'

const c = wrapAll(crud(Supplier))
const router = Router()

// Todas las rutas de proveedores requieren sesión iniciada
router.use(protect)

router.get('/', c.list)
router.get('/:id', c.get)
router.post('/', c.create)
router.put('/:id', c.update)
router.delete('/:id', c.remove)

export default router
