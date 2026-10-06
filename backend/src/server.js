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
import reminderRoutes from './routes/reminder.routes.js'

dotenv.config()

// Revisa que las variables obligatorias existan antes de arrancar
const requiredEnv = ['MONGO_URI', 'JWT_SECRET']
const missingEnv = requiredEnv.filter((key) => !process.env[key])

if (missingEnv.length > 0) {
  console.error(`❌ Faltan variables en el .env: ${missingEnv.join(', ')}`)
  process.exit(1)
}

const isProduction = process.env.NODE_ENV === 'production'
const app = express()

app.use(
  cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true,
  })
)

app.use(express.json({ limit: '2mb' }))
app.use(morgan(isProduction ? 'combined' : 'dev'))

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, service: 'GOAPP API' })
})

app.use('/api/auth', authRoutes)
app.use('/api/operations', operationRoutes)
app.use('/api/products', productRoutes)
app.use('/api/suppliers', supplierRoutes)
app.use('/api/exchange-rate', exchangeRoutes)
app.use('/api/news', newsRoutes)
app.use('/api/reminders', reminderRoutes)

// Ruta no encontrada
app.use('/api', (_req, res) => {
  res.status(404).json({ message: 'Ruta no encontrada' })
})

// Manejador de errores: siempre al final, después de todas las rutas
app.use((err, _req, res, _next) => {
  console.error(err)

  // Número de orden (u otro campo único) repetido
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || 'campo'
    return res
      .status(409)
      .json({ message: `Ya existe un registro con ese ${field}` })
  }

  // Datos que no cumplen el modelo o un id con formato inválido
  if (err.name === 'ValidationError' || err.name === 'CastError') {
    return res.status(400).json({ message: 'Datos inválidos' })
  }

  const status = err.status || 500
  res.status(status).json({
    // En producción no se muestran detalles internos del error
    message: status === 500 && isProduction ? 'Error interno' : err.message || 'Error interno',
  })
})

// Red de seguridad: registra errores inesperados en vez de apagar el servidor
process.on('unhandledRejection', (reason) => {
  console.error('Error no controlado:', reason)
})

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
