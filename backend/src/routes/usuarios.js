import { Router } from 'express'
import bcrypt from 'bcryptjs'
import pool from '../db.js'
import { verifyToken } from '../middleware/auth.js'

const router = Router()

router.get('/', verifyToken, async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT id, usuario, nombre, rol FROM usuarios ORDER BY id DESC'
    )
    res.json(rows)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.post('/', verifyToken, async (req, res) => {
  const { usuario, nombre, contrasena, rol } = req.body
  try {
    if (rol === 'Trabajador') {
      await pool.query('INSERT INTO usuarios (nombre, rol) VALUES (?, ?)', [nombre, rol])
    } else {
      const hash = await bcrypt.hash(contrasena, 10)
      await pool.query(
        'INSERT INTO usuarios (usuario, nombre, contrasena_hash, rol) VALUES (?, ?, ?, ?)',
        [usuario, nombre, hash, rol]
      )
    }
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.put('/:id', verifyToken, async (req, res) => {
  const { nombre, rol, contrasena } = req.body
  const { id } = req.params
  try {
    if (contrasena) {
      const hash = await bcrypt.hash(contrasena, 10)
      await pool.query(
        'UPDATE usuarios SET nombre=?, rol=?, contrasena_hash=? WHERE id=?',
        [nombre, rol, hash, id]
      )
    } else {
      await pool.query('UPDATE usuarios SET nombre=?, rol=? WHERE id=?', [nombre, rol, id])
    }
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.delete('/:id', verifyToken, async (req, res) => {
  try {
    await pool.query('DELETE FROM usuarios WHERE id=?', [req.params.id])
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

export default router
