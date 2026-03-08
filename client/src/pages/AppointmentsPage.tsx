import { useState, useEffect, type FormEvent } from 'react'
import { api } from '../api/client'
import styles from './Page.module.css'

type AppointmentStatus = 'SCHEDULED' | 'COMPLETED' | 'CANCELLED'
type AppointmentType = 'INITIAL' | 'FOLLOWUP' | 'LAB_RESULT' | 'TELEMEDICINE'

interface Appointment {
  id: string
  scheduledAt: string
  type: AppointmentType
  status: AppointmentStatus
  notes: string | null
  patient: { user: { name: string } }
  professional: { user: { name: string } }
}

interface CreateAppointmentBody {
  patientId: string
  professionalId: string
  scheduledAt: string
  type: AppointmentType
  notes: string
}

const TYPE_LABELS: Record<AppointmentType, string> = {
  INITIAL: 'Inicial',
  FOLLOWUP: 'Retorno',
  LAB_RESULT: 'Resultado Lab.',
  TELEMEDICINE: 'Telemedicina',
}

const STATUS_BADGE: Record<AppointmentStatus, string> = {
  SCHEDULED: 'badge-blue',
  COMPLETED: 'badge-green',
  CANCELLED: 'badge-red',
}

const STATUS_LABELS: Record<AppointmentStatus, string> = {
  SCHEDULED: 'Agendada',
  COMPLETED: 'Concluída',
  CANCELLED: 'Cancelada',
}

const initialForm: CreateAppointmentBody = {
  patientId: '',
  professionalId: '',
  scheduledAt: '',
  type: 'FOLLOWUP',
  notes: '',
}

export function AppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<CreateAppointmentBody>(initialForm)
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState('')
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  async function load() {
    setLoading(true)
    setError('')
    try {
      const data = await api.get<Appointment[]>('/api/appointments')
      setAppointments(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar consultas')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { void load() }, [])

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setFormError('')
    setSubmitting(true)
    try {
      await api.post('/api/appointments', form)
      setForm(initialForm)
      setShowForm(false)
      await load()
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Erro ao criar consulta')
    } finally {
      setSubmitting(false)
    }
  }

  async function updateStatus(id: string, action: 'cancel' | 'complete') {
    setActionLoading(id + action)
    try {
      await api.patch(`/api/appointments/${id}/${action}`)
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao atualizar consulta')
    } finally {
      setActionLoading(null)
    }
  }

  function formatDate(iso: string) {
    return new Date(iso).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })
  }

  return (
    <div>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Consultas</h1>
          <p className={styles.pageSubtitle}>{appointments.length} consulta(s)</p>
        </div>
        <button className="btn-primary" onClick={() => setShowForm(v => !v)}>
          {showForm ? 'Cancelar' : '+ Nova Consulta'}
        </button>
      </div>

      {showForm && (
        <div className={`card ${styles.formCard}`}>
          <h2 className={styles.formTitle}>Nova Consulta</h2>
          {formError && <div className="error-msg">{formError}</div>}
          <form onSubmit={handleSubmit}>
            <div className={styles.formGrid}>
              <div className="form-group">
                <label htmlFor="patientId">ID do Paciente</label>
                <input id="patientId" name="patientId" value={form.patientId} onChange={handleChange} placeholder="UUID do paciente" required />
              </div>
              <div className="form-group">
                <label htmlFor="professionalId">ID do Profissional</label>
                <input id="professionalId" name="professionalId" value={form.professionalId} onChange={handleChange} placeholder="UUID do profissional" required />
              </div>
              <div className="form-group">
                <label htmlFor="scheduledAt">Data e hora</label>
                <input id="scheduledAt" name="scheduledAt" type="datetime-local" value={form.scheduledAt} onChange={handleChange} required />
              </div>
              <div className="form-group">
                <label htmlFor="type">Tipo</label>
                <select id="type" name="type" value={form.type} onChange={handleChange}>
                  {(Object.keys(TYPE_LABELS) as AppointmentType[]).map(t => (
                    <option key={t} value={t}>{TYPE_LABELS[t]}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="form-group">
              <label htmlFor="notes">Observações</label>
              <textarea id="notes" name="notes" value={form.notes} onChange={handleChange} rows={2} placeholder="Opcional" style={{ resize: 'vertical' }} />
            </div>
            <div className={styles.formActions}>
              <button type="button" className="btn-outline" onClick={() => setShowForm(false)}>Cancelar</button>
              <button type="submit" className="btn-primary" disabled={submitting}>
                {submitting ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div className={styles.empty}>Carregando...</div>
        ) : error ? (
          <div className={styles.empty} style={{ color: 'var(--color-danger)' }}>{error}</div>
        ) : appointments.length === 0 ? (
          <div className={styles.empty}>Nenhuma consulta encontrada.</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Paciente</th>
                <th>Profissional</th>
                <th>Data</th>
                <th>Tipo</th>
                <th>Status</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {appointments.map(a => (
                <tr key={a.id}>
                  <td>{a.patient.user.name}</td>
                  <td>{a.professional.user.name}</td>
                  <td>{formatDate(a.scheduledAt)}</td>
                  <td>{TYPE_LABELS[a.type]}</td>
                  <td><span className={`badge ${STATUS_BADGE[a.status]}`}>{STATUS_LABELS[a.status]}</span></td>
                  <td>
                    {a.status === 'SCHEDULED' && (
                      <div style={{ display: 'flex', gap: '0.4rem' }}>
                        <button
                          className="btn-primary"
                          style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem' }}
                          disabled={actionLoading === a.id + 'complete'}
                          onClick={() => updateStatus(a.id, 'complete')}
                        >
                          Concluir
                        </button>
                        <button
                          className="btn-danger"
                          style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem' }}
                          disabled={actionLoading === a.id + 'cancel'}
                          onClick={() => updateStatus(a.id, 'cancel')}
                        >
                          Cancelar
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
