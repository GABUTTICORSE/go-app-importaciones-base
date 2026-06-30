import { Router } from 'express';
import Supplier from '../models/Supplier.js';
import { crud } from '../controllers/crud.controller.js';
import { protect } from '../middleware/auth.js'

const c = crud(Supplier); const router = Router();
router.get('/', c.list); router.get('/:id', c.get); router.post('/', c.create); router.put('/:id', c.update); router.delete('/:id', c.remove);
export default router;
    