<template>
  <div class="dashboard-container">
    <el-row :gutter="20">
      <el-col :span="6">
        <el-card shadow="hover" class="data-card">
          <template #header>
            <div class="card-header">
              <span>总档案数</span>
              <el-tag type="success">增长12%</el-tag>
            </div>
          </template>
          <div class="card-body">
            <div class="number">12,345</div>
            <div class="text">较上月增加245份</div>
          </div>
        </el-card>
      </el-col>
      <!-- 其他统计卡片 -->
    </el-row>
  </div>
</template>

<style scoped>
.dashboard-container {
  padding: 20px;
}

.data-card {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-body {
  text-align: center;
  padding: 20px 0;
}

.number {
  font-size: 24px;
  font-weight: bold;
  color: #303133;
  margin-bottom: 10px;
}

.text {
  font-size: 14px;
  color: #909399;
}
</style> 