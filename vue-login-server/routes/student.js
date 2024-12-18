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

module.exports = router 