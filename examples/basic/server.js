'use strict'

const Hemera = require('./../../packages/hemera')
const nats = require('nats').connect({ url: 'nats://127.0.0.1:4222' })

const hemera = new Hemera(nats, { logLevel: 'info' })

hemera.ready(() => {
  hemera.add({
    topic: 'math',
    cmd: 'add'
  }, function (req, cb) {
    // In ra màn hình PID của server này khi nó nhận được yêu cầu để phân biệt các bản sao gánh tải
    console.log(`⚡ [Server PID: ${process.pid}] Đang gánh tải xử lý: ${req.a} + ${req.b}`)
    
    // Trả về kết quả
    cb(null, req.a + req.b)
  })
  
  console.log(`✅ [Server PID: ${process.pid}] Đã khởi động và sẵn sàng nhận task!`)
})