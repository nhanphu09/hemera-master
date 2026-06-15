const express = require('express')
const Hemera = require('nats-hemera')
const NATS = require('nats')

const app = express()
app.use(express.json())
app.use(express.static('public'))

const nats = NATS.connect({
  url: 'nats://nats:4222',
  reconnect: true,             
  maxReconnectAttempts: -1,    
  reconnectTimeWait: 2000      
})

const hemera = new Hemera(nats, {
  logLevel: 'info'
})


function actWithRetry(pattern, data, retries = 2) {
  return new Promise((resolve, reject) => {
    const attempt = (n) => {
      hemera.act(
        {
          ...pattern,
          ...data,
          timeout$: 3000 
        },
        (err, res) => {
          if (!err) return resolve(res)

          
          if (n > 0) {
            console.warn(`[Web Server] Gặp sự cố. Đang thử lại... Còn lại ${n} lần thử.`);
            return attempt(n - 1)
          }

          
          reject(err)
        }
      )
    }
    attempt(retries)
  })
}

hemera.ready(() => {
  console.log('Web server Hemera ready.')

  app.post('/order', async (req, res) => {
    try {
      const result = await actWithRetry(
        { topic: 'order', cmd: 'create' },
        {
          product: req.body.product,
          quantity: Number(req.body.quantity)
        },
        2 
      )

      res.json(result)

    } catch (err) {
      console.error('All retries failed:', err.message)
      res.status(503).json({
        success: false,
        fallback: true,
        message: 'Hệ thống xử lý đơn hàng đang bận hoặc gặp sự cố quá tải. Vui lòng thử lại sau!',
        error: err.message
      })
    }
  })

  app.get('/health', (req, res) => {
    if (nats.status !== 'connected') {
      return res.status(500).json({ status: 'degraded', message: 'NATS Connection Lost' })
    }

    hemera.act({
      topic: 'health',
      cmd: 'check',
      timeout$: 2000
    }, (err, result) => {
      if (err) {
        return res.status(500).json({ status: 'degraded', reason: err.message })
      }
      res.json(result)
    })
  })

  app.listen(3000, () => {
    console.log('Web server running at http://localhost:3000')
  })
})