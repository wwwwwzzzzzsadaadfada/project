<template>
  <div class="info-container">
    <!-- 顶部操作栏 -->
    <div class="operation-bar">
      <el-button type="primary" @click="handleAdd">新增管理员</el-button>
      <el-input
        v-model="searchQuery"
        placeholder="请输入用户名或昵称"
        style="width: 200px; margin-left: 10px"
        @input="handleSearch"
      >
        <template #append>
          <el-button @click="handleSearch">搜索</el-button>
        </template>
      </el-input>
    </div>

    <!-- 数据表格 -->
    <el-table :data="tableData" style="width: 100%; margin-top: 20px">
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
            v-for="grade in scope.row.gradeLevels"
            :key="grade"
            class="grade-tag"
          >
            {{ grade }}
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
        layout="total, sizes, prev, pager, next"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
      />
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
import request from '@/utils/request'

// 数据相关
const tableData = ref([])
const total = ref(0)
const currentPage = ref(1)
const pageSize = ref(10)
const searchQuery = ref('')
const gradeOptions = ref([])

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

// 表单验证规则
const rules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 3, max: 20, message: '长度在 3 到 20 个字符', trigger: 'blur' }
  ],
  nickname: [
    { required: true, message: '请输入昵称', trigger: 'blur' },
    { min: 2, max: 20, message: '长度在 2 到 20 个字符', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码不能少于6位', trigger: 'blur' }
  ],
  roleType: [
    { required: true, message: '请选择角色类型', trigger: 'change' }
  ],
  gradeLevels: [
    { required: true, message: '请选择负责学段', trigger: 'change' }
  ]
}

// 获取数据列表
const fetchData = async () => {
  try {
    const res = await request({
      url: '/api/admin/list',
      method: 'get',
      params: {
        page: currentPage.value,
        pageSize: pageSize.value,
        query: searchQuery.value
      }
    })
    tableData.value = res.data.list
    total.value = res.data.total
  } catch (error) {
    console.error('获取数据失败:', error)
  }
}

// 获取学段选项
const fetchGradeOptions = async () => {
  try {
    const res = await request({
      url: '/api/admin/grade-levels',
      method: 'get'
    })
    gradeOptions.value = res.data
  } catch (error) {
    console.error('获取学段选项失败:', error)
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
  form.value = {
    id: row.id,
    username: row.username,
    nickname: row.nickname,
    roleType: row.roleType,
    gradeLevels: row.gradeLevels.map(grade => grade.id)
  }
  dialogVisible.value = true
}

// 删除按钮处理
const handleDelete = (row) => {
  ElMessageBox.confirm(
    '确认删除该管理员吗？',
    '警告',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(async () => {
    try {
      await request({
        url: `/api/admin/${row.id}`,
        method: 'delete'
      })
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
    await request({
      url: `/api/admin/${row.id}/status`,
      method: 'put',
      data: {
        status: row.status === 1 ? 0 : 1
      }
    })
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
          await request({
            url: '/api/admin',
            method: 'post',
            data: form.value
          })
          ElMessage.success('添加成功')
        } else {
          await request({
            url: `/api/admin/${form.value.id}`,
            method: 'put',
            data: form.value
          })
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

// 搜索处理
const handleSearch = () => {
  currentPage.value = 1
  fetchData()
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
.info-container {
  padding: 20px;
}

.operation-bar {
  margin-bottom: 20px;
  display: flex;
  align-items: center;
}

.pagination {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

.grade-tag {
  margin-right: 5px;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  margin-top: 20px;
}
</style> 