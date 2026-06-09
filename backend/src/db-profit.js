import sql from 'mssql'
import 'dotenv/config'

const config = {
  server: process.env.PROFIT_DB_HOST,
  user: process.env.PROFIT_DB_USER,
  password: process.env.PROFIT_DB_PASS,
  database: process.env.PROFIT_DB_NAME,
  port: parseInt(process.env.PROFIT_DB_PORT || '1433'),
  options: {
    trustServerCertificate: true,
    encrypt: false,
  },
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000,
  },
}

const profitPool = new sql.ConnectionPool(config)
const profitPoolConnect = profitPool.connect()

profitPool.on('error', err => console.error('Profit DB pool error:', err))

export { profitPool, profitPoolConnect, sql }
