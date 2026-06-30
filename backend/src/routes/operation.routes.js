import { Router } from 'express';
import { addTracking, calculate, create, get, list, remove, update } from '../controllers/operation.controller.js';
import { protect } from '../middleware/auth.js'

const router = Router(); router.use(protect);
router.post('/calculate', calculate); router.get('/', list); router.get('/:id', get); router.post('/', create); router.put('/:id', update); router.delete('/:id', remove); router.post('/:id/tracking', addTracking);
export default router;
