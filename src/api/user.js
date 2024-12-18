import request from '@/utils/request'

// 获取用户列表
export function getUserList(params) {
  return request({
    url: '/api/admin/list',
    method: 'get',
    params: {
      page: params.page,
      pageSize: params.pageSize,
      username: params.username || '',
      roleType: params.roleType || '',
      status: params.status || ''
    }
  })
}

// 添加用户
export function addUser(data) {
  return request({
    url: '/api/admin',
    method: 'post',
    data
  })
}

// 更新用户
export function updateUser(id, data) {
  return request({
    url: `/api/admin/${id}`,
    method: 'put',
    data
  })
}

// 删除用户
export function deleteUser(id) {
  return request({
    url: `/api/admin/${id}`,
    method: 'delete'
  })
}

// 更新用户状态
export function updateUserStatus(id, status) {
  return request({
    url: `/api/admin/${id}/status`,
    method: 'put',
    data: { status }
  })
}

// 获取学段列表
export function getGradeLevels() {
  return request({
    url: '/api/admin/grade-levels',
    method: 'get'
  })
}

// 修改密码
export function updatePassword(data) {
  return request({
    url: '/api/admin/password',
    method: 'put',
    data
  })
}

// 重置密码
export function resetPassword() {
  return request({
    url: '/api/admin/password/reset',
    method: 'put'
  })
} 