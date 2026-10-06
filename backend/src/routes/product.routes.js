import express from 'express'
import Product from '../models/Product.js'
import { protect } from '../middleware/auth.js'
import { asyncHandler } from '../utils/asyncHandler.js'

const router = express.Router()

router.get(
  '/',
  protect,
  asyncHandler(async (_req, res) => {
    const products = await Product.find().sort({ nombre_producto: 1 })
    res.json(products)
  })
)

export default router
