export const crud = (Model) => ({
  list: async (_req, res) => res.json(await Model.find().sort({ createdAt: -1 }).limit(200)),
  get: async (req, res) => { const item = await Model.findById(req.params.id); if (!item) return res.status(404).json({ message: 'No encontrado' }); res.json(item); },
  create: async (req, res) => res.status(201).json(await Model.create(req.body)),
  update: async (req, res) => { const item = await Model.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true }); if (!item) return res.status(404).json({ message: 'No encontrado' }); res.json(item); },
  remove: async (req, res) => { await Model.findByIdAndDelete(req.params.id); res.status(204).end(); }
});
