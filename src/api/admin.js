import request from '@/utils/request'

export function login(data) {
  return request({
    url: '/api/admin/login',
    method: 'post',
    data
  })
}

export function getGradeLevels() {
  return request({
    url: '/api/admin/grade-levels',
    method: 'get'
  })
} 