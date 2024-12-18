<template>
  <div class="login-container">
    <div class="login-content">
      <!-- 左侧区域 -->
      <div class="login-left">
        <div class="illustration-content">
          <img src="@/assets/login-illustration.svg" alt="login" class="login-illustration" />
          <h2 class="illustration-text">Welcome Back</h2>
          <p class="illustration-desc">登录以继续访问系统</p>
        </div>
      </div>
      
      <!-- 右侧登录表单 -->
      <div class="login-form">
        <div class="form-header">
          <h2>欢迎登录</h2>
          <p class="sub-title">请使用您的账号密码登录系统</p>
        </div>

        <el-form 
          :model="loginForm" 
          :rules="rules" 
          ref="loginFormRef"
          class="login-form-content"
        >
          <el-form-item prop="username">
            <el-input 
              v-model="loginForm.username"
              placeholder="请输入用户名"
              :prefix-icon="User"
              size="large"
            />
          </el-form-item>
          
          <el-form-item prop="password">
            <el-input 
              v-model="loginForm.password"
              type="password"
              placeholder="请输入密码"
              :prefix-icon="Lock"
              :suffix-icon="Hide"
              show-password
              size="large"
            />
          </el-form-item>
          
          <div class="remember-forgot">
            <el-checkbox v-model="loginForm.remember">
              <span class="remember-text">记住密码</span>
            </el-checkbox>
            <el-link type="primary" :underline="false" class="forgot-link">忘记密码？</el-link>
          </div>
          
          <el-button 
            type="primary" 
            class="login-btn" 
            size="large"
            :loading="loading"
            @click="handleLogin"
          >
            登录
          </el-button>
          
          <div class="divider">
            <span class="divider-text">其他登录方式</span>
          </div>

          <div class="social-login">
            <el-button 
              class="social-btn"
              :icon="Message"
              circle
              @click="handleSmsLogin"
            />
            <el-button 
              class="social-btn"
              :icon="Wechat"
              circle
              @click="handleWechatLogin"
            />
          </div>
          
          <div class="register-hint">
            还没有账号？
            <el-link type="primary" :underline="false" @click="handleRegister">立即注册</el-link>
          </div>
        </el-form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { ElMessage } from 'element-plus'
import { User, Lock, Hide, Message, ChatDotRound as Wechat } from '@element-plus/icons-vue'
import { login } from '@/api/admin'
import { useRouter } from 'vue-router'

const loading = ref(false)
const loginFormRef = ref(null)
const loginForm = reactive({
  username: '',
  password: '',
  remember: false
})

const rules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 3, message: '用户名不能少于3个字符', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码不能少于6位', trigger: 'blur' }
  ]
}

const router = useRouter()

const handleLogin = async () => {
  if (!loginFormRef.value) return
  
  try {
    await loginFormRef.value.validate()
    loading.value = true
    
    const res = await login({
      username: loginForm.username,
      password: loginForm.password
    })
    
    // 存储 token
    localStorage.setItem('token', res.data.token)
    // 存储用户信息
    localStorage.setItem('userInfo', JSON.stringify(res.data.userInfo))
    
    ElMessage.success('登录成功')
    // 跳转到首页
    router.push('/')
  } catch (error) {
    ElMessage.error(error.response?.data?.message || '登录失败')
  } finally {
    loading.value = false
  }
}

const handleSmsLogin = () => {
  ElMessage.info('短信登录功能开发中...')
}

const handleWechatLogin = () => {
  ElMessage.info('微信登录功能开发中...')
}

const handleRegister = () => {
  ElMessage.info('注册功能开发中...')
}
</script>

<style scoped>
.login-container {
  height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.login-content {
  display: flex;
  width: 1000px;
  height: 600px;
  background: white;
  border-radius: 20px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.login-left {
  flex: 1;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px;
  color: white;
}

.illustration-content {
  text-align: center;
}

.login-illustration {
  width: 80%;
  max-width: 400px;
  margin-bottom: 30px;
}

.illustration-text {
  font-size: 32px;
  font-weight: 600;
  margin-bottom: 16px;
}

.illustration-desc {
  font-size: 16px;
  opacity: 0.9;
}

.login-form {
  flex: 1;
  padding: 48px;
  display: flex;
  flex-direction: column;
}

.form-header {
  text-align: center;
  margin-bottom: 40px;
}

.form-header h2 {
  font-size: 28px;
  color: #333;
  margin-bottom: 8px;
}

.sub-title {
  color: #666;
  font-size: 14px;
}

.login-form-content {
  flex: 1;
}

:deep(.el-input__wrapper) {
  padding: 0 15px;
  box-shadow: 0 0 0 1px #dcdfe6 inset;
}

:deep(.el-input__wrapper.is-focus) {
  box-shadow: 0 0 0 1px #764ba2 inset;
}

:deep(.el-input__inner) {
  height: 45px;
}

.remember-forgot {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.remember-text {
  color: #666;
  font-size: 14px;
}

.forgot-link {
  font-size: 14px;
}

.login-btn {
  width: 100%;
  height: 45px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  font-size: 16px;
  margin-bottom: 24px;
}

.login-btn:hover {
  opacity: 0.9;
}

.divider {
  position: relative;
  text-align: center;
  margin: 20px 0;
}

.divider::before,
.divider::after {
  content: '';
  position: absolute;
  top: 50%;
  width: 45%;
  height: 1px;
  background-color: #eee;
}

.divider::before {
  left: 0;
}

.divider::after {
  right: 0;
}

.divider-text {
  background: white;
  padding: 0 10px;
  color: #999;
  font-size: 14px;
}

.social-login {
  display: flex;
  justify-content: center;
  gap: 20px;
  margin-bottom: 24px;
}

.social-btn {
  width: 40px;
  height: 40px;
  border: 1px solid #eee;
  color: #666;
}

.social-btn:hover {
  color: #764ba2;
  border-color: #764ba2;
}

.register-hint {
  text-align: center;
  color: #666;
  font-size: 14px;
}

:deep(.el-button.is-circle) {
  padding: 8px;
}
</style> 