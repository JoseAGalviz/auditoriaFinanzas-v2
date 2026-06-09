import { Router } from 'express'
import pool from '../db.js'
import { verifyToken } from '../middleware/auth.js'

const router = Router()

router.get('/stats', verifyToken, async (req, res) => {
  try {
    const [[{ total: totalUsuarios }]] = await pool.query('SELECT COUNT(*) AS total FROM usuarios')
    const [[{ total: totalIncidencias }]] = await pool.query('SELECT COUNT(*) AS total FROM incidencias')
    const [[{ total: puntosNegativos }]] = await pool.query(
      'SELECT COALESCE(SUM(puntos), 0) AS total FROM incidencias WHERE puntos < 0'
    )
    res.json({ totalUsuarios, totalIncidencias, puntosNegativos })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

export default router
