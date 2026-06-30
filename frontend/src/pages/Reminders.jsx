import { useState } from 'react'
import { Pencil, Trash2 } from 'lucide-react'

const initialForm = {
  title: '',
  description: '',
  alertDate: '',
}

export default function Reminders({ reminders, setReminders }) {
  const [form, setForm] = useState(initialForm)
  const [editingId, setEditingId] = useState(null)

  function handleChange(e) {
    const { name, value } = e.target

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  function handleSubmit(e) {
    e.preventDefault()

    if (!form.title || !form.alertDate) return

    if (editingId) {
      setReminders((prev) =>
        prev.map((reminder) =>
          reminder.id === editingId
            ? {
                ...reminder,
                ...form,
                updatedAt: new Date().toISOString(),
              }
            : reminder
        )
      )

      setEditingId(null)
      setForm(initialForm)
      return
    }

    const newReminder = {
      id: crypto.randomUUID(),
      ...form,
      createdAt: new Date().toISOString(),
    }

    setReminders((prev) => [newReminder, ...prev])
    setForm(initialForm)
  }

  function editReminder(reminder) {
    setEditingId(reminder.id)
    setForm({
      title: reminder.title,
      description: reminder.description,
      alertDate: reminder.alertDate,
    })
  }

  function deleteReminder(id) {
    setReminders((prev) =>
      prev.filter((reminder) => reminder.id !== id)
    )
  }

  const sortedReminders = [...reminders].sort(
    (a, b) => new Date(a.alertDate) - new Date(b.alertDate)
  )

  return (
    <section>
      <div className="orders-card">
        <div className="orders-header">
          <div>
            <h1>Recordatorios</h1>
            <p>Notas y alertas próximas de GOAPP</p>
          </div>
        </div>

        <form className="reminder-form" onSubmit={handleSubmit}>
          <div className="form-grid">
            <div className="field">
              <label>Título</label>
              <input
                name="title"
                value={form.title}
                onChange={handleChange}
                placeholder="Ej: Revisar factura OMP"
              />
            </div>

            <div className="field">
              <label>Fecha de alerta</label>
              <input
                name="alertDate"
                type="date"
                value={form.alertDate}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="field">
            <label>Descripción breve</label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              placeholder="Detalle del recordatorio"
            />
          </div>

          <button className="primary-btn" type="submit">
            {editingId ? 'Guardar cambios' : 'Agregar recordatorio'}
          </button>
        </form>

        <div className="reminders-list">
          {sortedReminders.length === 0 && (
            <div className="empty-row">
              Aún no hay recordatorios creados.
            </div>
          )}

          {sortedReminders.map((reminder) => (
            <div className="reminder-card" key={reminder.id}>
              <div>
                <h3>{reminder.title}</h3>
                <p>{reminder.description || 'Sin descripción'}</p>
                <small>Alerta: {reminder.alertDate}</small>
              </div>

              <div className="table-actions">
                <button
                  title="Editar"
                  onClick={() => editReminder(reminder)}
                >
                  <Pencil size={17} />
                </button>

                <button
                  title="Eliminar"
                  onClick={() => deleteReminder(reminder.id)}
                >
                  <Trash2 size={17} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}