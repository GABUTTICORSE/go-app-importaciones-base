import dotenv from 'dotenv'
import express from 'express'
import cors from 'cors'
import morgan from 'morgan'
import mongoose from 'mongoose'

import authRoutes from './routes/auth.routes.js'
import operationRoutes from './routes/operation.routes.js'
import productRoutes from './routes/product.routes.js'
import supplierRoutes from './routes/supplier.routes.js'
import exchangeRoutes from './routes/exchange.routes.js'
import newsRoutes from './routes/news.routes.js'

dotenv.config()

const app = express()

app.use(
  cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true,
  })
)

app.use(express.json({ limit: '2mb' }))
app.use(morgan('dev'))

app.get('/api/health', (_req, res) => {
  res.json({
    ok: true,
    service: 'GOAPP API',
  })
})

app.use('/api/auth', authRoutes)
app.use('/api/operations', operationRoutes)
app.use('/api/products', productRoutes)
app.use('/api/suppliers', supplierRoutes)
app.use('/api/exchange-rate', exchangeRoutes)

app.use((err, _req, res, _next) => {
  console.error(err)

  res.status(err.status || 500).json({
    message: err.message || 'Error interno',
  })
})
app.use('/api/news', newsRoutes)

const port = process.env.PORT || 4000

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log('MongoDB conectado')

    app.listen(port, () => {
      console.log(`API http://localhost:${port}`)
    })
  })
  .catch((error) => {
    console.error('MongoDB connection error:', error.message)
    process.exit(1)
  })