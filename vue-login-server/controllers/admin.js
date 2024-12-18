const pool = require('../config/db')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const svgCaptcha = require('svg-captcha')

const login = async (req, res) => {
  const { username, password } = req.body
  
  try {
    // 查询用户信息和关联的学段
    const [rows] = await pool.execute(`
      SELECT a.*, GROUP_CONCAT(g.name) as grade_levels 
      FROM admin_info a
      LEFT JOIN admin_grade_relation ag ON a.id = ag.admin_id
      LEFT JOIN grade_level g ON ag.grade_id = g.id
      WHERE a.username = ?
      GROUP BY a.id
    `, [username])

    if (rows.length === 0) {
      return res.status(401).json({
        code: 401,
        message: '用户名或密码错误'
      })
    }

    const admin = rows[0]

    // 验证密码 - 使用数据库中存储的密码
    if (password !== admin.password) {  // 修改这里，使用数据库中的密码
      return res.status(401).json({
        code: 401,
        message: '用户名或密码错误'
      })
    }

    // 检查状态
    if (admin.status === 0) {
      return res.status(403).json({
        code: 403,
        message: '账号已被禁用'
      })
    }

    // 生成 token
    const token = jwt.sign(
      { id: admin.id, username: admin.username },
      'your_jwt_secret',
      { expiresIn: '24h' }
    )

    // 处理学段数据
    const gradeLevels = admin.grade_levels ? admin.grade_levels.split(',') : []

    res.json({
      code: 200,
      message: '登录成功',
      data: {
        token,
        userInfo: {
          id: admin.id,
          username: admin.username,
          nickname: admin.nickname,
          roleType: admin.role_type,
          gradeLevels: gradeLevels
        }
      }
    })
  } catch (error) {
    console.error('Login error:', error)
    res.status(500).json({
      code: 500,
      message: '服务器错误'
    })
  }
}

// 获取所有学段
const getGradeLevels = async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT * FROM grade_level ORDER BY name')
    res.json({
      code: 200,
      data: rows
    })
  } catch (error) {
    console.error('Get grade levels error:', error)
    res.status(500).json({
      code: 500,
      message: '获取学段列表失败'
    })
  }
}

// 添加验证码生成函数
const getCaptcha = (req, res) => {
  const captcha = svgCaptcha.create({
    size: 4, // 验证码长度
    noise: 2, // 干扰线条数
    color: true, // 验证码字符颜色
    background: '#f0f2f5' // 背景色
  })
  
  // 将验证码存入 session
  req.session.captcha = captcha.text.toLowerCase()
  
  res.type('svg')
  res.status(200).send(captcha.data)
}

// 获取管理员列表
const getAdminList = async (req, res) => {
  try {
    const { page = 1, pageSize = 10, username = '', roleType = '', status = '' } = req.query
    const offset = (page - 1) * pageSize

    // 构建查询条件
    const conditions = []
    const params = []

    if (username) {
      conditions.push('(a.username LIKE ? OR a.nickname LIKE ?)')
      params.push(`%${username}%`, `%${username}%`)
    }

    if (roleType !== '') {
      conditions.push('a.role_type = ?')
      params.push(roleType)
    }

    if (status !== '') {
      conditions.push('a.status = ?')
      params.push(status)
    }

    const whereSql = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''
    
    // 获取总数
    const [countResult] = await pool.query(
      `SELECT COUNT(*) as total 
       FROM admin_info a 
       ${whereSql}`,
      params
    )
    const total = countResult[0].total

    // 获取分页数据和关联的学段ID
    const [rows] = await pool.query(
      `SELECT 
        a.*,
        GROUP_CONCAT(ag.grade_id) as grade_ids
       FROM admin_info a
       LEFT JOIN admin_grade_relation ag ON a.id = ag.admin_id
       ${whereSql}
       GROUP BY a.id
       ORDER BY a.create_time DESC
       LIMIT ? OFFSET ?`,
      [...params, parseInt(pageSize), offset]
    )

    // 处理数据格式
    const list = rows.map(row => ({
      id: row.id,
      username: row.username,
      nickname: row.nickname,
      roleType: row.role_type,
      status: row.status,
      createTime: row.create_time,
      gradeLevels: row.grade_ids ? row.grade_ids.split(',').map(id => parseInt(id)) : []
    }))

    res.json({
      code: 200,
      data: {
        list,
        total
      }
    })
  } catch (error) {
    console.error('Get admin list error:', error)
    res.status(500).json({
      code: 500,
      message: '获取管理员列表失败'
    })
  }
}

// 添加管理员
const addAdmin = async (req, res) => {
  try {
    const { username, nickname, password, roleType, gradeLevels } = req.body

    // 检查用户名是否已存在
    const [existingUsers] = await pool.query(
      'SELECT id FROM admin_info WHERE username = ?',
      [username]
    )

    if (existingUsers.length > 0) {
      return res.status(400).json({
        code: 400,
        message: '用户名已存在'
      })
    }

    // 开启事务
    const connection = await pool.getConnection()
    await connection.beginTransaction()

    try {
      // 插入管理员信息
      const [result] = await connection.query(
        'INSERT INTO admin_info (username, nickname, password, role_type) VALUES (?, ?, ?, ?)',
        [username, nickname, password, roleType]
      )

      // 插入学段关联
      if (gradeLevels && gradeLevels.length > 0) {
        const values = gradeLevels.map(gradeId => [result.insertId, gradeId])
        await connection.query(
          'INSERT INTO admin_grade_relation (admin_id, grade_id) VALUES ?',
          [values]
        )
      }

      await connection.commit()
      res.json({
        code: 200,
        message: '添加成功'
      })
    } catch (error) {
      await connection.rollback()
      throw error
    } finally {
      connection.release()
    }
  } catch (error) {
    console.error('Add admin error:', error)
    res.status(500).json({
      code: 500,
      message: '添加管理员失败'
    })
  }
}

// 更新管理员
const updateAdmin = async (req, res) => {
  try {
    const { id } = req.params
    const { nickname, roleType, gradeLevels } = req.body

    // 开启事务
    const connection = await pool.getConnection()
    await connection.beginTransaction()

    try {
      // 更新管理员信息
      await connection.query(
        'UPDATE admin_info SET nickname = ?, role_type = ? WHERE id = ?',
        [nickname, roleType, id]
      )

      // 更新学段关联
      await connection.query(
        'DELETE FROM admin_grade_relation WHERE admin_id = ?',
        [id]
      )

      if (gradeLevels && gradeLevels.length > 0) {
        const values = gradeLevels.map(gradeId => [id, parseInt(gradeId)])
        await connection.query(
          'INSERT INTO admin_grade_relation (admin_id, grade_id) VALUES ?',
          [values]
        )
      }

      await connection.commit()
      res.json({
        code: 200,
        message: '更新成功'
      })
    } catch (error) {
      await connection.rollback()
      throw error
    } finally {
      connection.release()
    }
  } catch (error) {
    console.error('Update admin error:', error)
    res.status(500).json({
      code: 500,
      message: '更新管理员失败'
    })
  }
}

// 删除管理员
const deleteAdmin = async (req, res) => {
  try {
    const { id } = req.params

    // 开启事务
    const connection = await pool.getConnection()
    await connection.beginTransaction()

    try {
      // 删除学段关联
      await connection.query(
        'DELETE FROM admin_grade_relation WHERE admin_id = ?',
        [id]
      )

      // 删除管理员信息
      await connection.query(
        'DELETE FROM admin_info WHERE id = ?',
        [id]
      )

      await connection.commit()
      res.json({
        code: 200,
        message: '删除成功'
      })
    } catch (error) {
      await connection.rollback()
      throw error
    } finally {
      connection.release()
    }
  } catch (error) {
    console.error('Delete admin error:', error)
    res.status(500).json({
      code: 500,
      message: '删除管理员失败'
    })
  }
}

// 修改管理员状态
const updateAdminStatus = async (req, res) => {
  try {
    const { id } = req.params
    const { status } = req.body

    await pool.query(
      'UPDATE admin_info SET status = ? WHERE id = ?',
      [status, id]
    )

    res.json({
      code: 200,
      message: '更新状态成功'
    })
  } catch (error) {
    console.error('Update admin status error:', error)
    res.status(500).json({
      code: 500,
      message: '更新状态失败'
    })
  }
}

// 修改密码
const updatePassword = async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body
    const userId = req.user.id // 从 token 中获取用户 ID

    // 验证原密码
    const [rows] = await pool.query(
      'SELECT password FROM admin_info WHERE id = ?',
      [userId]
    )

    if (rows.length === 0) {
      return res.status(404).json({
        code: 404,
        message: '用户不存在'
      })
    }

    // 这里暂时直接比较密码，实际应该使用 bcrypt 比较
    if (rows[0].password !== oldPassword) {
      return res.status(400).json({
        code: 400,
        message: '原密码错误'
      })
    }

    // 更新密码
    await pool.query(
      'UPDATE admin_info SET password = ? WHERE id = ?',
      [newPassword, userId]
    )

    res.json({
      code: 200,
      message: '密码修改成功'
    })
  } catch (error) {
    console.error('Update password error:', error)
    res.status(500).json({
      code: 500,
      message: '修改密码失败'
    })
  }
}

// 重置密码
const resetPassword = async (req, res) => {
  try {
    const userId = req.user.id // 从 token 中获取用户 ID
    const defaultPassword = '123456'

    await pool.query(
      'UPDATE admin_info SET password = ? WHERE id = ?',
      [defaultPassword, userId]
    )

    res.json({
      code: 200,
      message: '密码重置成功'
    })
  } catch (error) {
    console.error('Reset password error:', error)
    res.status(500).json({
      code: 500,
      message: '重置密码失败'
    })
  }
}

// 导出新增的方法
module.exports = {
  login,
  getGradeLevels,
  getCaptcha,
  getAdminList,
  addAdmin,
  updateAdmin,
  deleteAdmin,
  updateAdminStatus,
  updatePassword,
  resetPassword
} 