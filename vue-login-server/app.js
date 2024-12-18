const express = require('express')
const cors = require('cors')
const adminRoutes = require('./routes/admin')
const session = require('express-session')
const studentRouter = require('./routes/student')

const app = express()

// 配置 session
app.use(session({
  secret: 'your-secret-key',
  resave: false,
  saveUninitialized: true,
  cookie: { 
    secure: process.env.NODE_ENV === 'production',
    maxAge: 1000 * 60 * 15 // 15分钟过期
  }
}))

// 中间件
app.use(cors())
app.use(express.json())

// 路由
app.use('/api/admin', adminRoutes)
app.use('/api/student', studentRouter)

// 错误处理
app.use((err, req, res, next) => {
  console.error(err)
  res.status(err.status || 500).json({
    code: err.status || 500,
    message: err.message || '服务器内部错误'
  })
})

const PORT = process.env.PORT || 3001
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`)
}) 