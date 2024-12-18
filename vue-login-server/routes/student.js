const express = require('express')
const router = express.Router()
const studentController = require('../controllers/student')
const authMiddleware = require('../middleware/auth')
const multer = require('multer')
const upload = multer()

// 需要验证的路由
router.get('/list', authMiddleware, studentController.getStudentList)
router.post('/', authMiddleware, studentController.addStudent)
router.put('/:id', authMiddleware, studentController.updateStudent)
router.delete('/', authMiddleware, studentController.deleteStudent)
router.put('/:id/status', authMiddleware, studentController.updateStudentStatus)
router.get('/template', studentController.downloadTemplate)
router.post('/import', upload.single('file'), studentController.importStudents)
router.post('/export', studentController.exportStudents)

// 受助信息相关路由
router.get('/assistance/list', authMiddleware, studentController.getAssistanceList)
router.post('/assistance', authMiddleware, studentController.addAssistance)
router.put('/assistance/:id', authMiddleware, studentController.updateAssistance)
router.delete('/assistance', authMiddleware, studentController.deleteAssistance)
router.get('/assistance/export', authMiddleware, studentController.exportAssistance)

// 同步学生信息到受助信息
router.post('/assistance/sync', authMiddleware, studentController.syncAssistance)

module.exports = router 