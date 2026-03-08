import { useState, useEffect, type FormEvent } from 'react'
import { api } from '../api/client'
import styles from './Page.module.css'

interface Patient {
  id: string
  cpf: string
  phone: string
  consentGiven: boolean
  deletedAt: string | null
  user: { name: string; email: string }
}

interface CreatePatientBody {
  cpf: string
  dateOfBirth: string
  phone: string
  address: string
  consentGiven: boolean
}

const initialForm: CreatePatientBody = {
  cpf: '',
  dateOfBirth: '',
  phone: '',
  address: '',
  consentGiven: false,
}

export function PatientsPage() {
  const [patients, setPatients] = useState<Patient[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<CreatePatientBody>(initialForm)
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState('')

  async function load() {
    setLoading(true)
    setError('')
    try {
      const data = await api.get<Patient[]>('/api/patients')
      setPatients(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar pacientes')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { void load() }, [])

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value, type, checked } = e.target
    setForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }))
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setFormError('')
    setSubmitting(true)
    try {
      await api.post('/api/patients', form)
      setForm(initialForm)
      setShowForm(false)
      await load()
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Erro ao criar paciente')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Pacientes</h1>
          <p className={styles.pageSubtitle}>{patients.length} paciente(s) cadastrado(s)</p>
        </div>
        <button className="btn-primary" onClick={() => setShowForm(v => !v)}>
          {showForm ? 'Cancelar' : '+ Novo Paciente'}
        </button>
      </div>

      {showForm && (
        <div className={`card ${styles.formCard}`}>
          <h2 className={styles.formTitle}>Novo Paciente</h2>
          {formError && <div className="error-msg">{formError}</div>}
          <form onSubmit={handleSubmit}>
            <div className={styles.formGrid}>
              <div className="form-group">
                <label htmlFor="cpf">CPF</label>
                <input id="cpf" name="cpf" value={form.cpf} onChange={handleChange} placeholder="000.000.000-00" required />
              </div>
              <div className="form-group">
                <label htmlFor="dateOfBirth">Data de nascimento</label>
                <input id="dateOfBirth" name="dateOfBirth" type="date" value={form.dateOfBirth} onChange={handleChange} required />
              </div>
              <div className="form-group">
                <label htmlFor="phone">Telefone</label>
                <input id="phone" name="phone" value={form.phone} onChange={handleChange} placeholder="(00) 00000-0000" required />
              </div>
              <div className="form-group">
                <label htmlFor="address">Endereço</label>
                <input id="address" name="address" value={form.address} onChange={handleChange} placeholder="Rua, número, cidade" required />
              </div>
            </div>
            <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <input
                id="consentGiven"
                name="consentGiven"
                type="checkbox"
                checked={form.consentGiven}
                onChange={handleChange}
                style={{ width: 'auto' }}
              />
              <label htmlFor="consentGiven" style={{ margin: 0 }}>Consentimento LGPD fornecido</label>
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
        ) : patients.length === 0 ? (
          <div className={styles.empty}>Nenhum paciente encontrado.</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Nome</th>
                <th>E-mail</th>
                <th>Telefone</th>
                <th>Consentimento</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {patients.map(p => (
                <tr key={p.id}>
                  <td>{p.user.name}</td>
                  <td>{p.user.email}</td>
                  <td>{p.phone}</td>
                  <td>
                    {p.consentGiven
                      ? <span className="badge badge-green">Sim</span>
                      : <span className="badge badge-red">Não</span>}
                  </td>
                  <td>
                    {p.deletedAt
                      ? <span className="badge badge-gray">Inativo</span>
                      : <span className="badge badge-green">Ativo</span>}
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
