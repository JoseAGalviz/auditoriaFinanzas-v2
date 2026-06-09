import { useEffect, useState } from 'react'
import { Pencil, Trash2, X, Loader2 } from 'lucide-react'
import api from '../services/api.js'

const ROLES = ['Administrador', 'Auditor', 'Trabajador']
const emptyForm = { usuario: '', nombre: '', contrasena: '', rol: '' }

function Label({ children }) {
  return <label className="block text-sm font-medium text-slate-700 mb-1.5">{children}</label>
}

function Input({ className = '', ...props }) {
  return (
    <input
      className={`w-full px-3 py-2 rounded-lg border border-slate-300 text-sm text-slate-900 placeholder-slate-400 outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all ${className}`}
      {...props}
    />
  )
}

function Select({ children, ...props }) {
  return (
    <select
      className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all bg-white"
      {...props}
    >
      {children}
    </select>
  )
}

function Modal({ open, onClose, title, children }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <h3 className="text-base font-semibold text-slate-900">{title}</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors">
            <X size={16} />
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}

const rolColors = {
  Administrador: 'bg-violet-100 text-violet-700',
  Auditor: 'bg-blue-100 text-blue-700',
  Trabajador: 'bg-slate-100 text-slate-600',
}

export default function Usuarios() {
  const [usuarios, setUsuarios] = useState([])
  const [form, setForm] = useState(emptyForm)
  const [editando, setEditando] = useState(null)
  const [editForm, setEditForm] = useState({ nombre: '', rol: '', contrasena: '' })
  const [saving, setSaving] = useState(false)

  useEffect(() => { loadUsuarios() }, [])

  function loadUsuarios() {
    api.get('/usuarios').then(({ data }) => setUsuarios(data))
  }

  async function handleCreate(e) {
    e.preventDefault()
    setSaving(true)
    try {
      await api.post('/usuarios', form)
      setForm(emptyForm)
      loadUsuarios()
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id) {
    if (!confirm('¿Seguro que deseas eliminar este usuario?')) return
    await api.delete(`/usuarios/${id}`)
    loadUsuarios()
  }

  function openEdit(u) {
    setEditando(u)
    setEditForm({ nombre: u.nombre, rol: u.rol, contrasena: '' })
  }

  async function handleEdit(e) {
    e.preventDefault()
    setSaving(true)
    try {
      await api.put(`/usuarios/${editando.id}`, editForm)
      loadUsuarios()
      setEditando(null)
    } finally {
      setSaving(false)
    }
  }

  const esAdmin = form.rol && form.rol !== 'Trabajador'

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900 mb-1">Usuarios</h1>
      <p className="text-slate-500 text-sm mb-6">Gestión de usuarios del sistema</p>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <h2 className="text-base font-semibold text-slate-900 mb-5">Nuevo usuario</h2>
          <form onSubmit={handleCreate} className="flex flex-col gap-4">
            <div>
              <Label>Rol</Label>
              <Select
                value={form.rol}
                onChange={e => setForm(f => ({ ...f, rol: e.target.value, usuario: '', contrasena: '' }))}
                required
              >
                <option value="">Selecciona un rol</option>
                <option value="Administrador">Administrador</option>
                <option value="Trabajador">Trabajador</option>
              </Select>
            </div>

            <div>
              <Label>Nombre completo</Label>
              <Input
                type="text"
                placeholder="Nombre del usuario"
                value={form.nombre}
                onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))}
                required
              />
            </div>

            {esAdmin && (
              <>
                <div>
                  <Label>Usuario</Label>
                  <Input
                    type="text"
                    placeholder="Nombre de login"
                    value={form.usuario}
                    onChange={e => setForm(f => ({ ...f, usuario: e.target.value }))}
                  />
                </div>
                <div>
                  <Label>Contraseña</Label>
                  <Input
                    type="password"
                    placeholder="Contraseña"
                    value={form.contrasena}
                    onChange={e => setForm(f => ({ ...f, contrasena: e.target.value }))}
                  />
                </div>
              </>
            )}

            <button
              type="submit"
              disabled={saving}
              className="flex items-center justify-center gap-2 w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white text-sm font-semibold rounded-lg transition-colors mt-1"
            >
              {saving ? <><Loader2 size={15} className="animate-spin" /> Registrando...</> : 'Registrar usuario'}
            </button>
          </form>
        </div>

        {/* Table */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <h2 className="text-base font-semibold text-slate-900 mb-4">Usuarios registrados</h2>
            <div className="overflow-auto rounded-lg border border-slate-100">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    {['Nombre', 'Usuario', 'Rol', 'Acciones'].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {usuarios.length === 0 ? (
                    <tr><td colSpan={4} className="px-4 py-8 text-center text-slate-400 text-xs">Sin usuarios registrados</td></tr>
                  ) : usuarios.map(u => (
                    <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3 font-medium text-slate-800">{u.nombre}</td>
                      <td className="px-4 py-3 text-slate-500">{u.usuario || '—'}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium ${rolColors[u.rol] || 'bg-slate-100 text-slate-600'}`}>
                          {u.rol}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => openEdit(u)}
                            className="p-1.5 rounded-lg text-amber-600 hover:bg-amber-50 transition-colors"
                            title="Editar"
                          >
                            <Pencil size={14} />
                          </button>
                          <button
                            onClick={() => handleDelete(u.id)}
                            className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 transition-colors"
                            title="Eliminar"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      <Modal open={!!editando} onClose={() => setEditando(null)} title="Editar usuario">
        <form onSubmit={handleEdit} className="px-6 py-5 flex flex-col gap-4">
          <div>
            <Label>Usuario</Label>
            <Input type="text" value={editando?.usuario || ''} readOnly className="bg-slate-50 text-slate-400 cursor-not-allowed" />
          </div>
          <div>
            <Label>Nombre</Label>
            <Input
              type="text"
              value={editForm.nombre}
              onChange={e => setEditForm(f => ({ ...f, nombre: e.target.value }))}
              required
            />
          </div>
          <div>
            <Label>Rol</Label>
            <Select value={editForm.rol} onChange={e => setEditForm(f => ({ ...f, rol: e.target.value }))} required>
              {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
            </Select>
          </div>
          <div>
            <Label>Nueva contraseña</Label>
            <Input
              type="password"
              placeholder="Dejar vacío para no cambiar"
              value={editForm.contrasena}
              onChange={e => setEditForm(f => ({ ...f, contrasena: e.target.value }))}
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setEditando(null)}
              className="px-4 py-2 text-sm font-medium text-slate-700 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 rounded-lg transition-colors"
            >
              {saving ? <><Loader2 size={14} className="animate-spin" /> Guardando...</> : 'Guardar cambios'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
