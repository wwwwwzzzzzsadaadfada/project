import request from '@/utils/request'

// 获取学生列表
export function getStudentList(params) {
  return request({
    url: '/api/student/list',
    method: 'get',
    params: {
      page: params.page,
      pageSize: params.pageSize,
      name: params.name || '',
      idCard: params.idCard || '',
      grade: params.grade || ''
    }
  })
}

// 添加学生
export function addStudent(data) {
  return request({
    url: '/api/student',
    method: 'post',
    data
  })
}

// 更新学生信息
export function updateStudent(id, data) {
  return request({
    url: `/api/student/${id}`,
    method: 'put',
    data
  })
}

// 删除学生（支持批量删除）
export function deleteStudent(ids) {
  return request({
    url: '/api/student',
    method: 'delete',
    data: { ids: Array.isArray(ids) ? ids : [ids] }
  })
}

// 更新学生状态
export function updateStudentStatus(id, status) {
  return request({
    url: `/api/student/${id}/status`,
    method: 'put',
    data: { status }
  })
}

// 导出数据
export function exportStudentData(params) {
  return request({
    url: '/api/student/export',
    method: 'get',
    params,
    responseType: 'blob'
  })
}

// 获取受助信息列表
export function getAssistanceList(params) {
  return request({
    url: '/api/student/assistance/list',
    method: 'get',
    params
  })
}

// 添加受助信息
export function addAssistance(data) {
  return request({
    url: '/api/student/assistance',
    method: 'post',
    data
  })
}

// 更新受助信息
export function updateAssistance(id, data) {
  return request({
    url: `/api/student/assistance/${id}`,
    method: 'put',
    data
  })
}

// 删除受助信息
export function deleteAssistance(ids) {
  return request({
    url: '/api/student/assistance',
    method: 'delete',
    data: { ids: Array.isArray(ids) ? ids : [ids] }
  })
}

// 导出受助信息
export function exportAssistance(params) {
  return request({
    url: '/api/student/assistance/export',
    method: 'get',
    params,
    responseType: 'blob'
  })
}

// 同步在校学生信息到受助信息
export function syncStudentAssistance() {
  return request({
    url: '/api/student/assistance/sync',
    method: 'post'
  })
} 