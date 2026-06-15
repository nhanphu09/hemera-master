const Hemera = require('nats-hemera')
const NATS = require('nats')
const mongoose = require('mongoose')
const Order = require('./models/Order')

const instance = process.env.INSTANCE || 'order-1'

async function startService() {
  try {
    await mongoose.connect('mongodb://mongo:27017/distributed-system', {
      serverSelectionTimeoutMS: 5000 
    })
    console.log(`${instance} connected MongoDB successfully.`)

    const nats = NATS.connect({
      url: 'nats://nats:4222',
      reconnect: true,            
      maxReconnectAttempts: -1,   
      reconnectTimeWait: 2000     
    })

    nats.on('reconnect', () => {
      console.log(`⚡ [${instance}] Đã tái kết nối thành công với NATS Server!`)
    })

    nats.on('reconnecting', () => {
      console.log(`[${instance}] Đang cố gắng kết nối lại với NATS Server...`)
    })

    nats.on('error', (err) => {
      console.error(`[${instance}] NATS Error:`, err.message)
    })

    const hemera = new Hemera(nats, {
      logLevel: 'info'
    })

    hemera.ready(() => {
      console.log(`${instance} Hemera ready and listening...`)

      hemera.add({
        topic: 'health',
        cmd: 'check'
      }, async function (req) {
        return {
          service: instance,
          status: 'ok'
        }
      })

      hemera.add({
        topic: 'order',
        cmd: 'create'
      }, async function (req) {
        try {
          if (mongoose.connection.readyState !== 1) {
            throw new Error('Database connection is not ready')
          }

          const order = await Order.create({
            product: req.product,
            quantity: req.quantity,
            processedBy: instance
          })

          console.log(`Order handled by ${instance} | Order ID: ${order._id}`)

          return {
            success: true,
            processedBy: instance,
            order
          }

        } catch (err) {
          console.error(`[${instance}] Error processing order:`, err.message)
          throw err 
        }
      })

      console.log(`✨ ${instance} fully started.`)
    })

   
    const gracefulShutdown = async (signal) => {
      console.log(`\n[${instance}] Received ${signal}. Shutting down gracefully...`)
      try {
        if (hemera) await hemera.close()
        await mongoose.disconnect()
        console.log(`[${instance}] Clean shutdown complete. Goodbye!`)
        process.exit(0)
      } catch (err) {
        console.error('Error during shutdown:', err)
        process.exit(1)
      }
    }

    process.on('SIGINT', () => gracefulShutdown('SIGINT'))
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'))

  } catch (err) {
    console.error(`CRITICAL ERROR: ${instance} failed to start:`, err.message)
    setTimeout(startService, 5000)
  }
}

startService()