import { useEffect, useState } from 'react'
import { AlertTriangle, Users, FileText } from 'lucide-react'
import api from '../services/api.js'

const cards = [
  {
    key: 'puntosNegativos',
    label: 'Puntos negativos',
    icon: AlertTriangle,
    bg: 'from-red-500 to-rose-600',
    shadow: 'shadow-red-200',
  },
  {
    key: 'totalUsuarios',
    label: 'Usuarios',
    icon: Users,
    bg: 'from-indigo-500 to-violet-600',
    shadow: 'shadow-indigo-200',
  },
  {
    key: 'totalIncidencias',
    label: 'Incidencias',
    icon: FileText,
    bg: 'from-amber-500 to-orange-600',
    shadow: 'shadow-amber-200',
  },
]

export default function Dashboard() {
  const [stats, setStats] = useState({ totalUsuarios: 0, totalIncidencias: 0, puntosNegativos: 0 })

  useEffect(() => {
    api.get('/dashboard/stats')
      .then(({ data }) => setStats(data))
      .catch(console.error)
  }, [])

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900 mb-1">Panel de control</h1>
      <p className="text-slate-500 text-sm mb-8">Resumen de actividad del sistema</p>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 max-w-3xl">
        {cards.map(({ key, label, icon: Icon, bg, shadow }) => (
          <div
            key={key}
            className={`bg-gradient-to-br ${bg} rounded-2xl p-5 text-white shadow-lg ${shadow}`}
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-white/70 text-xs font-medium uppercase tracking-wide mb-1">{label}</p>
                <p className="text-4xl font-bold">{stats[key]}</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                <Icon size={20} className="text-white" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
