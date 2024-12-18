<template>
  <div class="assistance-container">
    <!-- 搜索栏 -->
    <div class="fixed-header">
      <el-card class="search-card">
        <el-form :inline="true" :model="searchForm" class="search-form">
          <el-form-item label="学期">
            <el-select v-model="searchForm.term" placeholder="请选择学期" clearable>
              <el-option label="2023年秋季学期" value="2023年秋季学期" />
              <el-option label="2024年春季学期" value="2024年春季学期" />
            </el-select>
          </el-form-item>
          <el-form-item label="身份证号">
            <el-input
              v-model="searchForm.idCard"
              placeholder="请输入身份证号"
              clearable
              @keyup.enter="handleSearch"
            />
          </el-form-item>
          <el-form-item label="身份认定类型">
            <el-select v-model="searchForm.identityType" placeholder="请选择类型" clearable>
              <el-option label="建档立卡" value="建档立卡" />
              <el-option label="低保家庭" value="低保家庭" />
              <el-option label="特困供养" value="特困供养" />
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
          新增受助信息
        </el-button>
        <el-button type="warning" @click="handleSync" :icon="RefreshRight">
          同步学生数据
        </el-button>
        <el-button type="success" :icon="Download" @click="handleExport">
          导出Excel
        </el-button>
      </div>
    </div>

    <!-- 表格 -->
    <div class="table-container">
      <el-table 
        :data="tableData" 
        style="width: 100%"
        v-loading="loading"
      >
        <el-table-column 
          label="序号" 
          width="60" 
          align="center"
          fixed="left"
        >
          <template #default="scope">
            {{ scope.row.row_num }}
          </template>
        </el-table-column>
        <el-table-column 
          prop="term" 
          label="学期" 
          width="120" 
          align="center"
          fixed="left"
        />
        <el-table-column 
          prop="student_name" 
          label="学生姓名" 
          width="90" 
          align="center"
          fixed="left"
        />
        <el-table-column prop="id_card" label="身份证号" width="160" align="center" />
        <el-table-column prop="grade" label="年级" width="80" align="center" />
        <el-table-column prop="class" label="班级" width="80" align="center" />
        <el-table-column 
          prop="identity_type" 
          label="身份认定类型" 
          width="100" 
          align="center"
          show-overflow-tooltip
        >
          <template #default="scope">
            <span class="no-wrap">{{ scope.row.identity_type }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="assistance_level" label="补助档次" width="90" align="center" />
        <el-table-column prop="assistance_amount" label="补助金额" width="100" align="center">
          <template #default="scope">
            {{ scope.row.assistance_amount ? Number(scope.row.assistance_amount).toFixed(2) : '0.00' }}
          </template>
        </el-table-column>
        <el-table-column prop="create_time" label="创建时间" width="150" align="center" />
        <el-table-column label="操作" width="120" fixed="right" align="center">
          <template #default="scope">
            <el-button type="primary" link @click="handleEdit(scope.row)">编辑</el-button>
            <el-button type="primary" link @click="handleDelete(scope.row)">删除</el-button>
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
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </div>

    <!-- 新增/编辑对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogType === 'add' ? '新增受助信息' : '编辑受助信息'"
      width="500px"
    >
      <el-form :model="form" :rules="rules" ref="formRef" label-width="100px">
        <el-form-item label="学期" prop="term">
          <el-select v-model="form.term" placeholder="请选择学期">
            <el-option label="2023年秋季学期" value="2023年秋季学期" />
            <el-option label="2024年春季学期" value="2024年春季学期" />
          </el-select>
        </el-form-item>
        <el-form-item label="身份证号" prop="idCard">
          <el-input v-model="form.idCard" placeholder="请输入身份证号" />
        </el-form-item>
        <el-form-item label="身份认定类型" prop="identityType">
          <el-select v-model="form.identityType" placeholder="请选择类型">
            <el-option label="建档立卡" value="建档立卡" />
            <el-option label="低保家庭" value="低保家庭" />
            <el-option label="特困供养" value="特困供养" />
          </el-select>
        </el-form-item>
        <el-form-item label="补助档次" prop="assistanceLevel">
          <el-select v-model="form.assistanceLevel" placeholder="请选择档次">
            <el-option label="一档" value="一档" />
            <el-option label="二档" value="二档" />
            <el-option label="三档" value="三档" />
          </el-select>
        </el-form-item>
        <el-form-item label="补助金额" prop="assistanceAmount">
          <el-input-number 
            v-model="form.assistanceAmount" 
            :precision="2" 
            :step="100"
            :min="0"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="handleSubmit">确定</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search, Refresh, Plus, Download, RefreshRight } from '@element-plus/icons-vue'
import { 
  getAssistanceList,
  addAssistance,
  updateAssistance,
  deleteAssistance,
  exportAssistance,
  syncStudentAssistance
} from '@/api/student'

// 数据相关
const tableData = ref([])
const loading = ref(false)
const total = ref(0)
const currentPage = ref(1)
const pageSize = ref(10)

// 搜索表单
const searchForm = ref({
  term: '',
  idCard: '',
  identityType: ''
})

// 对话框相关
const dialogVisible = ref(false)
const dialogType = ref('add')
const formRef = ref(null)
const form = ref({
  term: '',
  idCard: '',
  identityType: '',
  assistanceLevel: '',
  assistanceAmount: 0
})

// 表单验证规则
const rules = {
  term: [{ required: true, message: '请选择学期', trigger: 'change' }],
  idCard: [
    { required: true, message: '请输入身份证号', trigger: 'blur' },
    { pattern: /(^\d{15}$)|(^\d{18}$)|(^\d{17}(\d|X|x)$)/, message: '请输入正确的身份证号', trigger: 'blur' }
  ],
  identityType: [{ required: true, message: '请选择身份认定类型', trigger: 'change' }],
  assistanceLevel: [{ required: true, message: '请选择补助档次', trigger: 'change' }],
  assistanceAmount: [{ required: true, message: '请输入补助金额', trigger: 'blur' }]
}

// 获取表格数据
const fetchData = async () => {
  if (!loading.value) {  // 防止重复加载
    loading.value = true
    try {
      const res = await getAssistanceList({
        page: currentPage.value,
        pageSize: pageSize.value,
        ...searchForm.value
      })
      if (res.code === 200 && res.data) {
        tableData.value = res.data.list || []
        total.value = res.data.total || 0
      }
    } catch (error) {
      console.error('获取数据失败:', error)
      ElMessage.error('获取数据失败')
      tableData.value = []
      total.value = 0
    } finally {
      loading.value = false
    }
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
    term: '',
    idCard: '',
    identityType: ''
  }
  handleSearch()
}

// 新增
const handleAdd = () => {
  dialogType.value = 'add'
  form.value = {
    term: '',
    idCard: '',
    identityType: '',
    assistanceLevel: '',
    assistanceAmount: 0
  }
  dialogVisible.value = true
}

// 编辑
const handleEdit = (row) => {
  dialogType.value = 'edit'
  form.value = {
    id: row.id,
    term: row.term,
    idCard: row.id_card,
    identityType: row.identity_type,
    assistanceLevel: row.assistance_level,
    assistanceAmount: row.assistance_amount
  }
  dialogVisible.value = true
}

// 删除
const handleDelete = (row) => {
  ElMessageBox.confirm('确认删除该记录吗？', '警告', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    try {
      await deleteAssistance(row.id)
      ElMessage.success('删除成功')
      fetchData()
    } catch (error) {
      console.error('删除失败:', error)
    }
  })
}

// 导出
const handleExport = async () => {
  try {
    loading.value = true
    const response = await exportAssistance(searchForm.value)
    // 创建 blob 对象
    const blob = new Blob([response], { 
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
    })
    // 创建临时下载链接
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', '受助信息.xlsx')
    document.body.appendChild(link)
    link.click()
    // 清理
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
  } catch (error) {
    console.error('导出失败:', error)
    ElMessage.error('导出失败')
  } finally {
    loading.value = false
  }
}

// 提交表单
const handleSubmit = async () => {
  if (!formRef.value) return
  
  await formRef.value.validate(async (valid) => {
    if (valid) {
      try {
        if (dialogType.value === 'add') {
          await addAssistance(form.value)
          ElMessage.success('添加成功')
        } else {
          await updateAssistance(form.value.id, form.value)
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

// 分页处理
const handleSizeChange = (val) => {
  pageSize.value = val
  fetchData()
}

const handleCurrentChange = (val) => {
  currentPage.value = val
  fetchData()
}

// 添加同步处理方法
const handleSync = async () => {
  try {
    loading.value = true
    const res = await syncStudentAssistance()
    if (res.code === 200) {
      ElMessage.success(res.message)
      // 如果有返回数据，直接更新表格
      if (res.data && res.data.list) {
        tableData.value = res.data.list
        total.value = res.data.total
      } else {
        // 否则重新获取数据
        await fetchData()
      }
    }
  } catch (error) {
    console.error('同步失败:', error)
    ElMessage.error('同步失败')
  } finally {
    loading.value = false
  }
}

// 清理函数
const cleanup = () => {
  // 清理可能的定时器或事件监听器
  if (dialogVisible.value) {
    dialogVisible.value = false
  }
}

// 组件卸载前清理
onBeforeUnmount(() => {
  cleanup()
})

// 初始化
onMounted(() => {
  fetchData()
})
</script>

<style scoped>
.assistance-container {
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

/* 对话框样式 */
.dialog-footer {
  display: flex;
  justify-content: flex-end;
  margin-top: 20px;
}

:deep(.el-input-number) {
  width: 220px;
}

.no-wrap {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* 如果需要鼠标悬停显示完整内容，可以添加以下样式 */
:deep(.el-table .cell) {
  white-space: nowrap;
}
</style> 