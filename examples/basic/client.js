'use strict'

const Hemera = require('./../../packages/hemera')
const nats = require('nats').connect({ url: 'nats://127.0.0.1:4222' })

const hemera = new Hemera(nats, { logLevel: 'info' })

hemera.ready(async () => {
  console.log('🚀 Bắt đầu bắn 10 yêu cầu tính toán lên hệ thống...\n')
  
  for (let i = 1; i <= 10; i++) {
    try {
      // Gửi request dạng bất đồng bộ tịnh tiến
      const result = await hemera.act({
        topic: 'math',
        cmd: 'add',
        a: i,
        b: i * 10
      })
      console.log(`Nhận kết quả yêu cầu ${i}:`, result.data)
    } catch (err) {
      console.error(`Yêu cầu ${i} bị lỗi:`, err)
    }
  }
  
  console.log('\nĐã gửi xong toàn bộ!')
  process.exit(0)
})