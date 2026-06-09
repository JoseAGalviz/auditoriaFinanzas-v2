import express from 'express'
import cors from 'cors'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import 'dotenv/config'
import authRoutes from './routes/auth.js'
import incidenciasRoutes from './routes/incidencias.js'
import usuariosRoutes from './routes/usuarios.js'
import dashboardRoutes from './routes/dashboard.js'
import cobrosRoutes from './routes/cobros.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const app = express()

app.use(cors({ origin: '*', credentials: false }))
app.use(express.json())

app.use('/api/auth', authRoutes)
app.use('/api/incidencias', incidenciasRoutes)
app.use('/api/usuarios', usuariosRoutes)
app.use('/api/dashboard', dashboardRoutes)
app.use('/api/cobros', cobrosRoutes)

const distPath = join(__dirname, '../../frontend/dist')
app.use(express.static(distPath))
app.get('*', (req, res) => res.sendFile(join(distPath, 'index.html')))

const PORT = process.env.PORT || 3001
app.listen(PORT, '0.0.0.0', () => console.log(`Servidor en http://0.0.0.0:${PORT}`))
