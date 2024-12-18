<template>
  <div class="user-info-container">
    <!-- 搜索栏 -->
    <div class="fixed-header">
      <el-card class="search-card">
        <el-form :inline="true" :model="searchForm" class="search-form">
          <el-form-item label="用户名">
            <el-input
              v-model="searchForm.username"
              placeholder="请输入用户名"
              clearable
              prefix-icon="Search"
              @keyup.enter="handleSearch"
            />
          </el-form-item>
          <el-form-item label="角色">
            <el-select 
              v-model="searchForm.roleType" 
              placeholder="请选择角色"
              clearable
            >
              <el-option label="超级管理员" :value="2" />
              <el-option label="普通管理员" :value="1" />
            </el-select>
          </el-form-item>
          <el-form-item label="状态">
            <el-select 
              v-model="searchForm.status" 
              placeholder="请选择状态"
              clearable
            >
              <el-option label="启用" :value="1" />
              <el-option label="禁用" :value="0" />
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
          新增管理员
        </el-button>
        <el-button type="success" :icon="Download" @click="handleExport">
          导出Excel
        </el-button>
      </div>
    </div>

    <!-- 表格容器 -->
    <div class="table-container">
      <el-table 
        :data="tableData" 
        style="width: 100%"
        v-loading="loading"
      >
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="username" label="用户名" width="120" />
        <el-table-column prop="nickname" label="昵称" width="120" />
        <el-table-column prop="roleType" label="角色类型" width="120">
          <template #default="scope">
            <el-tag :type="scope.row.roleType === 2 ? 'success' : ''">
              {{ scope.row.roleType === 2 ? '超级管理员' : '普通管理员' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template #default="scope">
            <el-tag :type="scope.row.status === 1 ? 'success' : 'danger'">
              {{ scope.row.status === 1 ? '启用' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="gradeLevels" label="负责学段" min-width="180">
          <template #default="scope">
            <el-tag 
              v-for="gradeId in scope.row.gradeLevels"
              :key="gradeId"
              class="grade-tag"
            >
              {{ getGradeName(gradeId) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createTime" label="创建时间" width="180" />
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="scope">
            <el-button type="primary" link @click="handleEdit(scope.row)">编辑</el-button>
            <el-button type="primary" link @click="handleDelete(scope.row)">删除</el-button>
            <el-button 
              type="primary" 
              link 
              @click="handleStatusChange(scope.row)"
            >
              {{ scope.row.status === 1 ? '禁用' : '启用' }}
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
    <el-dialog
      v-model="dialogVisible"
      :title="dialogType === 'add' ? '新增管理员' : '编辑管理员'"
      width="500px"
    >
      <el-form :model="form" :rules="rules" ref="formRef" label-width="100px">
        <el-form-item label="用户名" prop="username">
          <el-input v-model="form.username" :disabled="dialogType === 'edit'" />
        </el-form-item>
        <el-form-item label="昵称" prop="nickname">
          <el-input v-model="form.nickname" />
        </el-form-item>
        <el-form-item label="密码" prop="password" v-if="dialogType === 'add'">
          <el-input v-model="form.password" type="password" show-password />
        </el-form-item>
        <el-form-item label="角色类型" prop="roleType">
          <el-select v-model="form.roleType">
            <el-option label="普通管理员" :value="1" />
            <el-option label="超级管理员" :value="2" />
          </el-select>
        </el-form-item>
        <el-form-item label="负责学段" prop="gradeLevels">
          <el-select v-model="form.gradeLevels" multiple>
            <el-option
              v-for="grade in gradeOptions"
              :key="grade.id"
              :label="grade.name"
              :value="grade.id"
            />
          </el-select>
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
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { 
  Search,
  Refresh,
  Plus,
  Download
} from '@element-plus/icons-vue'
import { 
  getUserList, 
  addUser, 
  updateUser, 
  deleteUser, 
  updateUserStatus,
  getGradeLevels  // 添加这个导入
} from '@/api/user'

// 数据相关
const tableData = ref([])
const total = ref(0)
const currentPage = ref(1)
const pageSize = ref(10)
const searchQuery = ref('')
const loading = ref(false)

// 表单相关
const dialogVisible = ref(false)
const dialogType = ref('add')
const formRef = ref(null)
const form = ref({
  username: '',
  nickname: '',
  password: '',
  roleType: 1,
  gradeLevels: []
})

const rules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 3, max: 20, message: '长度在 3 到 20 个字符', trigger: 'blur' }
  ],
  nickname: [
    { required: true, message: '请输入昵称', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur', when: () => dialogType.value === 'add' },
    { min: 6, message: '密码不能少于6位', trigger: 'blur', when: () => dialogType.value === 'add' }
  ],
  roleType: [
    { required: true, message: '请选择角色类型', trigger: 'change' }
  ],
  gradeLevels: [
    { required: true, message: '请选择负责学段', trigger: 'change' }
  ]
}

// 学段选项
const gradeOptions = ref([])

// 获取学段选项
const fetchGradeOptions = async () => {
  try {
    const res = await getGradeLevels()
    if (res.code === 200) {
      gradeOptions.value = res.data
    }
  } catch (error) {
    console.error('获取学段选项失败:', error)
    ElMessage.error('获取学段选项失败')
  }
}

// 搜索表单
const searchForm = ref({
  username: '',
  roleType: '',
  status: ''
})

// 重置搜索
const resetSearch = () => {
  searchForm.value = {
    username: '',
    roleType: '',
    status: ''
  }
  handleSearch()
}

// 搜索处理
const handleSearch = () => {
  currentPage.value = 1
  fetchData()
}

// 导出功能
const handleExport = () => {
  ElMessage.success('导出成功')
  // TODO: 实现导出功能
}

// 获取表格数据
const fetchData = async () => {
  loading.value = true
  try {
    const res = await getUserList({
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

// 新增按钮处理
const handleAdd = () => {
  dialogType.value = 'add'
  form.value = {
    username: '',
    nickname: '',
    password: '',
    roleType: 1,
    gradeLevels: []
  }
  dialogVisible.value = true
}

// 编辑按钮处理
const handleEdit = (row) => {
  dialogType.value = 'edit'
  // 转换学段数据，从名称数组转为ID数组
  const gradeLevels = row.gradeLevels.map(name => {
    const grade = gradeOptions.value.find(g => g.name === name)
    return grade ? grade.id : null
  }).filter(id => id !== null)
  
  form.value = { 
    ...row,
    gradeLevels // 使用ID数组替换名称数组
  }
  dialogVisible.value = true
}

// 表格显示时转换学段ID为名称
const getGradeName = (gradeId) => {
  const grade = gradeOptions.value.find(g => g.id === gradeId)
  return grade ? grade.name : ''
}

// 删除按钮处理
const handleDelete = (row) => {
  ElMessageBox.confirm('确认删除该管理员吗？', '警告', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    try {
      await deleteUser(row.id)
      ElMessage.success('删除成功')
      fetchData()
    } catch (error) {
      console.error('删除失败:', error)
    }
  })
}

// 修改状态
const handleStatusChange = async (row) => {
  try {
    await updateUserStatus(row.id, row.status === 1 ? 0 : 1)
    ElMessage.success(`${row.status === 1 ? '禁用' : '启用'}成功`)
    fetchData()
  } catch (error) {
    console.error('修改状态失败:', error)
  }
}

// 表单提交
const handleSubmit = async () => {
  if (!formRef.value) return
  
  await formRef.value.validate(async (valid) => {
    if (valid) {
      try {
        if (dialogType.value === 'add') {
          await addUser(form.value)
          ElMessage.success('添加成功')
        } else {
          await updateUser(form.value.id, form.value)
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

// 初始化
onMounted(() => {
  fetchData()
  fetchGradeOptions()
})
</script>

<style scoped>
.user-info-container {
  height: 100%;
  padding: 20px;
  background-color: #f0f2f5;
}

.fixed-header {
  margin-bottom: 20px;
}

.search-card {
  margin-bottom: 20px;
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
  padding: 15px 20px;
  border-radius: 4px;
  display: flex;
  gap: 10px;
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

/* 对话框样式 */
.dialog-footer {
  display: flex;
  justify-content: flex-end;
  margin-top: 20px;
}
</style> 