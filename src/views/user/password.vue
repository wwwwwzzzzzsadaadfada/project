<template>
  <div class="password-container">
    <el-card class="password-card">
      <template #header>
        <div class="card-header">
          <span>修改密码</span>
        </div>
      </template>
      
      <el-form 
        ref="formRef"
        :model="form"
        :rules="rules"
        label-width="100px"
        class="password-form"
      >
        <el-form-item label="用户名">
          <el-input v-model="userInfo.username" disabled />
        </el-form-item>
        <el-form-item label="昵称">
          <el-input v-model="userInfo.nickname" disabled />
        </el-form-item>
        <el-form-item label="原密码" prop="oldPassword">
          <el-input 
            v-model="form.oldPassword"
            type="password"
            show-password
            placeholder="请输入原密码"
          />
        </el-form-item>
        <el-form-item label="新密码" prop="newPassword">
          <el-input 
            v-model="form.newPassword"
            type="password"
            show-password
            placeholder="请输入新密码"
          />
        </el-form-item>
        <el-form-item label="确认密码" prop="confirmPassword">
          <el-input 
            v-model="form.confirmPassword"
            type="password"
            show-password
            placeholder="请再次输入新密码"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSubmit">修改密码</el-button>
          <el-button type="warning" @click="handleReset">重置密码</el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { updatePassword, resetPassword } from '@/api/user'

// 获取当前登录用户信息
const userInfo = ref(JSON.parse(localStorage.getItem('userInfo') || '{}'))

// 表单数据
const formRef = ref(null)
const form = ref({
  oldPassword: '',
  newPassword: '',
  confirmPassword: ''
})

// 验证新密码与确认密码是否一致
const validateConfirmPassword = (rule, value, callback) => {
  if (value !== form.value.newPassword) {
    callback(new Error('两次输入的密码不一致'))
  } else {
    callback()
  }
}

// 表单验证规则
const rules = {
  oldPassword: [
    { required: true, message: '请输入原密码', trigger: 'blur' },
    { min: 6, message: '密码不能少于6位', trigger: 'blur' }
  ],
  newPassword: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    { min: 6, message: '密码不能少于6位', trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, message: '请再次输入新密码', trigger: 'blur' },
    { validator: validateConfirmPassword, trigger: 'blur' }
  ]
}

// 提交修改密码
const handleSubmit = async () => {
  if (!formRef.value) return
  
  await formRef.value.validate(async (valid) => {
    if (valid) {
      try {
        await updatePassword({
          oldPassword: form.value.oldPassword,
          newPassword: form.value.newPassword
        })
        ElMessage.success('密码已修改，3秒后将跳转到登录页面')
        // 清除登录信息，延迟3秒后跳转到登录页
        setTimeout(() => {
          localStorage.removeItem('token')
          localStorage.removeItem('userInfo')
          window.location.href = '/login'
        }, 3000)
      } catch (error) {
        console.error('修改密码失败:', error)
      }
    }
  })
}

// 重置密码
const handleReset = () => {
  ElMessageBox.confirm('确定要将密码重置为 123456 吗？', '警告', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    try {
      await resetPassword()
      ElMessage.success('密码已重置为123456，3秒后将跳转到登录页面')
      // 清除登录信息，延迟3秒后跳转到登录页
      setTimeout(() => {
        localStorage.removeItem('token')
        localStorage.removeItem('userInfo')
        window.location.href = '/login'
      }, 3000)
    } catch (error) {
      console.error('重置密码失败:', error)
    }
  })
}
</script>

<style scoped>
.password-container {
  padding: 20px;
  background-color: #f0f2f5;
  height: 100%;
}

.password-card {
  max-width: 600px;
  margin: 0 auto;
  background-color: #fff;
  border-radius: 4px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 16px;
  font-weight: bold;
}

.password-form {
  max-width: 400px;
  margin: 20px auto;
}

:deep(.el-input) {
  width: 100%;
}

:deep(.el-form-item__content) {
  justify-content: flex-start;
}

:deep(.el-form-item:last-child) {
  margin-bottom: 0;
}

:deep(.el-form-item:last-child .el-form-item__content) {
  margin-left: 0 !important;
  justify-content: center;
}

:deep(.el-button) {
  padding: 12px 25px;
  margin: 0 10px;
}
</style> 