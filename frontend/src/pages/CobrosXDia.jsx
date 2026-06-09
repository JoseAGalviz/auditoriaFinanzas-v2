import { useEffect, useState } from 'react'
import * as XLSX from 'xlsx'
import { Search, FileSpreadsheet, Filter, X, Loader2, TrendingUp } from 'lucide-react'
import api from '../services/api.js'

function today() {
  return new Date().toISOString().split('T')[0]
}

function firstAndLastOfMonth() {
  const now = new Date()
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const last = new Date(y, now.getMonth() + 1, 0).getDate()
  return { desde: `${y}-${m}-01`, hasta: `${y}-${m}-${String(last).padStart(2, '0')}` }
}

function formatFecha(f) {
  if (!f) return ''
  return typeof f === 'string' ? f.split('T')[0] : new Date(f).toISOString().split('T')[0]
}

async function fetchCobros(desde, hasta) {
  const params = new URLSearchParams()
  if (desde) params.append('desde', desde)
  if (hasta) params.append('hasta', hasta)
  const { data } = await api.get(`/cobros/por-dia?${params}`)
  return data
}

export default function CobrosXDia() {
  const { desde: mesDesde, hasta: mesHasta } = firstAndLastOfMonth()

  // Hoy
  const [todayRows, setTodayRows] = useState([])
  const [todayLoading, setTodayLoading] = useState(true)

  // Período
  const [desde, setDesde] = useState(mesDesde)
  const [hasta, setHasta] = useState(mesHasta)
  const [periodRows, setPeriodRows] = useState([])
  const [periodLoading, setPeriodLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    const t = today()
    fetchCobros(t, t).then(setTodayRows).finally(() => setTodayLoading(false))
    fetchCobros(mesDesde, mesHasta).then(setPeriodRows).finally(() => setPeriodLoading(false))
  }, [])

  async function consultarPeriodo() {
    setPeriodLoading(true)
    setSearch('')
    try {
      const data = await fetchCobros(desde, hasta)
      setPeriodRows(data)
    } finally {
      setPeriodLoading(false)
    }
  }

  // Resumen hoy por trabajador (ya viene agrupado por día, hoy = 1 día)
  const todayResumen = [...todayRows].sort((a, b) => b.total_cobros - a.total_cobros)
  const todayTotal = todayRows.reduce((s, r) => s + r.total_cobros, 0)

  // Período: resumen + detalle filtrados
  const periodFiltered = periodRows.filter(r => {
    const q = search.toLowerCase()
    return !q || r.nombre.toLowerCase().includes(q) || r.employee_i.toString().includes(q) || formatFecha(r.fecha).includes(q)
  })

  const periodResumen = Object.values(
    periodFiltered.reduce((acc, r) => {
      if (!acc[r.employee_i]) acc[r.employee_i] = { nombre: r.nombre, employee_i: r.employee_i, total: 0 }
      acc[r.employee_i].total += r.total_cobros
      return acc
    }, {})
  ).sort((a, b) => b.total - a.total)

  const periodTotal = periodFiltered.reduce((s, r) => s + r.total_cobros, 0)

  function exportar() {
    const data = [
      ['Trabajador', 'ID', 'Fecha', 'Cobros'],
      ...periodFiltered.map(r => [r.nombre, r.employee_i, formatFecha(r.fecha), r.total_cobros]),
    ]
    const ws = XLSX.utils.aoa_to_sheet(data)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Cobros')
    XLSX.writeFile(wb, `cobros_${desde}_${hasta}.xlsx`)
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 mb-1">Cobros por día</h1>
        <p className="text-slate-500 text-sm">Cantidad de cobros procesados por trabajador desde Profit</p>
      </div>

      {/* ── HOY ── */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp size={16} className="text-indigo-600" />
          <h2 className="text-base font-semibold text-slate-900">Hoy — {today()}</h2>
          {!todayLoading && (
            <span className="ml-auto text-xs text-slate-400">{todayTotal} cobros en total</span>
          )}
        </div>

        {todayLoading ? (
          <div className="flex items-center gap-2 py-6 text-slate-400 text-sm justify-center">
            <Loader2 size={16} className="animate-spin" /> Cargando...
          </div>
        ) : todayResumen.length === 0 ? (
          <p className="text-center py-6 text-slate-400 text-sm">Sin cobros registrados hoy</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {todayResumen.map(r => (
              <div key={r.employee_i} className="flex flex-col items-center gap-1 p-3 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-2xl font-bold text-indigo-600">{r.total_cobros}</span>
                <span className="text-xs font-medium text-slate-700 text-center leading-tight">{r.nombre}</span>
                <span className="text-xs text-slate-400">{r.employee_i}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── PERÍODO ── */}
      <div className="flex flex-col gap-4">
        {/* Filtros */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 flex flex-wrap gap-3 items-end">
          <div>
            <p className="text-xs font-medium text-slate-500 mb-1">Desde</p>
            <input
              type="date"
              value={desde}
              onChange={e => setDesde(e.target.value)}
              className="px-3 py-2 rounded-lg border border-slate-300 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
            />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 mb-1">Hasta</p>
            <input
              type="date"
              value={hasta}
              onChange={e => setHasta(e.target.value)}
              className="px-3 py-2 rounded-lg border border-slate-300 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
            />
          </div>
          <button
            onClick={consultarPeriodo}
            disabled={periodLoading}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white text-sm font-semibold rounded-lg transition-colors"
          >
            {periodLoading ? <Loader2 size={14} className="animate-spin" /> : <Filter size={14} />}
            Consultar
          </button>
          <button
            onClick={exportar}
            disabled={periodLoading || periodRows.length === 0}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white text-sm font-medium rounded-lg transition-colors"
          >
            <FileSpreadsheet size={14} />
            Exportar
          </button>
          <div className="relative ml-auto">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Buscar..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9 pr-8 py-2 rounded-lg border border-slate-300 text-sm text-slate-900 placeholder-slate-400 outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all w-48"
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                <X size={12} />
              </button>
            )}
          </div>
        </div>

        {periodLoading ? (
          <div className="flex items-center justify-center py-12 gap-2 text-slate-500 text-sm">
            <Loader2 size={18} className="animate-spin" /> Cargando datos de Profit...
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Resumen por trabajador */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
                <h2 className="text-sm font-semibold text-slate-900 mb-1">Resumen del período</h2>
                <p className="text-xs text-slate-400 mb-4">{desde} → {hasta}</p>
                <div className="flex flex-col gap-3">
                  {periodResumen.length === 0 ? (
                    <p className="text-xs text-slate-400 text-center py-4">Sin datos</p>
                  ) : periodResumen.map(r => (
                    <div key={r.employee_i} className="flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-slate-800 truncate">{r.nombre}</p>
                        <p className="text-xs text-slate-400">{r.employee_i}</p>
                      </div>
                      <span className="flex-shrink-0 inline-flex items-center justify-center min-w-8 h-7 px-2 rounded-full bg-indigo-100 text-indigo-700 text-xs font-bold">
                        {r.total}
                      </span>
                    </div>
                  ))}
                </div>
                {periodResumen.length > 0 && (
                  <div className="mt-4 pt-3 border-t border-slate-100 flex justify-between text-sm">
                    <span className="text-slate-500">Total</span>
                    <span className="font-bold text-slate-900">{periodTotal}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Detalle por día */}
            <div className="lg:col-span-3">
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
                <h2 className="text-sm font-semibold text-slate-900 mb-4">
                  Detalle por día
                  <span className="ml-2 text-xs font-normal text-slate-400">{periodFiltered.length} registros</span>
                </h2>
                <div className="overflow-auto rounded-lg border border-slate-100">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-100">
                        <th className="px-3 py-2.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Fecha</th>
                        <th className="px-3 py-2.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Trabajador</th>
                        <th className="px-3 py-2.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">ID</th>
                        <th className="px-3 py-2.5 text-center text-xs font-semibold text-slate-500 uppercase tracking-wide">Cobros</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {periodFiltered.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="px-3 py-8 text-center text-slate-400 text-xs">
                            Sin registros en el período seleccionado
                          </td>
                        </tr>
                      ) : periodFiltered.map((r, i) => (
                        <tr key={i} className="hover:bg-slate-50 transition-colors">
                          <td className="px-3 py-2.5 text-slate-500 whitespace-nowrap">{formatFecha(r.fecha)}</td>
                          <td className="px-3 py-2.5 font-medium text-slate-800">{r.nombre}</td>
                          <td className="px-3 py-2.5 text-slate-400 text-xs">{r.employee_i}</td>
                          <td className="px-3 py-2.5 text-center">
                            <span className="inline-flex items-center justify-center min-w-8 h-7 px-2 rounded-full bg-indigo-50 text-indigo-700 text-xs font-bold">
                              {r.total_cobros}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
