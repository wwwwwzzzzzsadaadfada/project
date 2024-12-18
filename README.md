# 学生档案管理系统

基于 Vue 3 + Element Plus + Express + MySQL 的学生档案管理系统。

## 功能特性

- 用户管理：管理员账号管理、角色权限控制
- 学生信息管理：基本信息的增删改查
- 数据导入导出：支持 Excel 批量导入导出
- 标签管理：支持多种标签（乡村振兴库、民政库等）

## 技术栈

- 前端：Vue 3、Element Plus、Vite
- 后端：Express、MySQL
- 工具：xlsx、multer 等

## 安装使用

1. 克隆项目
```bash
git clone https://github.com/你的用户名/仓库名.git
```

2. 安装依赖
```bash
# 前端
cd 项目目录
npm install

# 后端
cd vue-login-server
npm install
```

3. 配置数据库
- 创建数据库
- 配置数据库连接信息

4. 启动开发服务器
```bash
npm run dev
```

5. 构建生产版本
```bash
npm run build
```

## 项目结构

```
src/
  ├── assets/          # 静态资源文件
  ├── components/      # 公共组件
  ├── router/          # 路由配置
  ├── views/           # 页面视图
  ├── App.vue          # 根组件
  └── main.js          # 入口文件
```

## 功能特点

- 用户登录/注册
- 表单验证
- 记住密码
- 社交媒体登录
- 响应式布局
- 主题切换

## 贡献

欢迎提交 Issue 或 Pull Request！

## 许可证

[MIT License](LICENSE)
