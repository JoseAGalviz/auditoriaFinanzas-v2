import { useEffect, useRef, useState } from 'react'
import * as XLSX from 'xlsx'
import { Search, FileSpreadsheet, Filter, X, Loader2 } from 'lucide-react'
import api from '../services/api.js'

const TIPOS = [
  'Error de transcripcion',
  'Cobros procesados a facturas que no envio el cliente',
  'Cobros procesados a factura reciente cuando exiten vencidas sin cumplir el proceso',
  'Pagos compartidos sin adicionales o numero de cobro',
  'Pagos dobles',
  'OMITIO EL SALDO A FAVOR',
  'No procesar pagos',
]

function today() {
  return new Date().toISOString().split('T')[0]
}

const emptyForm = { usuario_id: '', nombre: '', tipo: '', descripcion: '', fecha_opcion: 'hoy', fecha: '' }

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

function Select({ className = '', children, ...props }) {
  return (
    <select
      className={`w-full px-3 py-2 rounded-lg border border-slate-300 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all bg-white ${className}`}
      {...props}
    >
      {children}
    </select>
  )
}

function TrabajadorCombobox({ trabajadores, value, onChange }) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const ref = useRef(null)

  const selected = trabajadores.find(t => t.id === value) || null

  const filtered = trabajadores.filter(t => {
    if (!query) return true
    const q = query.toLowerCase()
    return t.nombre.toLowerCase().includes(q) || t.id.toString().includes(q)
  })

  useEffect(() => {
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  function select(t) {
    onChange(t)
    setQuery('')
    setOpen(false)
  }

  function clear(e) {
    e.stopPropagation()
    onChange(null)
    setQuery('')
    setOpen(false)
  }

  return (
    <div ref={ref} className="relative">
      <div className="relative">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
        <input
          type="text"
          className="w-full pl-9 pr-8 py-2 rounded-lg border border-slate-300 text-sm text-slate-900 placeholder-slate-400 outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
          placeholder="Buscar trabajador..."
          value={open ? query : (selected ? selected.nombre : '')}
          onFocus={() => { setOpen(true); setQuery('') }}
          onChange={e => setQuery(e.target.value)}
        />
        {selected && !open && (
          <button
            type="button"
            onClick={clear}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
          >
            <X size={14} />
          </button>
        )}
      </div>
      {open && (
        <ul className="absolute z-50 mt-1 w-full max-h-52 overflow-auto bg-white border border-slate-200 rounded-lg shadow-lg">
          {filtered.length === 0 ? (
            <li className="px-3 py-3 text-xs text-slate-400 text-center">Sin resultados</li>
          ) : filtered.map(t => (
            <li
              key={t.id}
              onMouseDown={() => select(t)}
              className={`px-3 py-2 text-sm cursor-pointer flex items-center justify-between gap-2 hover:bg-indigo-50 ${selected?.id === t.id ? 'bg-indigo-50 text-indigo-700 font-medium' : 'text-slate-800'}`}
            >
              <span>{t.nombre}</span>
              <span className="text-slate-400 text-xs flex-shrink-0">{t.id}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export default function Incidencias() {
  const [trabajadores, setTrabajadores] = useState([])
  const [incidencias, setIncidencias] = useState([])
  const [porDia, setPorDia] = useState([])
  const [filtroDia, setFiltroDia] = useState('')
  const [form, setForm] = useState(emptyForm)
  const [search, setSearch] = useState('')
  const [exportDesde, setExportDesde] = useState('')
  const [exportHasta, setExportHasta] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    api.get('/incidencias/trabajadores').then(({ data }) => setTrabajadores(data))
    loadIncidencias()
    loadPorDia('')
  }, [])

  function loadIncidencias() {
    api.get('/incidencias').then(({ data }) => setIncidencias(data))
  }

  function loadPorDia(fecha) {
    const q = fecha ? `?filtro_fecha=${fecha}` : ''
    api.get(`/incidencias/por-dia${q}`).then(({ data }) => setPorDia(data))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.usuario_id) return
    setLoading(true)
    try {
      const fecha = form.fecha_opcion === 'hoy' ? today() : form.fecha
      await api.post('/incidencias', {
        usuario_id: form.usuario_id,
        nombre: form.nombre,
        tipo: form.tipo,
        descripcion: form.descripcion,
        fecha,
      })
      setForm(emptyForm)
      loadIncidencias()
      loadPorDia(filtroDia)
    } finally {
      setLoading(false)
    }
  }

  const incidenciasFiltradas = incidencias.filter(i => {
    const q = search.toLowerCase()
    return !q || [i.nombre, i.usuario, i.tipo, i.descripcion, i.fecha].some(
      v => v?.toLowerCase().includes(q)
    )
  })

  function exportarExcel() {
    const rows = incidencias.filter(i => {
      let ok = true
      if (exportDesde) ok = ok && i.fecha >= exportDesde
      if (exportHasta) ok = ok && i.fecha <= exportHasta
      return ok
    })
    const data = [
      ['Trabajador', 'ID', 'Tipo', 'Descripción', 'Fecha'],
      ...rows.map(i => [i.nombre, i.usuario, i.tipo, i.descripcion, i.fecha]),
    ]
    const ws = XLSX.utils.aoa_to_sheet(data)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Incidencias')
    let filename = 'incidencias'
    if (exportDesde) filename += '_' + exportDesde
    if (exportHasta) filename += '_a_' + exportHasta
    XLSX.writeFile(wb, filename + '.xlsx')
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900 mb-1">Incidencias</h1>
      <p className="text-slate-500 text-sm mb-6">Registro y seguimiento de incidencias</p>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Left column */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          {/* Form card */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <h2 className="text-base font-semibold text-slate-900 mb-5">Registrar incidencia</h2>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div>
                <Label>Trabajador</Label>
                <TrabajadorCombobox
                  trabajadores={trabajadores}
                  value={form.usuario_id}
                  onChange={t => setForm(f => ({ ...f, usuario_id: t?.id || '', nombre: t?.nombre || '' }))}
                />
                {!form.usuario_id && (
                  <p className="text-xs text-slate-400 mt-1">Selecciona un trabajador para continuar</p>
                )}
              </div>

              <div>
                <Label>Tipo de incidencia</Label>
                <Select
                  value={form.tipo}
                  onChange={e => setForm(f => ({ ...f, tipo: e.target.value }))}
                  required
                >
                  <option value="">Selecciona el tipo</option>
                  {TIPOS.map(t => <option key={t} value={t}>{t}</option>)}
                </Select>
              </div>

              <div>
                <Label>Descripción</Label>
                <textarea
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all resize-none"
                  rows={3}
                  value={form.descripcion}
                  onChange={e => setForm(f => ({ ...f, descripcion: e.target.value }))}
                  required
                />
              </div>

              <div>
                <Label>Fecha</Label>
                <div className="flex gap-4 mb-2">
                  {['hoy', 'otro'].map(op => (
                    <label key={op} className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer">
                      <input
                        type="radio"
                        className="accent-indigo-600"
                        checked={form.fecha_opcion === op}
                        onChange={() => setForm(f => ({ ...f, fecha_opcion: op, fecha: '' }))}
                      />
                      {op === 'hoy' ? 'Hoy' : 'Otra fecha'}
                    </label>
                  ))}
                </div>
                {form.fecha_opcion === 'otro' && (
                  <Input
                    type="date"
                    value={form.fecha}
                    onChange={e => setForm(f => ({ ...f, fecha: e.target.value }))}
                    required
                  />
                )}
              </div>

              <button
                type="submit"
                disabled={loading || !form.usuario_id}
                className="flex items-center justify-center gap-2 w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white text-sm font-semibold rounded-lg transition-colors"
              >
                {loading ? <><Loader2 size={15} className="animate-spin" /> Registrando...</> : 'Registrar incidencia'}
              </button>
            </form>
          </div>

          {/* Por día card */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <h2 className="text-base font-semibold text-slate-900 mb-4">Incidencias por día</h2>
            <div className="flex gap-2 mb-4">
              <Input
                type="date"
                className="flex-1"
                value={filtroDia}
                onChange={e => setFiltroDia(e.target.value)}
              />
              <button
                onClick={() => loadPorDia(filtroDia)}
                className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm transition-colors"
              >
                <Filter size={14} />
              </button>
              <button
                onClick={() => { setFiltroDia(''); loadPorDia('') }}
                className="px-3 py-2 border border-slate-300 text-slate-600 hover:bg-slate-50 rounded-lg text-sm transition-colors"
              >
                <X size={14} />
              </button>
            </div>
            <div className="overflow-auto rounded-lg border border-slate-100">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    <th className="px-3 py-2.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Fecha</th>
                    <th className="px-3 py-2.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Trabajador</th>
                    <th className="px-3 py-2.5 text-center text-xs font-semibold text-slate-500 uppercase tracking-wide">Pts</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {porDia.length === 0 ? (
                    <tr><td colSpan={3} className="px-3 py-6 text-center text-slate-400 text-xs">Sin registros</td></tr>
                  ) : porDia.map((r, i) => (
                    <tr key={i} className="hover:bg-slate-50 transition-colors">
                      <td className="px-3 py-2.5 text-slate-600">{r.fecha}</td>
                      <td className="px-3 py-2.5 text-slate-800 font-medium">{r.nombre}</td>
                      <td className="px-3 py-2.5 text-center">
                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-red-100 text-red-700 text-xs font-bold">
                          {r.puntos_dia}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right column — tabla completa */}
        <div className="lg:col-span-3">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <h2 className="text-base font-semibold text-slate-900 mb-4">Incidencias registradas</h2>
            <div className="flex items-center gap-3 mb-4 flex-wrap">
              <div className="relative flex-1 min-w-48">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-300 text-sm text-slate-900 placeholder-slate-400 outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                  placeholder="Buscar..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
              </div>
              <Input type="date" className="w-36" title="Desde" value={exportDesde} onChange={e => setExportDesde(e.target.value)} />
              <Input type="date" className="w-36" title="Hasta" value={exportHasta} onChange={e => setExportHasta(e.target.value)} />
              <button
                onClick={exportarExcel}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-lg transition-colors whitespace-nowrap"
              >
                <FileSpreadsheet size={15} />
                Exportar
              </button>
            </div>

            <div className="overflow-auto rounded-lg border border-slate-100">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    {['Trabajador', 'Tipo', 'Descripción', 'Fecha'].map(h => (
                      <th key={h} className="px-3 py-2.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {incidenciasFiltradas.length === 0 ? (
                    <tr><td colSpan={4} className="px-3 py-8 text-center text-slate-400 text-xs">Sin incidencias registradas</td></tr>
                  ) : incidenciasFiltradas.map(i => (
                    <tr key={i.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-3 py-2.5 font-medium text-slate-800 whitespace-nowrap">{i.nombre}</td>
                      <td className="px-3 py-2.5 max-w-48">
                        <span className="inline-block px-2 py-0.5 rounded-full bg-red-50 text-red-700 text-xs font-medium leading-tight">
                          {i.tipo}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 text-slate-600 max-w-xs truncate">{i.descripcion}</td>
                      <td className="px-3 py-2.5 text-slate-500 whitespace-nowrap">{i.fecha}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
