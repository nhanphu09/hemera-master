'use strict'

const Hemera = require('./../../packages/hemera')
const nats = require('nats').connect({ url: 'nats://127.0.0.1:4222' })

const hemera = new Hemera(nats, { logLevel: 'info' })

hemera.ready(() => {
  hemera.add({
    topic: 'math',
    cmd: 'add'
  }, function (req, cb) {
    // GIẢ LẬP SỰ CỐ (Fault Tolerance): 
    // Nếu client gửi số a = 5, server này sẽ bị "treo" mất 3 giây trước khi trả lời
    if (req.a === 5) {
      console.log(`⏳ [Server PID: ${process.pid}] Gặp tác vụ nặng/lỗi, giả lập treo trong 3 giây...`)
      setTimeout(() => {
        cb(null, req.a + req.b)
      }, 3000)
      return
    }

    console.log(`⚡ [Server PID: ${process.pid}] Đang xử lý thành công: ${req.a} + ${req.b}`)
    cb(null, req.a + req.b)
  })
  
  console.log(`✅ [Server PID: ${process.pid}] Server gánh tải đã sẵn sàng!`)
})