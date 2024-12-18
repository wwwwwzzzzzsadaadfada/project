<template>
  <div class="app-wrapper">
    <!-- 左侧导航栏 -->
    <div class="sidebar-container">
      <div class="logo">
        <img src="@/assets/logo.png" alt="logo">
        <span>档案资源系统</span>
      </div>
      <el-menu
        :default-active="activeMenu"
        class="sidebar-menu"
        background-color="#304156"
        text-color="#bfcbd9"
        active-text-color="#409EFF"
        :collapse="isCollapse"
        router
      >
        <el-menu-item index="/dashboard">
          <el-icon><HomeFilled /></el-icon>
          <template #title>首页</template>
        </el-menu-item>

        <el-sub-menu index="/user">
          <template #title>
            <el-icon><User /></el-icon>
            <span>用户信息管理</span>
          </template>
          <el-menu-item index="/user/info">
            <el-icon><UserFilled /></el-icon>
            <template #title>用户信息管理</template>
          </el-menu-item>
          <el-menu-item index="/user/password">
            <el-icon><Lock /></el-icon>
            <template #title>修改密码</template>
          </el-menu-item>
        </el-sub-menu>

        <el-sub-menu index="/student">
          <template #title>
            <el-icon><Notebook /></el-icon>
            <span>学生信息管理</span>
          </template>
          <el-menu-item index="/student/info">
            <el-icon><Document /></el-icon>
            <template #title>基本信息管理</template>
          </el-menu-item>
        </el-sub-menu>
      </el-menu>
    </div>

    <!-- 主要内容区 -->
    <div class="main-container">
      <!-- 头部导航 -->
      <div class="navbar">
        <div class="left">
          <el-icon 
            class="fold-btn"
            @click="toggleSidebar"
          >
            <Fold v-if="!isCollapse"/>
            <Expand v-else/>
          </el-icon>
          <breadcrumb />
        </div>
        <div class="right">
          <el-dropdown trigger="click">
            <div class="avatar-wrapper">
              <el-avatar :size="32" src="https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png" />
              <span class="username">{{ userInfo.nickname }}</span>
              <el-icon><CaretBottom /></el-icon>
            </div>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item>个人中心</el-dropdown-item>
                <el-dropdown-item divided @click="handleLogout">退出登录</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </div>
      
      <!-- 内容区 -->
      <div class="app-main">
        <router-view></router-view>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import {
  HomeFilled,
  User,
  UserFilled,
  Lock,
  Notebook,
  Document,
  Fold,
  Expand,
  CaretBottom
} from '@element-plus/icons-vue'

const router = useRouter()
const isCollapse = ref(false)
const userInfo = ref(JSON.parse(localStorage.getItem('userInfo') || '{}'))

const activeMenu = computed(() => {
  return router.currentRoute.value.path
})

const toggleSidebar = () => {
  isCollapse.value = !isCollapse.value
}

const handleLogout = () => {
  localStorage.removeItem('token')
  localStorage.removeItem('userInfo')
  router.push('/login')
  ElMessage.success('退出成功')
}
</script>

<style scoped>
.app-wrapper {
  display: flex;
  height: 100vh;
  width: 100%;
}

.sidebar-container {
  width: 210px;
  height: 100%;
  background-color: #304156;
  transition: width 0.3s;
  overflow: hidden;
}

.sidebar-container.collapse {
  width: 64px;
}

.logo {
  height: 50px;
  display: flex;
  align-items: center;
  padding: 0 16px;
  background: #2b2f3a;
}

.logo img {
  width: 32px;
  height: 32px;
  margin-right: 12px;
}

.logo span {
  color: #fff;
  font-size: 16px;
  font-weight: 600;
  white-space: nowrap;
}

.sidebar-menu {
  border: none;
}

.main-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.navbar {
  height: 50px;
  background: #fff;
  box-shadow: 0 1px 4px rgba(0,21,41,.08);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
}

.navbar .left {
  display: flex;
  align-items: center;
}

.fold-btn {
  font-size: 20px;
  cursor: pointer;
  margin-right: 16px;
}

.avatar-wrapper {
  display: flex;
  align-items: center;
  cursor: pointer;
}

.username {
  margin: 0 8px;
  color: #333;
}

.app-main {
  flex: 1;
  padding: 16px;
  overflow-y: auto;
  background: #f0f2f5;
}

:deep(.el-menu) {
  border-right: none;
}

:deep(.el-menu-item) {
  height: 50px;
  line-height: 50px;
}

:deep(.el-menu-item.is-active) {
  background-color: #263445 !important;
}
</style> 