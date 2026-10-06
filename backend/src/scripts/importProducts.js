import mongoose from 'mongoose'
import xlsx from 'xlsx'
import dotenv from 'dotenv'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import Product from '../models/Product.js'

dotenv.config()

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const fileName = 'productos-GC-v1-normalizado.xlsx'
const filePathCandidates = [
  path.resolve(__dirname, '../data', fileName),
  path.resolve(__dirname, '../../data', fileName),
]
const filePath =
  filePathCandidates.find((candidatePath) => fs.existsSync(candidatePath)) ??
  filePathCandidates[0]

async function importProducts() {
  try {
    await mongoose.connect(process.env.MONGO_URI)

    const workbook = xlsx.readFile(filePath)
    const sheetName = workbook.SheetNames[0]
    const rows = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName])

    const products = rows.filter((row) => row.codigo_tipo && row.codigo).map((row) => ({
      codigo_tipo: row.codigo_tipo,
      codigo: row.codigo,
      item_original: row.item_original ?? row.item,
      nombre_producto: row.nombre_producto,
      modelo: row.modelo,
      homologacion: row.homologacion,
      color: row.color,
      talla: row.talla,
      clasificacion: row.clasificacion,
      unidad: row.unidad,
      precio: Number(row.precio || 0),
      moneda: row.moneda,
      proveedor: row.proveedor,
      activo: true,
    }))

    await Product.collection.drop().catch(() => {});await Product.syncIndexes()
    await Product.insertMany(products)

    console.log(`Productos importados: ${products.length}`)
    process.exit()
  } catch (error) {
    console.error(error)
    process.exit(1)
  }
}

importProducts()