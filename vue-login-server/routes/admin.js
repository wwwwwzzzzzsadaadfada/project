const express = require('express')
const router = express.Router()
const adminController = require('../controllers/admin')
const authMiddleware = require('../middleware/auth')

// 不需要验证的路由
router.get('/captcha', adminController.getCaptcha)
router.post('/login', adminController.login)

// 需要验证的路由
router.get('/grade-levels', authMiddleware, adminController.getGradeLevels)
router.get('/list', authMiddleware, adminController.getAdminList)

// 修改密码路由要放在带参数的路由之前
router.put('/password', authMiddleware, adminController.updatePassword)
router.put('/password/reset', authMiddleware, adminController.resetPassword)

// 其他需要 ID 参数的路由
router.post('/', authMiddleware, adminController.addAdmin)
router.put('/:id', authMiddleware, adminController.updateAdmin)
router.delete('/:id', authMiddleware, adminController.deleteAdmin)
router.put('/:id/status', authMiddleware, adminController.updateAdminStatus)

module.exports = router 