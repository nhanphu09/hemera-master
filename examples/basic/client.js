'use strict'

const Hemera = require('./../../packages/hemera')
const natsUrl = process.env.NATS_URL || 'nats://127.0.0.1:4222'
const nats = require('nats').connect({ url: natsUrl })

const hemera = new Hemera(nats, { logLevel: 'info' })

hemera.ready(async () => {
  console.log('🚀 Client bắt đầu gửi 10 yêu cầu để test Fault Tolerance...\n')
  
  for (let i = 1; i <= 10; i++) {
    try {
      // ÁP DỤNG CÔNG THỨC TIMEOUT$: Đặt ngưỡng chờ là 1.5 giây (1500ms)
      const result = await hemera.act({
        topic: 'math',
        cmd: 'add',
        a: i,
        b: i * 10,
        timeout$: 1500 // <--- Cấu hình cụ thể cho lượt gọi này
      })
      console.log(` Nhận kết quả yêu cầu ${i}:`, result.data)
    } catch (err) {
      // DUNG LỖI (Fault Tolerance): Bắt lỗi TimeoutError để ứng dụng không bị crash sập nguồn
      if (err.name === 'TimeoutError') {
        console.error(`🚨 [DUNG LỖI] Yêu cầu ${i} bị TIMEOUT (Server xử lý quá lâu hoặc sập). Cô lập lỗi thành công, hệ thống chạy tiếp!`)
      } else {
        console.error(`❌ Yêu cầu ${i} bị lỗi khác:`, err.message)
      }
    }
  }
  
  console.log('\n Toàn bộ chuỗi tiến trình đã hoàn thành an toàn!')
  process.exit(0)
})