import express from 'express'
import Product from '../models/Product.js'
import { protect } from '../middleware/auth.js'

const router = express.Router()

router.get('/', protect, async (req, res) => {
  try {
    const products = await Product.find().sort({ nombre_producto: 1 })
    res.json(products)
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener productos' })
  }
})

export default router