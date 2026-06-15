const Hemera = require('nats-hemera')
const NATS = require('nats')

const nats = NATS.connect({
  url: 'nats://nats:4222',
  reconnect: true,
  maxReconnectAttempts: -1,
  reconnectTimeWait: 2000
})

const hemera = new Hemera(nats)

hemera.ready(() => {
  console.log('Client simulator started. Spimming orders every 2 seconds...')
  let count = 1

  setInterval(() => {
    const currentCount = count++

    hemera.act({
      topic: 'order',
      cmd: 'create',
      product: 'Pizza Auto-Test',
      quantity: currentCount,
      timeout$: 3000 
    }, (err, res) => {

      if (err) {
        console.error(`[Order #${currentCount}] FAILED:`, err.message)
        return
      }

      console.log(`[Order #${currentCount}] Handled successfully by: [${res.processedBy}]`)
    })

  }, 2000) 
})