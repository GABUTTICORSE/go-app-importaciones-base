import mongoose from 'mongoose'

const productLineSchema = new mongoose.Schema(
  {
    id: String,
    code: String,
    description: String,
    quantity: { type: Number, default: 0 },
    unitPrice: { type: Number, default: 0 },
  },
  { _id: false }
)

const statusHistorySchema = new mongoose.Schema(
  {
    status: String,
    date: Date,
    note: String,
  },
  { _id: false }
)

const operationSchema = new mongoose.Schema(
  {
    id: String,

    name: String,
    orderName: String,
    orderNumber: { type: String, required: true, unique: true },
    orderDate: Date,

    supplier: String,
    supplierName: String,

    product: String,
    productName: String,
    products: [productLineSchema],

    incoterm: { type: String, default: 'EXW' },
    status: { type: String, default: 'PEDIDO REALIZADO' },
    currency: { type: String, default: 'EUR' },
    exchangeRate: { type: Number, default: 1 },

    requestType: { type: String, default: 'PEDIDO REALIZADO' },
    requestDate: { type: Date, default: Date.now },
    rut: { type: String, default: '' },

    form: { type: mongoose.Schema.Types.Mixed, default: {} },
    totals: { type: mongoose.Schema.Types.Mixed, default: {} },

    statusHistory: [statusHistorySchema],

    documents: [
      {
        name: String,
        type: String,
        url: String,
        uploadedAt: { type: Date, default: Date.now },
      },
    ],

    tracking: [
      {
        status: String,
        note: String,
        date: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
)

operationSchema.pre('save', function (next) {
  if (!this.name && this.orderName) {
    this.name = this.orderName
  }

  if (!this.productName && this.product) {
    this.productName = this.product
  }

  if (!this.supplierName && this.supplier) {
    this.supplierName = this.supplier
  }

  next()
})

export default mongoose.model('Operation', operationSchema)