import { Router } from 'express'
import { profitPool, profitPoolConnect, sql } from '../db-profit.js'
import { verifyToken } from '../middleware/auth.js'

const router = Router()

router.get('/por-dia', verifyToken, async (req, res) => {
  const { desde, hasta } = req.query
  try {
    await profitPoolConnect
    const request = profitPool.request()
    let where = `
      WHERE LTRIM(RTRIM(e.employee_i)) NOT LIKE '%[^0-9]%'
        AND LEN(LTRIM(RTRIM(e.employee_i))) > 0
        AND c.anulado <> 1
    `
    if (desde) {
      request.input('desde', sql.Date, desde)
      where += ' AND CONVERT(DATE, c.fec_cob) >= @desde'
    }
    if (hasta) {
      request.input('hasta', sql.Date, hasta)
      where += ' AND CONVERT(DATE, c.fec_cob) <= @hasta'
    }

    const result = await request.query(`
      SELECT
        LTRIM(RTRIM(e.employee_i))  AS employee_i,
        LTRIM(RTRIM(e.last_name))   AS nombre,
        CONVERT(DATE, c.fec_cob)    AS fecha,
        COUNT(*)                    AS total_cobros
      FROM dbo.cobros c
      INNER JOIN MasterProfit.dbo.employee e
        ON LTRIM(RTRIM(e.employee_i)) = CAST(c.co_us_in AS VARCHAR(20))
      ${where}
      GROUP BY
        LTRIM(RTRIM(e.employee_i)),
        LTRIM(RTRIM(e.last_name)),
        CONVERT(DATE, c.fec_cob)
      ORDER BY fecha DESC, nombre ASC
    `)
    res.json(result.recordset)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

export default router
