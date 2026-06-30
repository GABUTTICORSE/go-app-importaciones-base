import Operation from '../models/Operation.js';
import { calculateImportCosts } from '../utils/costs.js';
export async function list(req, res) { const q = req.query.q ? { name: new RegExp(req.query.q, 'i') } : {}; res.json(await Operation.find(q).populate('supplier product').sort({ createdAt: -1 }).limit(200)); }
export async function get(req, res) { const item = await Operation.findById(req.params.id).populate('supplier product'); if (!item) return res.status(404).json({ message: 'No encontrado' }); res.json(item); }
export async function create(req, res) { const costs = calculateImportCosts(req.body); const item = await Operation.create({ ...req.body, ...costs, tracking: [{ status: req.body.status || 'Solicitud', note: 'Operación creada' }] }); res.status(201).json(item); }
export async function update(req, res) { const costs = calculateImportCosts(req.body); const item = await Operation.findByIdAndUpdate(req.params.id, { ...req.body, ...costs }, { new: true, runValidators: true }); if (!item) return res.status(404).json({ message: 'No encontrado' }); res.json(item); }
export async function remove(req, res) { await Operation.findByIdAndDelete(req.params.id); res.status(204).end(); }
export async function addTracking(req, res) { const { status, note } = req.body; const item = await Operation.findByIdAndUpdate(req.params.id, { $set: { status }, $push: { tracking: { status, note } } }, { new: true }); res.json(item); }
export function calculate(req, res) { res.json(calculateImportCosts(req.body)); }
