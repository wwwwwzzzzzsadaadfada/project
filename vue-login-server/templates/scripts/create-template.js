const xlsx = require('xlsx')
const path = require('path')

// 创建工作簿
const wb = xlsx.utils.book_new()

// 定义表头
const headers = [
  '学期',
  '姓名',
  '身份证号',
  '性别',
  '民族',
  '年级',
  '班级',
  '入学年份',
  '学籍号',
  '家庭住址',
  '学段'
]

// 创建示例数据
const exampleData = [
  {
    '学期': '2023年秋季学期',
    '姓名': '张三',
    '身份证号': '110101200501011234',
    '性别': '男',
    '民族': '汉族',
    '年级': '一年级',
    '班级': '1班',
    '入学年份': '2023',
    '学籍号': 'XJ20230001',
    '家庭住址': '北京市朝阳区XX街道XX小区',
    '学段': '小学'
  }
]

// 创建工作表
const ws = xlsx.utils.json_to_sheet(exampleData, { header: headers })

// 设置列宽
const colWidths = headers.map(() => ({ wch: 15 }))
ws['!cols'] = colWidths

// 添加工作表到工作簿
xlsx.utils.book_append_sheet(wb, ws, '学生信息')

// 保存文件
const templatePath = path.join(__dirname, '../templates/student_import_template.xlsx')
xlsx.writeFile(wb, templatePath)

console.log('模板文件已创建：', templatePath)