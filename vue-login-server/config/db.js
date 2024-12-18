const mysql = require('mysql2/promise')

const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: 'wzt123456',
  database: 'node_vue',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
})

// 测试连接
pool.getConnection()
  .then(connection => {
    console.log('数据库连接成功')
    connection.release()
  })
  .catch(err => {
    console.error('数据库连接失败:', err)
  })

module.exports = pool 