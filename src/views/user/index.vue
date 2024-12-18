<template>
  <div class="user-container">
    <div class="filter-container">
      <el-form :inline="true" :model="queryParams" class="demo-form-inline">
        <el-form-item label="用户名">
          <el-input v-model="queryParams.username" placeholder="请输入用户名" clearable />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="queryParams.status" placeholder="请选择状态" clearable>
            <el-option label="启用" value="1" />
            <el-option label="禁用" value="0" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleQuery">查询</el-button>
          <el-button @click="resetQuery">重置</el-button>
        </el-form-item>
      </el-form>
    </div>

    <div class="table-container">
      <div class="table-header">
        <el-button type="primary" @click="handleAdd">新增用户</el-button>
      </div>
      
      <el-table :data="userList" border style="width: 100%">
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
        <el-table-column prop="createTime" label="创建时间" width="180" />
        <el-table-column label="操作" fixed="right" width="200">
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

      <div class="pagination-container">
        <el-pagination
          v-model:current-page="queryParams.pageNum"
          v-model:page-size="queryParams.pageSize"
          :page-sizes="[10, 20, 30, 50]"
          :total="total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'

// 查询参数
const queryParams = reactive({
  pageNum: 1,
  pageSize: 10,
  username: '',
  status: ''
})

// 用户列表数据
const userList = ref([
  {
    id: 1,
    username: 'admin',
    nickname: '超级管理员',
    roleType: 2,
    status: 1,
    createTime: '2024-01-01 12:00:00'
  }
])
const total = ref(1)

// 查询方法
const handleQuery = () => {
  // TODO: 调用后端接口获取数据
  ElMessage.success('查询成功')
}

// 重置查询
const resetQuery = () => {
  queryParams.username = ''
  queryParams.status = ''
  handleQuery()
}

// 新增用户
const handleAdd = () => {
  ElMessage.info('新增用户功能开发中...')
}

// 编辑用户
const handleEdit = (row) => {
  ElMessage.info('编辑用户功能开发中...')
}

// 删除用户
const handleDelete = (row) => {
  ElMessageBox.confirm(
    '确认要删除该用户吗？',
    '警告',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(() => {
    ElMessage.success('删除成功')
  }).catch(() => {})
}

// 修改用户状态
const handleStatusChange = (row) => {
  ElMessage.success(`${row.status === 1 ? '禁用' : '启用'}成功`)
}

// 分页方法
const handleSizeChange = (val) => {
  queryParams.pageSize = val
  handleQuery()
}

const handleCurrentChange = (val) => {
  queryParams.pageNum = val
  handleQuery()
}
</script>

<style scoped>
.user-container {
  padding: 20px;
}

.filter-container {
  background: #fff;
  padding: 20px;
  border-radius: 4px;
  margin-bottom: 20px;
}

.table-container {
  background: #fff;
  padding: 20px;
  border-radius: 4px;
}

.table-header {
  margin-bottom: 20px;
}

.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}
</style> 