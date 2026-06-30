import mongoose from 'mongoose'

const productSchema = new mongoose.Schema(
  {
    codigo_tipo: String,
    codigo: { type: String, unique: true },
    item_original: String,
    nombre_producto: String,
    modelo: String,
    homologacion: String,
    color: String,
    talla: String,
    clasificacion: String,
    unidad: String,
    precio: Number,
    moneda: String,
    proveedor: String,
    activo: { type: Boolean, default: true },
  },
  { timestamps: true }
)

export default mongoose.model('Product', productSchema)