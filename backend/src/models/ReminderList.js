import mongoose from 'mongoose'

// Guarda la lista de recordatorios de cada usuario en un solo documento.
const reminderListSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    items: { type: [mongoose.Schema.Types.Mixed], default: [] },
  },
  { timestamps: true }
)

export default mongoose.model('ReminderList', reminderListSchema)
