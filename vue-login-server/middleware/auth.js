const jwt = require('jsonwebtoken')

const authMiddleware = (req, res, next) => {
  try {
    // 从请求头获取 token
    const token = req.headers.authorization?.split(' ')[1]
    
    if (!token) {
      return res.status(401).json({
        code: 401,
        message: '未登录'
      })
    }

    // 验证 token
    const decoded = jwt.verify(token, 'your_jwt_secret')
    req.user = decoded // 将解码后的用户信息添加到请求对象中
    next()
  } catch (error) {
    return res.status(401).json({
      code: 401,
      message: '登录已过期'
    })
  }
}

module.exports = authMiddleware 