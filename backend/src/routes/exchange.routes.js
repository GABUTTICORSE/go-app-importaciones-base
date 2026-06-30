import express from 'express'
import { protect } from '../middleware/auth.js'

const router = express.Router()

router.get('/:currency', protect, async (req, res) => {
    try {
        const currency = req.params.currency.toUpperCase()

        const response = await fetch(`https://open.er-api.com/v6/latest/${currency}`)
        const data = await response.json()

        if (!data.rates?.CLP) {
            return res.status(404).json({ message: 'Moneda no encontrada' })
        }

        res.json({
            currency,
            rate: data.rates.CLP,
            date: data.time_last_update_utc,
        })
    } catch (error) {
        res.status(500).json({ message: 'Error obteniendo tipo de cambio' })
    }
})

export default router