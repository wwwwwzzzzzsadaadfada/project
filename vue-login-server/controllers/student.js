const pool = require('../config/db')
const xlsx = require('xlsx')
const path = require('path')
const fs = require('fs')

// 获取学生列表
const getStudentList = async (req, res) => {
  try {
    const { page = 1, pageSize = 10, name = '', idCard = '', grade = '' } = req.query
    const offset = (page - 1) * pageSize

    // 构建查询条件
    const conditions = []
    const params = []

    if (name) {
      conditions.push('s.name LIKE ?')
      params.push(`%${name}%`)
    }

    if (idCard) {
      conditions.push('s.id_card LIKE ?')
      params.push(`%${idCard}%`)
    }

    if (grade) {
      conditions.push('s.grade = ?')
      params.push(grade)
    }

    const whereSql = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''
    
    // 获取总数
    const [countResult] = await pool.query(
      `SELECT COUNT(*) as total 
       FROM student_info s 
       ${whereSql}`,
      params
    )
    const total = countResult[0].total

    // 获取分页数据和关联的学段ID
    const [rows] = await pool.query(
      `SELECT 
        s.*,
        GROUP_CONCAT(g.name) as grade_levels
       FROM student_info s
       LEFT JOIN student_grade_relation sg ON s.id = sg.student_id
       LEFT JOIN grade_level g ON sg.grade_id = g.id
       ${whereSql}
       GROUP BY s.id
       ORDER BY s.create_time DESC
       LIMIT ? OFFSET ?`,
      [...params, parseInt(pageSize), offset]
    )

    // 处理数据格式
    const list = rows.map(row => ({
      id: row.id,
      term: row.term,
      name: row.name,
      idCard: row.id_card,
      gender: row.gender,
      nation: row.nation,
      grade: row.grade,
      class: row.class,
      enrollYear: row.enroll_year,
      studentId: row.student_id,
      address: row.address,
      status: row.status,
      povertyLabel: row.poverty_label,
      civilAffairsLabel: row.civil_affairs_label,
      disabilityLabel: row.disability_label,
      laborUnionLabel: row.labor_union_label,
      gradeLevels: row.grade_levels ? row.grade_levels.split(',') : []
    }))

    res.json({
      code: 200,
      data: {
        list,
        total
      }
    })
  } catch (error) {
    console.error('Get student list error:', error)
    res.status(500).json({
      code: 500,
      message: '获取学生列表失败'
    })
  }
}

// 添加学生
const addStudent = async (req, res) => {
  try {
    const { 
      term, name, idCard, gender, nation, grade, class: className,
      enrollYear, studentId, address, gradeLevels,
      povertyLabel, civilAffairsLabel, disabilityLabel, laborUnionLabel 
    } = req.body

    // 检查身份证号是否已存在
    const [existingStudents] = await pool.query(
      'SELECT id FROM student_info WHERE id_card = ?',
      [idCard]
    )

    if (existingStudents.length > 0) {
      return res.status(400).json({
        code: 400,
        message: '该身份证号已存在'
      })
    }

    // 开启事务
    const connection = await pool.getConnection()
    await connection.beginTransaction()

    try {
      // 插入学生信息
      const [result] = await connection.query(
        `INSERT INTO student_info (
          term, name, id_card, gender, nation, grade, class, 
          enroll_year, student_id, address, 
          poverty_label, civil_affairs_label, disability_label, labor_union_label
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          term, name, idCard, gender, nation, grade, className,
          enrollYear, studentId, address,
          povertyLabel, civilAffairsLabel, disabilityLabel, laborUnionLabel
        ]
      )

      // 插入学段关联
      if (gradeLevels && gradeLevels.length > 0) {
        // 先查询学段名称对应的 ID
        const [gradeRows] = await connection.query(
          'SELECT id, name FROM grade_level WHERE name IN (?)',
          [gradeLevels]
        )

        if (gradeRows.length > 0) {
          const studentId = result.insertId
          const values = gradeRows.map(grade => [studentId, grade.id])
          
          await connection.query(
            'INSERT INTO student_grade_relation (student_id, grade_id) VALUES ?',
            [values]
          )
        }
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
    console.error('Add student error:', error)
    res.status(500).json({
      code: 500,
      message: '添加学生失败'
    })
  }
}

// 更新学生信息
const updateStudent = async (req, res) => {
  try {
    const { id } = req.params
    const { 
      term, name, idCard, gender, nation, grade, class: className,
      enrollYear, studentId, address, gradeLevels,
      povertyLabel, civilAffairsLabel, disabilityLabel, laborUnionLabel 
    } = req.body

    // 检查身份证号是否已被其他学生使用
    const [existingStudents] = await pool.query(
      'SELECT id FROM student_info WHERE id_card = ? AND id != ?',
      [idCard, id]
    )

    if (existingStudents.length > 0) {
      return res.status(400).json({
        code: 400,
        message: '该身份证号已被其他学生使用'
      })
    }

    // 开启事务
    const connection = await pool.getConnection()
    await connection.beginTransaction()

    try {
      // 更新学生信息
      await connection.query(
        `UPDATE student_info SET 
          term = ?, name = ?, id_card = ?, gender = ?, nation = ?, 
          grade = ?, class = ?, enroll_year = ?, student_id = ?, address = ?,
          poverty_label = ?, civil_affairs_label = ?, disability_label = ?, 
          labor_union_label = ?
         WHERE id = ?`,
        [
          term, name, idCard, gender, nation, grade, className,
          enrollYear, studentId, address,
          povertyLabel, civilAffairsLabel, disabilityLabel, laborUnionLabel,
          id
        ]
      )

      // 更新学段关联
      await connection.query(
        'DELETE FROM student_grade_relation WHERE student_id = ?',
        [id]
      )

      if (gradeLevels && gradeLevels.length > 0) {
        // 先查询学段名称对应的 ID
        const [gradeRows] = await connection.query(
          'SELECT id, name FROM grade_level WHERE name IN (?)',
          [gradeLevels]
        )

        if (gradeRows.length > 0) {
          const values = gradeRows.map(grade => [id, grade.id])
          await connection.query(
            'INSERT INTO student_grade_relation (student_id, grade_id) VALUES ?',
            [values]
          )
        }
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
    console.error('Update student error:', error)
    res.status(500).json({
      code: 500,
      message: '更新学生信息失败'
    })
  }
}

// 删除学生（支持批量删除）
const deleteStudent = async (req, res) => {
  try {
    const { ids } = req.body
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        code: 400,
        message: '请选择要删除的学生'
      })
    }

    // 开启事务
    const connection = await pool.getConnection()
    await connection.beginTransaction()

    try {
      // 删除学段关联
      await connection.query(
        'DELETE FROM student_grade_relation WHERE student_id IN (?)',
        [ids]
      )

      // 删除学生信息
      await connection.query(
        'DELETE FROM student_info WHERE id IN (?)',
        [ids]
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
    console.error('Delete student error:', error)
    res.status(500).json({
      code: 500,
      message: '删除学生失败'
    })
  }
}

// 更新学生状态
const updateStudentStatus = async (req, res) => {
  try {
    const { id } = req.params
    const { status } = req.body

    await pool.query(
      'UPDATE student_info SET status = ? WHERE id = ?',
      [status, id]
    )

    res.json({
      code: 200,
      message: '更新状态成功'
    })
  } catch (error) {
    console.error('Update student status error:', error)
    res.status(500).json({
      code: 500,
      message: '更新状态失败'
    })
  }
}

// 下载导入模板
const downloadTemplate = (req, res) => {
  const templatePath = path.join(__dirname, '../templates/student_import_template.xlsx')
  if (!fs.existsSync(templatePath)) {
    return res.status(404).json({
      code: 404,
      message: '模板文件不存在'
    })
  }
  
  // 设置响应头
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
  res.setHeader('Content-Disposition', 'attachment; filename=student_import_template.xlsx')
  
  // 发送文件
  const fileStream = fs.createReadStream(templatePath)
  fileStream.pipe(res)
}

// 导入学生数据
const importStudents = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({
      code: 400,
      message: '请上传文件'
    })
  }

  try {
    const workbook = xlsx.read(req.file.buffer)
    const sheet = workbook.Sheets[workbook.SheetNames[0]]
    const data = xlsx.utils.sheet_to_json(sheet)

    // 开启事务
    const connection = await pool.getConnection()
    await connection.beginTransaction()

    try {
      for (const row of data) {
        // 插入学生基本信息
        const [result] = await connection.query(
          `INSERT INTO student_info (
            term, name, id_card, gender, nation, grade, class, 
            enroll_year, student_id, address
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            row['学期'], row['姓名'], row['身份证号'],
            row['性别'] === '男' ? 1 : 2,
            row['民族'], row['年级'], row['班级'],
            row['入学年份'], row['学籍号'], row['家庭住址']
          ]
        )

        // 处理学段关联
        if (row['学段']) {
          const gradeLevels = row['学段'].split(',')
          const [gradeRows] = await connection.query(
            'SELECT id, name FROM grade_level WHERE name IN (?)',
            [gradeLevels]
          )

          if (gradeRows.length > 0) {
            const values = gradeRows.map(grade => [result.insertId, grade.id])
            await connection.query(
              'INSERT INTO student_grade_relation (student_id, grade_id) VALUES ?',
              [values]
            )
          }
        }
      }

      await connection.commit()
      res.json({
        code: 200,
        message: '导入成功'
      })
    } catch (error) {
      await connection.rollback()
      throw error
    } finally {
      connection.release()
    }
  } catch (error) {
    console.error('Import students error:', error)
    res.status(500).json({
      code: 500,
      message: '导入失败'
    })
  }
}

// 导出学生数据
const exportStudents = async (req, res) => {
  try {
    const { ids = [] } = req.body
    
    // 构建查询条件
    let whereSql = ''
    let params = []
    
    if (ids.length > 0) {
      whereSql = 'WHERE s.id IN (?)'
      params = [ids]
    }

    // 获取学生数据
    const [rows] = await pool.query(
      `SELECT 
        s.*,
        GROUP_CONCAT(g.name) as grade_levels
       FROM student_info s
       LEFT JOIN student_grade_relation sg ON s.id = sg.student_id
       LEFT JOIN grade_level g ON sg.grade_id = g.id
       ${whereSql}
       GROUP BY s.id
       ORDER BY s.create_time DESC`,
      params
    )

    // 转换数据格式
    const data = rows.map((row, index) => ({
      '序号': index + 1,
      '学期': row.term,
      '姓名': row.name,
      '身份证号': row.id_card,
      '性别': row.gender === 1 ? '男' : '女',
      '民族': row.nation,
      '年级': row.grade,
      '班级': row.class,
      '入学年份': row.enroll_year,
      '学籍号': row.student_id,
      '家庭住址': row.address,
      '学段': row.grade_levels || '',
      '状态': row.status === 1 ? '在校' : '离校',
      '乡村振兴库标签': row.poverty_label || '',
      '民政库标签': row.civil_affairs_label || '',
      '残联库标签': row.disability_label || '',
      '工会库标签': row.labor_union_label || ''
    }))

    // 创建工作簿和设置列宽等操作保持不变...
    const wb = xlsx.utils.book_new()
    const ws = xlsx.utils.json_to_sheet(data)
    
    const colWidths = Object.keys(data[0] || {}).map(key => ({
      wch: key === '序号' ? 8 : 15
    }))
    ws['!cols'] = colWidths

    xlsx.utils.book_append_sheet(wb, ws, '学生信息')
    const buffer = xlsx.write(wb, { type: 'buffer', bookType: 'xlsx' })

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
    res.setHeader('Content-Disposition', 'attachment; filename=students.xlsx')
    res.send(buffer)
  } catch (error) {
    console.error('Export students error:', error)
    res.status(500).json({
      code: 500,
      message: '导出失败'
    })
  }
}

// 获取受助信息列表
const getAssistanceList = async (req, res) => {
  try {
    const { page = 1, pageSize = 10, term = '', idCard = '', identityType = '' } = req.query
    const offset = (page - 1) * pageSize

    // 构建查询条件
    const conditions = []
    const params = []

    if (term) {
      conditions.push('a.term = ?')
      params.push(term)
    }

    if (idCard) {
      conditions.push('a.id_card LIKE ?')
      params.push(`%${idCard}%`)
    }

    if (identityType) {
      conditions.push('a.identity_type = ?')
      params.push(identityType)
    }

    const whereSql = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''
    
    // 获取总数
    const [countResult] = await pool.query(
      `SELECT COUNT(*) as total 
       FROM student_assistance a 
       ${whereSql}`,
      params
    )
    const total = countResult[0].total

    // 获取分页数据，添加序号
    const [rows] = await pool.query(
      `SELECT 
        (@row_number:=@row_number + 1) AS row_num,
        a.*,
        s.name as student_name,
        s.grade,
        s.class
       FROM student_assistance a
       LEFT JOIN student_info s ON a.id_card = s.id_card,
       (SELECT @row_number:=${offset}) AS t
       ${whereSql}
       ORDER BY a.create_time DESC
       LIMIT ? OFFSET ?`,
      [...params, parseInt(pageSize), offset]
    )

    res.json({
      code: 200,
      data: {
        list: rows,
        total
      }
    })
  } catch (error) {
    console.error('Get assistance list error:', error)
    res.status(500).json({
      code: 500,
      message: '获取受助信息列表失败'
    })
  }
}

// 添加受助信息
const addAssistance = async (req, res) => {
  try {
    const { term, idCard, identityType, assistanceLevel, assistanceAmount } = req.body

    // 验证学生是否存在
    const [students] = await pool.query(
      'SELECT id FROM student_info WHERE id_card = ?',
      [idCard]
    )

    if (students.length === 0) {
      return res.status(400).json({
        code: 400,
        message: '该身份证号对应的学生不存在'
      })
    }

    // 插入受助信息
    await pool.query(
      `INSERT INTO student_assistance 
        (term, id_card, identity_type, assistance_level, assistance_amount) 
       VALUES (?, ?, ?, ?, ?)`,
      [term, idCard, identityType, assistanceLevel, assistanceAmount]
    )

    res.json({
      code: 200,
      message: '添加成功'
    })
  } catch (error) {
    console.error('Add assistance error:', error)
    res.status(500).json({
      code: 500,
      message: '添加受助信息失败'
    })
  }
}

// 更新受助信息
const updateAssistance = async (req, res) => {
  try {
    const { id } = req.params
    const { term, idCard, identityType, assistanceLevel, assistanceAmount } = req.body

    // 验证学生是否存在
    const [students] = await pool.query(
      'SELECT id FROM student_info WHERE id_card = ?',
      [idCard]
    )

    if (students.length === 0) {
      return res.status(400).json({
        code: 400,
        message: '该身份证号对应的学生不存在'
      })
    }

    // 更新受助信息
    await pool.query(
      `UPDATE student_assistance 
       SET term = ?, id_card = ?, identity_type = ?, 
           assistance_level = ?, assistance_amount = ?
       WHERE id = ?`,
      [term, idCard, identityType, assistanceLevel, assistanceAmount, id]
    )

    res.json({
      code: 200,
      message: '更新成功'
    })
  } catch (error) {
    console.error('Update assistance error:', error)
    res.status(500).json({
      code: 500,
      message: '更新受助信息失败'
    })
  }
}

// 删除受助信息
const deleteAssistance = async (req, res) => {
  try {
    const { ids } = req.body
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        code: 400,
        message: '请选择要删除的记录'
      })
    }

    await pool.query(
      'DELETE FROM student_assistance WHERE id IN (?)',
      [ids]
    )

    res.json({
      code: 200,
      message: '删除成功'
    })
  } catch (error) {
    console.error('Delete assistance error:', error)
    res.status(500).json({
      code: 500,
      message: '删除受助信息失败'
    })
  }
}

// 导出受助信息
const exportAssistance = async (req, res) => {
  try {
    const { term, idCard, identityType } = req.query
    
    // 构建查询条件
    const conditions = []
    const params = []

    if (term) {
      conditions.push('a.term = ?')
      params.push(term)
    }

    if (idCard) {
      conditions.push('a.id_card LIKE ?')
      params.push(`%${idCard}%`)
    }

    if (identityType) {
      conditions.push('a.identity_type = ?')
      params.push(identityType)
    }

    const whereSql = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''

    // 获取数据
    const [rows] = await pool.query(
      `SELECT 
        a.*,
        s.name as student_name,
        s.grade,
        s.class
       FROM student_assistance a
       LEFT JOIN student_info s ON a.id_card = s.id_card
       ${whereSql}
       ORDER BY a.create_time DESC`,
      params
    )

    // 转换数据格式
    const data = rows.map((row, index) => ({
      '序号': index + 1,
      '学期': row.term,
      '学生姓名': row.student_name,
      '身份证号': row.id_card,
      '年级': row.grade,
      '班级': row.class,
      '身份认定类型': row.identity_type,
      '补助档次': row.assistance_level,
      '补助金额': row.assistance_amount,
      '创建时间': row.create_time
    }))

    // 创建Excel工作簿
    const wb = xlsx.utils.book_new()
    const ws = xlsx.utils.json_to_sheet(data)
    
    // 设置列宽
    const colWidths = Object.keys(data[0] || {}).map(key => ({
      wch: key === '序号' ? 8 : 15
    }))
    ws['!cols'] = colWidths

    xlsx.utils.book_append_sheet(wb, ws, '受助信息')
    const buffer = xlsx.write(wb, { type: 'buffer', bookType: 'xlsx' })

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
    res.setHeader('Content-Disposition', 'attachment; filename=assistance.xlsx')
    res.send(buffer)
  } catch (error) {
    console.error('Export assistance error:', error)
    res.status(500).json({
      code: 500,
      message: '导出失败'
    })
  }
}

// 同步在校学生信息到受助信息
const syncAssistance = async (req, res) => {
  try {
    // 获取当前学期
    const currentTerm = '2024年春季学期' // 这里可以根据实际情况获取当前学期

    // 获取所有在校学生信息，包括学段和标签信息
    const [students] = await pool.query(
      `SELECT 
        s.id_card, s.name, s.grade, s.class,
        s.poverty_label, s.civil_affairs_label, 
        s.disability_label, s.labor_union_label,
        GROUP_CONCAT(g.name) as grade_levels
       FROM student_info s 
       LEFT JOIN student_grade_relation sg ON s.id = sg.student_id
       LEFT JOIN grade_level g ON sg.grade_id = g.id
       WHERE s.status = 1 AND s.id_card NOT IN (
         SELECT id_card 
         FROM student_assistance 
         WHERE term = ?
       )
       GROUP BY s.id`,
      [currentTerm]
    )

    if (students.length === 0) {
      return res.json({
        code: 200,
        message: '没有需要同步的学生数据'
      })
    }

    // 处理每个学生的补助信息
    const values = students.map(student => {
      const gradeLevels = student.grade_levels ? student.grade_levels.split(',') : []
      let identityType = ''
      let assistanceLevel = ''
      let assistanceAmount = 0

      // 判断学段和设置补助信息
      if (gradeLevels.includes('小学') || gradeLevels.includes('初中')) {
        // 小学和初中的规则
        const isEligibleForFirstLevel = 
          (student.poverty_label?.includes('脱贫户') && student.civil_affairs_label?.includes('低保')) ||
          student.poverty_label?.includes('脱贫户') ||
          student.civil_affairs_label?.includes('低保') ||
          student.disability_label?.includes('残疾') ||
          student.labor_union_label?.includes('困难')

        if (isEligibleForFirstLevel) {
          identityType = '一般困难'  // 修改身份认定类型
          assistanceLevel = '一档'    // 保持补助档次不变
          assistanceAmount = gradeLevels.includes('小学') ? 625 : 750
        }
      } else if (gradeLevels.includes('高中')) {
        // 高中的规则
        if (student.poverty_label?.includes('脱贫户') && student.civil_affairs_label?.includes('低保')) {
          identityType = '特别困难'  // 修改身份认定类型
          assistanceLevel = '一档'    // 保持补助档次不变
          assistanceAmount = 1500
        } else if (student.civil_affairs_label?.includes('低保')) {
          identityType = '特别困难'  // 修改身份认定类型
          assistanceLevel = '一档'    // 保持补助档次不变
          assistanceAmount = 1500
        } else if (student.disability_label?.includes('残疾')) {
          identityType = '一般困难'  // 修改身份认定类型
          assistanceLevel = '二档'    // 保持补助档次不变
          assistanceAmount = 1000
        } else if (student.poverty_label?.includes('脱贫户')) {
          identityType = '一般困难'  // 修改身份认定类型
          assistanceLevel = '三档'    // 保持补助档次不变
          assistanceAmount = 500
        } else if (student.labor_union_label?.includes('困难')) {
          identityType = '一般困难'  // 修改身份认定类型
          assistanceLevel = '三档'    // 保持补助档次不变
          assistanceAmount = 500
        }
      }

      return [
        currentTerm,
        student.id_card,
        identityType,
        assistanceLevel,
        assistanceAmount
      ]
    })

    // 过滤掉没有设置补助级别的记录
    const validValues = values.filter(value => value[2] !== '')

    if (validValues.length === 0) {
      return res.json({
        code: 200,
        message: '没有符合条件的学生数据需要同步'
      })
    }

    // 批量插入新的受助记录
    await pool.query(
      `INSERT INTO student_assistance 
        (term, id_card, identity_type, assistance_level, assistance_amount) 
       VALUES ?`,
      [validValues]
    )

    // 获取新插入的记录
    const [insertedRecords] = await pool.query(
      `SELECT 
        a.*,
        s.name as student_name,
        s.grade,
        s.class
       FROM student_assistance a
       LEFT JOIN student_info s ON a.id_card = s.id_card
       WHERE a.term = ? AND a.id_card IN (?)`,
      [currentTerm, validValues.map(v => v[1])]
    )

    res.json({
      code: 200,
      message: `成功同步 ${validValues.length} 条学生数据`,
      data: {
        list: insertedRecords,
        total: insertedRecords.length
      }
    })
  } catch (error) {
    console.error('Sync assistance error:', error)
    res.status(500).json({
      code: 500,
      message: '同步数据失败'
    })
  }
}

module.exports = {
  getStudentList,
  addStudent,
  updateStudent,
  deleteStudent,
  updateStudentStatus,
  downloadTemplate,
  importStudents,
  exportStudents,
  getAssistanceList,
  addAssistance,
  updateAssistance,
  deleteAssistance,
  exportAssistance,
  syncAssistance
} 