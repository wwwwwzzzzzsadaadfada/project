<template>
  <div class="student-info-container">
    <!-- 搜索栏 -->
    <div class="fixed-header">
      <el-card class="search-card">
        <el-form :inline="true" :model="searchForm" class="search-form">
          <el-form-item label="学生姓名">
            <el-input
              v-model="searchForm.name"
              placeholder="请输入学生姓名"
              clearable
              @keyup.enter="handleSearch"
            />
          </el-form-item>
          <el-form-item label="身份证号">
            <el-input
              v-model="searchForm.idCard"
              placeholder="请输入身份证号"
              clearable
              @keyup.enter="handleSearch"
            />
          </el-form-item>
          <el-form-item label="年级">
            <el-select 
              v-model="searchForm.grade"
              placeholder="请选择年级"
              clearable
            >
              <el-option
                v-for="grade in gradeOptions"
                :key="grade.value"
                :label="grade.label"
                :value="grade.value"
              />
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="handleSearch" :icon="Search">
              搜索
            </el-button>
            <el-button @click="resetSearch" :icon="Refresh">
              重置
            </el-button>
          </el-form-item>
        </el-form>
      </el-card>

      <!-- 操作栏 -->
      <div class="operation-bar">
        <el-button type="primary" @click="handleAdd" :icon="Plus">
          新增学生
        </el-button>
        <el-button 
          type="danger" 
          :icon="Delete"
          :disabled="selectedRows.length === 0"
          @click="handleBatchDelete"
        >
          批量删除
        </el-button>
        <el-upload
          class="upload-demo"
          :action="uploadUrl"
          :headers="uploadHeaders"
          :on-success="handleUploadSuccess"
          :on-error="handleUploadError"
          :show-file-list="false"
          accept=".xlsx,.xls"
        >
          <el-button type="warning" :icon="Upload">批量导入</el-button>
        </el-upload>
        <el-dropdown @command="handleExportCommand" style="margin-left: 10px;">
          <el-button type="success" :icon="Download">
            导出操作
            <el-icon class="el-icon--right"><arrow-down /></el-icon>
          </el-button>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item command="template">下载模板</el-dropdown-item>
              <el-dropdown-item command="data">导出数据</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
    </div>

    <!-- 表格容器 -->
    <div class="table-container">
      <el-table 
        :data="tableData" 
        style="width: 100%"
        v-loading="loading"
        @selection-change="handleSelectionChange"
      >
        <el-table-column 
          type="selection" 
          width="55" 
          fixed="left"
        />
        <el-table-column 
          type="index" 
          label="序号" 
          width="60" 
          fixed="left"
          align="center"
        />
        <el-table-column 
          prop="name" 
          label="学生姓名" 
          width="120" 
          fixed="left"
          align="center"
        />
        <el-table-column prop="term" label="学期" width="150" align="center" />
        <el-table-column prop="gradeLevels" label="学段" width="120" align="center">
          <template #default="scope">
            <el-tag 
              v-for="grade in scope.row.gradeLevels"
              :key="grade"
              class="grade-tag"
              size="small"
            >
              {{ grade }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="idCard" label="身份证号" width="180" align="center" />
        <el-table-column prop="gender" label="性别" width="80" align="center">
          <template #default="scope">
            {{ scope.row.gender === 1 ? '男' : '女' }}
          </template>
        </el-table-column>
        <el-table-column prop="nation" label="民族" width="100" align="center" />
        <el-table-column prop="grade" label="年级" width="100" align="center" />
        <el-table-column prop="class" label="班级" width="100" align="center" />
        <el-table-column prop="enrollYear" label="入学年份" width="100" align="center" />
        <el-table-column prop="studentId" label="学籍号" width="180" align="center" />
        <el-table-column prop="address" label="家庭住址" min-width="200" align="center" />
        <el-table-column prop="status" label="状态" width="100" align="center">
          <template #default="scope">
            <el-tag 
              :type="scope.row.status === 1 ? 'success' : 'danger'"
              size="small"
            >
              {{ scope.row.status === 1 ? '在校' : '离校' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="povertyLabel" label="乡村振兴库标签" min-width="200" align="center" show-overflow-tooltip />
        <el-table-column prop="civilAffairsLabel" label="民政库标签" min-width="150" align="center" show-overflow-tooltip />
        <el-table-column prop="disabilityLabel" label="残联库标签" min-width="150" align="center" show-overflow-tooltip />
        <el-table-column prop="laborUnionLabel" label="工会库标签" min-width="150" align="center" show-overflow-tooltip />
        <el-table-column 
          label="操作" 
          width="180" 
          fixed="right"
          align="center"
        >
          <template #default="scope">
            <el-button 
              type="primary" 
              link
              size="small"
              @click="handleEdit(scope.row)"
            >
              编辑
            </el-button>
            <el-button 
              type="primary" 
              link
              size="small"
              @click="handleDelete(scope.row)"
            >
              删除
            </el-button>
            <el-button 
              type="primary" 
              link
              size="small"
              @click="handleStatusChange(scope.row)"
            >
              {{ scope.row.status === 1 ? '设为离校' : '设为在校' }}
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :total="total"
          :page-sizes="[10, 20, 30, 50]"
          :pager-count="7"
          layout="total, sizes, prev, pager, next, jumper"
          background
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </div>

    <!-- 新增/编辑对话框 -->
    <el-drawer
      v-model="dialogVisible"
      :title="dialogType === 'add' ? '新增学生' : '编辑学生'"
      direction="rtl"
      size="600px"
      :destroy-on-close="true"
    >
      <el-form 
        :model="form" 
        :rules="rules" 
        ref="formRef" 
        label-width="100px"
        class="drawer-form"
      >
        <!-- 基本信息 -->
        <div class="form-section">
          <div class="section-title">基本信息</div>
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="学期" prop="term">
                <el-select v-model="form.term" placeholder="请选择学期">
                  <el-option label="2023年秋季学期" value="2023年秋季学期" />
                  <el-option label="2024年春季学期" value="2024年春季学期" />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="学段" prop="gradeLevels">
                <el-select v-model="form.gradeLevels" multiple placeholder="请选择学段">
                  <el-option
                    v-for="grade in adminGradeLevels"
                    :key="grade.value"
                    :label="grade.label"
                    :value="grade.value"
                  />
                </el-select>
              </el-form-item>
            </el-col>
          </el-row>

          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="姓名" prop="name">
                <el-input v-model="form.name" placeholder="请输入学生姓名" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="身份证号" prop="idCard">
                <el-input v-model="form.idCard" placeholder="请输入身份证号" />
              </el-form-item>
            </el-col>
          </el-row>

          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="性别" prop="gender">
                <el-radio-group v-model="form.gender">
                  <el-radio :label="1">男</el-radio>
                  <el-radio :label="2">女</el-radio>
                </el-radio-group>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="民族" prop="nation">
                <el-select v-model="form.nation" placeholder="请选择民族">
                  <el-option label="汉族" value="汉族" />
                  <el-option label="满族" value="满族" />
                  <el-option label="回族" value="回族" />
                  <!-- 其他民族选项... -->
                </el-select>
              </el-form-item>
            </el-col>
          </el-row>
        </div>

        <!-- 学籍信息 -->
        <div class="form-section">
          <div class="section-title">学籍信息</div>
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="年级" prop="grade">
                <el-select v-model="form.grade" placeholder="请选择年级">
                  <el-option
                    v-for="grade in gradeOptions"
                    :key="grade.value"
                    :label="grade.label"
                    :value="grade.value"
                  />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="班级" prop="class">
                <el-input v-model="form.class" placeholder="请输入班级" />
              </el-form-item>
            </el-col>
          </el-row>

          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="入学年份" prop="enrollYear">
                <el-date-picker
                  v-model="form.enrollYear"
                  type="year"
                  placeholder="请选择入学年份"
                  value-format="YYYY"
                />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="学籍号" prop="studentId">
                <el-input v-model="form.studentId" placeholder="请输入学籍号" />
              </el-form-item>
            </el-col>
          </el-row>

          <el-form-item label="家庭住址" prop="address">
            <el-input 
              v-model="form.address" 
              type="textarea" 
              :rows="2"
              placeholder="请输入家庭住址" 
            />
          </el-form-item>
        </div>

        <!-- 标签信息 -->
        <div class="form-section">
          <div class="section-title">标签信息</div>
          <el-form-item label="乡村振兴" prop="povertyLabel">
            <el-input 
              v-model="form.povertyLabel" 
              type="textarea" 
              :rows="2"
              placeholder="示例：张三 脱贫标志:脱贫户 脱贫年度:2016" 
            />
          </el-form-item>

          <el-form-item label="民政标签" prop="civilAffairsLabel">
            <el-input 
              v-model="form.civilAffairsLabel" 
              type="textarea" 
              :rows="2"
              placeholder="示例：农村低保 0 08 1 2023" 
            />
          </el-form-item>

          <el-form-item label="残联标签" prop="disabilityLabel">
            <el-input 
              v-model="form.disabilityLabel" 
              type="textarea" 
              :rows="2"
              placeholder="示例：言语残疾一级" 
            />
          </el-form-item>

          <el-form-item label="工会标签" prop="laborUnionLabel">
            <el-input 
              v-model="form.laborUnionLabel" 
              type="textarea" 
              :rows="2"
              placeholder="示例：相对困难" 
            />
          </el-form-item>
        </div>
      </el-form>

      <!-- 底部操作按钮 -->
      <template #footer>
        <div class="drawer-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="handleSubmit">确定</el-button>
        </div>
      </template>
    </el-drawer>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search, Refresh, Plus, Download, Upload, ArrowDown, Delete } from '@element-plus/icons-vue'
import { getStudentList, addStudent, updateStudent, deleteStudent, updateStudentStatus } from '@/api/student'
import { getGradeLevels } from '@/api/user'

// 表格数据
const tableData = ref([])
const loading = ref(false)
const total = ref(0)
const currentPage = ref(1)
const pageSize = ref(10)

// 搜索表单
const searchForm = ref({
  name: '',
  idCard: '',
  grade: ''
})

// 年级选项
const gradeOptions = ref([
  { value: '一年级', label: '一年级' },
  { value: '二年级', label: '二年级' },
  { value: '三年级', label: '三年级' },
  { value: '四年级', label: '四年级' },
  { value: '五年级', label: '五年级' },
  { value: '六年级', label: '六年级' },
  { value: '七年级', label: '七年级' },
  { value: '八年级', label: '八年级' },
  { value: '九年级', label: '九年级' },
  { value: '高一', label: '高一' },
  { value: '高二', label: '高二' },
  { value: '高三', label: '高三' }
])

// 添加学段选项
const adminGradeLevels = ref([
  { value: '小学', label: '小学' },
  { value: '初中', label: '初中' },
  { value: '高中', label: '高中' }
])

// 对话框相关
const dialogVisible = ref(false)
const dialogType = ref('add')
const formRef = ref(null)
const form = ref({
  term: '',
  gradeLevels: [],
  name: '',
  idCard: '',
  gender: 1,
  nation: '',
  grade: '',
  class: '',
  enrollYear: '',
  studentId: '',
  address: '',
  povertyLabel: '',
  civilAffairsLabel: '',
  disabilityLabel: '',
  laborUnionLabel: ''
})

// 表单验证规则
const rules = {
  term: [{ required: true, message: '请选择学期', trigger: 'change' }],
  gradeLevels: [{ required: true, message: '请选择学段', trigger: 'change' }],
  name: [{ required: true, message: '请输入学生姓名', trigger: 'blur' }],
  idCard: [
    { required: true, message: '请输入身份证号', trigger: 'blur' },
    { pattern: /(^\d{15}$)|(^\d{18}$)|(^\d{17}(\d|X|x)$)/, message: '请输入正确的身份证号', trigger: 'blur' }
  ],
  gender: [{ required: true, message: '请选择性别', trigger: 'change' }],
  nation: [{ required: true, message: '请输入民族', trigger: 'blur' }],
  grade: [{ required: true, message: '请选择年级', trigger: 'change' }],
  class: [{ required: true, message: '请输入班级', trigger: 'blur' }],
  enrollYear: [{ required: true, message: '请输入入学年份', trigger: 'blur' }],
  studentId: [{ required: true, message: '请输入学籍号', trigger: 'blur' }]
}

// 上传相关
const uploadUrl = `${import.meta.env.VITE_API_URL}/api/student/import`
const uploadHeaders = computed(() => ({
  Authorization: `Bearer ${localStorage.getItem('token')}`
}))

// 处理上传成功
const handleUploadSuccess = (response) => {
  if (response.code === 200) {
    ElMessage.success('导入成功')
    fetchData()
  } else {
    ElMessage.error(response.message || '导入失败')
  }
}

// 处理上传失败
const handleUploadError = () => {
  ElMessage.error('导入失败')
}

// 处理导出命令
const handleExportCommand = (command) => {
  if (command === 'template') {
    // 下载模板
    const link = document.createElement('a')
    link.href = `${import.meta.env.VITE_API_URL}/api/student/template`
    link.setAttribute('download', '学生信息导入模板.xlsx')
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  } else if (command === 'data') {
    // 导出数据
    handleExport()
  }
}

// 获取表格数据
const fetchData = async () => {
  loading.value = true
  try {
    const res = await getStudentList({
      page: currentPage.value,
      pageSize: pageSize.value,
      ...searchForm.value
    })
    if (res.code === 200) {
      tableData.value = res.data.list
      total.value = res.data.total
    }
  } catch (error) {
    console.error('获取数据失败:', error)
    ElMessage.error('获取数据失败')
  } finally {
    loading.value = false
  }
}

// 搜索处理
const handleSearch = () => {
  currentPage.value = 1
  fetchData()
}

// 重置搜索
const resetSearch = () => {
  searchForm.value = {
    name: '',
    idCard: '',
    grade: ''
  }
  handleSearch()
}

// 新增学生
const handleAdd = () => {
  dialogType.value = 'add'
  dialogVisible.value = true
  form.value = {
    term: '',
    gradeLevels: [],
    name: '',
    idCard: '',
    gender: 1,
    nation: '',
    grade: '',
    class: '',
    enrollYear: '',
    studentId: '',
    address: '',
    povertyLabel: '',
    civilAffairsLabel: '',
    disabilityLabel: '',
    laborUnionLabel: ''
  }
}

// 编辑学生
const handleEdit = (row) => {
  dialogType.value = 'edit'
  dialogVisible.value = true
  form.value = { ...row }
}

// 删除学生
const handleDelete = (row) => {
  ElMessageBox.confirm('确定要删除该学生吗？', '警告', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    try {
      await deleteStudent(row.id)
      ElMessage.success('删除成功')
      fetchData()
    } catch (error) {
      console.error('删除失败:', error)
    }
  })
}

// 更改状态
const handleStatusChange = (row) => {
  const newStatus = row.status === 1 ? 0 : 1
  const statusText = newStatus === 1 ? '在校' : '离校'
  
  ElMessageBox.confirm(`确定要将该学生状态改为${statusText}吗？`, '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    try {
      await updateStudentStatus(row.id, newStatus)
      ElMessage.success('状态更新成功')
      fetchData()
    } catch (error) {
      console.error('更新状态失败:', error)
    }
  })
}

// 提交表单
const handleSubmit = async () => {
  if (!formRef.value) return
  
  await formRef.value.validate(async (valid) => {
    if (valid) {
      try {
        if (dialogType.value === 'add') {
          await addStudent(form.value)
          ElMessage.success('添加成功')
        } else {
          await updateStudent(form.value.id, form.value)
          ElMessage.success('更新成功')
        }
        dialogVisible.value = false
        fetchData()
      } catch (error) {
        console.error(dialogType.value === 'add' ? '添加失败:' : '更新失败:', error)
      }
    }
  })
}

// 导出功能
const handleExport = async () => {
  try {
    // 获取选中的学生ID
    const selectedIds = selectedRows.value.map(row => row.id)
    
    // 使用 fetch 下载文件
    const response = await fetch(`${import.meta.env.VITE_API_URL}/api/student/export`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ ids: selectedIds })
    })
    
    if (!response.ok) {
      throw new Error('导出失败')
    }
    
    // 获取文件流
    const blob = await response.blob()
    // 创建下载链接
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = '学生信息表.xlsx'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(link.href)
    
    ElMessage.success('导出成功')
  } catch (error) {
    console.error('导出失败:', error)
    ElMessage.error('导出失败')
  }
}

// 分页处理
const handleSizeChange = (val) => {
  pageSize.value = val
  fetchData()
}

const handleCurrentChange = (val) => {
  currentPage.value = val
  fetchData()
}

// 选中的行
const selectedRows = ref([])

// 处理选择变化
const handleSelectionChange = (selection) => {
  selectedRows.value = selection
}

// 批量删除
const handleBatchDelete = () => {
  if (selectedRows.value.length === 0) return
  
  ElMessageBox.confirm(
    `确定要删除选中的 ${selectedRows.value.length} 条记录吗？`, 
    '警告', 
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(async () => {
    try {
      // 获取所有选中行的 ID
      const ids = selectedRows.value.map(row => row.id)
      await deleteStudent(ids)
      ElMessage.success('删除成功')
      selectedRows.value = []
      fetchData()
    } catch (error) {
      console.error('批量删除失败:', error)
      ElMessage.error('删除失败')
    }
  })
}

// 初始化
onMounted(() => {
  fetchData()
})
</script>

<style scoped>
.student-info-container {
  height: 100%;
  padding: 8px 15px;
  background-color: #f0f2f5;
}

.fixed-header {
  margin-bottom: 8px;
}

.search-card {
  margin-bottom: 8px;
  background-color: #fff;
  border-radius: 4px;
  margin-top: -12px;
}

.search-form {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.search-form :deep(.el-form-item) {
  margin-bottom: 20px;
  margin-right: 0;
}

.operation-bar {
  background-color: #fff;
  padding: 8px 20px;
  border-radius: 4px;
  display: flex;
  gap: 10px;
  margin-bottom: 8px;
}

.table-container {
  background-color: #fff;
  padding: 20px;
  border-radius: 4px;
}

.el-input,
.el-select {
  width: 220px;
}

.grade-tag {
  margin-right: 5px;
}

/* 分页样式 */
.pagination {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

:deep(.el-pagination) {
  font-weight: normal;
  padding: 0;
}

:deep(.el-pagination .el-select .el-input) {
  width: 110px;
}

:deep(.el-pagination button) {
  background-color: transparent;
}

:deep(.el-pagination .el-pagination__total) {
  margin-right: 16px;
}

:deep(.el-pagination .el-pagination__sizes) {
  margin-right: 16px;
}

:deep(.el-select-dropdown__item) {
  padding: 0 20px;
}

/* 抽屉表单样式 */
.drawer-form {
  padding: 10px 20px;
}

.form-section {
  margin-bottom: 15px;
  padding: 15px;
  background-color: #f8f9fa;
  border-radius: 4px;
}

.section-title {
  font-size: 16px;
  font-weight: bold;
  margin-bottom: 15px;
  padding-left: 10px;
  border-left: 4px solid #409EFF;
}

:deep(.el-form-item) {
  margin-bottom: 15px;
}

:deep(.el-select),
:deep(.el-date-picker) {
  width: 100%;
}

.drawer-footer {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 16px;
  background: #fff;
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  border-top: 1px solid #dcdfe6;
}

/* 修改搜索表单中的输入框和下拉框宽度 */
.search-form :deep(.el-input),
.search-form :deep(.el-select) {
  width: 240px;  /* 从 220px 改为 240px */
}

.upload-demo {
  display: inline-block;
  margin-left: 10px;
}

:deep(.el-upload) {
  display: inline-block;
}
</style> 