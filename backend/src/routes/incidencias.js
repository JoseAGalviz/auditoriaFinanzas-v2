import { Router } from 'express'
import pool from '../db.js'
import { profitPool, profitPoolConnect } from '../db-profit.js'
import { verifyToken } from '../middleware/auth.js'

const router = Router()

router.get('/trabajadores', verifyToken, async (req, res) => {
  try {
    await profitPoolConnect
    const result = await profitPool.request().query(`
      SELECT DISTINCT
        LTRIM(RTRIM(e.employee_i)) AS id,
        LTRIM(RTRIM(e.last_name))  AS nombre
      FROM dbo.cobros c
      INNER JOIN MasterProfit.dbo.employee e
        ON LTRIM(RTRIM(e.employee_i)) = CAST(c.co_us_in AS VARCHAR(20))
      WHERE LTRIM(RTRIM(e.employee_i)) NOT LIKE '%[^0-9]%'
        AND LEN(LTRIM(RTRIM(e.employee_i))) > 0
      ORDER BY nombre ASC
    `)
    res.json(result.recordset)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.get('/por-dia', verifyToken, async (req, res) => {
  const { filtro_fecha } = req.query
  const params = []
  let where = ''
  if (filtro_fecha) {
    where = 'WHERE DATE(i.fecha) = ?'
    params.push(filtro_fecha)
  }
  try {
    const [rows] = await pool.query(
      `SELECT i.usuario_id, i.nombre,
              DATE_FORMAT(i.fecha, '%Y-%m-%d') AS fecha,
              COUNT(i.id) AS puntos_dia
       FROM incidencias i
       ${where}
       GROUP BY i.usuario_id, i.nombre, DATE(i.fecha)
       ORDER BY fecha DESC, i.nombre ASC`,
      params
    )
    res.json(rows)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.get('/', verifyToken, async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT i.id, i.nombre, i.usuario_id AS usuario, i.tipo, i.descripcion,
              DATE_FORMAT(i.fecha, '%Y-%m-%d') AS fecha, i.puntos
       FROM incidencias i
       ORDER BY i.fecha DESC`
    )
    res.json(rows)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.post('/', verifyToken, async (req, res) => {
  const { usuario_id, nombre, tipo, descripcion, fecha } = req.body
  try {
    await pool.query(
      'INSERT INTO incidencias (usuario_id, nombre, tipo, descripcion, fecha, puntos) VALUES (?, ?, ?, ?, ?, ?)',
      [usuario_id, nombre, tipo, descripcion, fecha, 1]
    )
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

export default router
