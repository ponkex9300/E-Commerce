const { pool } = require('../config/pg')
const Cart = require('../models/Cart')
const Preference = require('../models/Preference')

function deriveNameFromEmail(email) {
  return String(email || '')
    .split('@')[0]
    .replace(/[._-]+/g, ' ')
    .trim()
}

async function getCustomerById(id) {
  const { rows } = await pool.query(
    'SELECT id, name, email, encrypted_card, last_login_at, login_count, created_at FROM customers WHERE id = $1',
    [id],
  )

  return rows[0] || null
}

async function loginCustomerByEmail({ email, name }) {
  const normalizedEmail = String(email || '').trim().toLowerCase()
  if (!normalizedEmail) {
    const error = new Error('Email is required')
    error.statusCode = 400
    throw error
  }

  const existing = await pool.query(
    'SELECT id, name, email, encrypted_card, last_login_at, login_count, created_at FROM customers WHERE email = $1',
    [normalizedEmail],
  )

  if (existing.rows.length > 0) {
    const customer = existing.rows[0]
    const { rows } = await pool.query(
      `UPDATE customers
         SET last_login_at = now(),
             login_count = COALESCE(login_count, 0) + 1,
             name = COALESCE(name, $2)
       WHERE id = $1
       RETURNING id, name, email, encrypted_card, last_login_at, login_count, created_at`,
      [customer.id, name || deriveNameFromEmail(normalizedEmail)],
    )

    return { customer: rows[0], created: false }
  }

  const id = require('uuid').v4()
  const finalName = name || deriveNameFromEmail(normalizedEmail)
  const { rows } = await pool.query(
    `INSERT INTO customers(id, name, email, encrypted_card, last_login_at, login_count)
     VALUES($1, $2, $3, $4, now(), 1)
     RETURNING id, name, email, encrypted_card, last_login_at, login_count, created_at`,
    [id, finalName, normalizedEmail, ''],
  )

  return { customer: rows[0], created: true }
}

async function getCustomerOrders(customerId) {
  const { rows: orders } = await pool.query(
    `SELECT o.id, o.customer_id, o.total, o.subtotal, o.item_count, o.status, o.created_at
     FROM orders o
     WHERE o.customer_id = $1
     ORDER BY o.created_at DESC`,
    [customerId],
  )

  if (orders.length === 0) {
    return []
  }

  const orderIds = orders.map((order) => order.id)
  const { rows: items } = await pool.query(
    `SELECT order_id, product_id, quantity, price, product_name, product_brand, product_image, product_slug
     FROM order_items
     WHERE order_id = ANY($1::uuid[])`,
    [orderIds],
  )

  const itemsByOrder = new Map()
  for (const item of items) {
    const current = itemsByOrder.get(item.order_id) || []
    current.push(item)
    itemsByOrder.set(item.order_id, current)
  }

  return orders.map((order) => ({
    ...order,
    items: itemsByOrder.get(order.id) || [],
  }))
}

async function getCustomerFullProfile(customerId) {
  const customer = await getCustomerById(customerId)
  if (!customer) {
    return null
  }

  const [cart, preferences, orders] = await Promise.all([
    Cart.findOne({ customerId }),
    Preference.findOne({ customerId }),
    getCustomerOrders(customerId),
  ])

  return {
    customer,
    cart: cart || null,
    preferences: preferences || null,
    orders,
  }
}

module.exports = {
  deriveNameFromEmail,
  getCustomerById,
  getCustomerFullProfile,
  getCustomerOrders,
  loginCustomerByEmail,
}