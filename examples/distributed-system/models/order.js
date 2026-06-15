const mongoose = require('mongoose')

const OrderSchema = new mongoose.Schema({

  product: {
    type: String,
    required: true
  },

  quantity: {
    type: Number,
    required: true
  },

  processedBy: {
    type: String,
    required: true
  },

  createdAt: {
    type: Date,
    default: Date.now
  }

})

module.exports = mongoose.model('Order', OrderSchema)
