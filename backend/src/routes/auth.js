import { Router } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import pool from '../db.js'

const router = Router()

router.post('/login', async (req, res) => {
  const { usuario, contrasena } = req.body
  try {
    const [rows] = await pool.query('SELECT * FROM usuarios WHERE usuario = ?', [usuario])
    if (!rows.length) return res.status(401).json({ error: 'Credenciales inválidas' })
    const user = rows[0]
    const valid = await bcrypt.compare(contrasena, user.contrasena_hash)
    if (!valid) return res.status(401).json({ error: 'Credenciales inválidas' })
    const token = jwt.sign(
      { id: user.id, usuario: user.usuario, rol: user.rol },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    )
    res.json({ token, user: { id: user.id, usuario: user.usuario, nombre: user.nombre, rol: user.rol } })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

export default router
