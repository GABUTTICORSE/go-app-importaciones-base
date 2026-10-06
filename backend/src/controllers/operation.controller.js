import Operation from '../models/Operation.js'
import { calculateImportCosts } from '../utils/costs.js'

// Escapa caracteres especiales para que la búsqueda sea texto literal
// (evita errores y búsquedas que bloquean el servidor).
const escapeRegex = (text) => String(text).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

// Campos que el cliente nunca debe poder sobrescribir directamente
function cleanBody(body = {}) {
  const { _id, __v, createdAt, updatedAt, ...rest } = body
  return rest
}

export async function list(req, res) {
  const q = req.query.q
    ? { name: new RegExp(escapeRegex(req.query.q).slice(0, 100), 'i') }
    : {}
  res.json(await Operation.find(q).sort({ createdAt: -1 }).limit(200))
}

export async function get(req, res) {
  const item = await Operation.findById(req.params.id)
  if (!item) return res.status(404).json({ message: 'No encontrado' })
  res.json(item)
}

export async function create(req, res) {
  const body = cleanBody(req.body)
  const costs = calculateImportCosts(body)
  const item = await Operation.create({
    ...body,
    ...costs,
    tracking: [{ status: body.status || 'Solicitud', note: 'Operación creada' }],
  })
  res.status(201).json(item)
}

export async function update(req, res) {
  const body = cleanBody(req.body)
  const costs = calculateImportCosts(body)
  const item = await Operation.findByIdAndUpdate(
    req.params.id,
    { ...body, ...costs },
    { new: true, runValidators: true }
  )
  if (!item) return res.status(404).json({ message: 'No encontrado' })
  res.json(item)
}

export async function remove(req, res) {
  const item = await Operation.findByIdAndDelete(req.params.id)
  if (!item) return res.status(404).json({ message: 'No encontrado' })
  res.status(204).end()
}

export async function addTracking(req, res) {
  const { status, note } = req.body
  const item = await Operation.findByIdAndUpdate(
    req.params.id,
    { $set: { status }, $push: { tracking: { status, note } } },
    { new: true }
  )
  if (!item) return res.status(404).json({ message: 'No encontrado' })
  res.json(item)
}

export function calculate(req, res) {
  res.json(calculateImportCosts(req.body))
}
