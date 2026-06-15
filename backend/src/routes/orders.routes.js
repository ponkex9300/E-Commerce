const express = require('express')
const { pool } = require('../config/pg')
const Cart = require('../models/Cart')
const Product = require('../models/Product')
const { getCustomerById, getCustomerOrders } = require('../services/customerService')

const router = express.Router()

router.get('/:customerId', async (req, res, next) => {
  const { customerId } = req.params
  try {
    const customer = await getCustomerById(customerId)
    if (!customer) return res.status(404).json({ message: 'Customer not found' })

    const orders = await getCustomerOrders(customerId)
    return res.json({ customerId, orders })
  } catch (error) {
    return next(error)
  }
})

router.post('/checkout', async (req, res, next) => {
  const { customerId, items: requestedItems } = req.body

  try {
    if (!customerId) {
      return res.status(400).json({ message: 'customerId is required' })
    }

    const customer = await getCustomerById(customerId)
    if (!customer) return res.status(404).json({ message: 'Customer not found' })

    const sourceItems = Array.isArray(requestedItems) && requestedItems.length > 0
      ? requestedItems
      : (await Cart.findOne({ customerId }))?.items || []

    if (sourceItems.length === 0) {
      return res.status(400).json({ message: 'Cart is empty' })
    }

    const productIds = sourceItems.map((item) => item.productId)
    const products = await Product.find({ _id: { $in: productIds } })
    const productMap = new Map(products.map((product) => [product._id.toString(), product]))

    const orderLines = []
    let subtotal = 0

    for (const item of sourceItems) {
      const product = productMap.get(String(item.productId))
      if (!product) {
        return res.status(404).json({ message: `Product not found: ${item.productId}` })
      }

      const quantity = Math.max(1, Number(item.quantity) || 1)
      if (Number(product.stock || 0) < quantity) {
        return res.status(409).json({
          message: `Stock insuficiente para ${product.name}`,
          productId: product._id.toString(),
          available: Number(product.stock || 0),
        })
      }

      const lineTotal = Number(product.price) * quantity
      subtotal += lineTotal
      orderLines.push({
        productId: product._id.toString(),
        quantity,
        price: Number(product.price),
        productName: product.name,
        productBrand: product.brand || '',
        productImage: product.image,
        productSlug: product.slug || '',
      })
    }

    const client = await pool.connect()
    let orderRow
    try {
      await client.query('BEGIN')
      const orderResult = await client.query(
        `INSERT INTO orders (customer_id, total, subtotal, item_count, status)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id, customer_id, total, subtotal, item_count, status, created_at`,
        [customerId, subtotal, subtotal, orderLines.length, 'completed'],
      )
      orderRow = orderResult.rows[0]

      for (const line of orderLines) {
        await client.query(
          `INSERT INTO order_items
           (order_id, product_id, quantity, price, product_name, product_brand, product_image, product_slug)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
          [
            orderRow.id,
            line.productId,
            line.quantity,
            line.price,
            line.productName,
            line.productBrand,
            line.productImage,
            line.productSlug,
          ],
        )
      }

      await client.query('COMMIT')
    } catch (error) {
      await client.query('ROLLBACK')
      throw error
    } finally {
      client.release()
    }

    await Promise.all(
      orderLines.map((line) =>
        Product.updateOne({ _id: line.productId }, { $inc: { stock: -line.quantity } }),
      ),
    )

    await Cart.findOneAndUpdate(
      { customerId },
      { $set: { items: [] } },
      { upsert: true, new: true },
    )

    const refreshedOrders = await getCustomerOrders(customerId)

    return res.status(201).json({
      message: 'Order created successfully',
      order: {
        ...orderRow,
        items: orderLines,
      },
      orders: refreshedOrders,
    })
  } catch (error) {
    return next(error)
  }
})

module.exports = router