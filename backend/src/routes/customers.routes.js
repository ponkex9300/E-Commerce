const express = require('express')
const { pool } = require('../config/pg')
const cryptoUtil = require('../utils/crypto')
const { v4: uuidv4 } = require('uuid')
const { getCustomerById, getCustomerFullProfile } = require('../services/customerService')

const router = express.Router()

router.post('/', async (req, res, next) => {
  const { name, email, card } = req.body
  try {
    const id = uuidv4()
    const encryptedCard = cryptoUtil.encrypt(card || '')
    await pool.query(
      'INSERT INTO customers(id, name, email, encrypted_card) VALUES($1,$2,$3,$4)',
      [id, name || null, email || null, encryptedCard],
    )
    return res.status(201).json({ id })
  } catch (error) {
    return next(error)
  }
})

router.get('/:id', async (req, res, next) => {
  const { id } = req.params
  try {
    const customer = await getCustomerById(id)
    if (!customer) return res.status(404).json({ message: 'Customer not found' })
    // Do not return decrypted card by default
    delete customer.encrypted_card
    return res.json(customer)
  } catch (error) {
    return next(error)
  }
})

// Combined view: Postgres customer + Mongo cart + preferences
router.get('/:id/full', async (req, res, next) => {
  const { id } = req.params
  try {
    const profile = await getCustomerFullProfile(id)
    if (!profile) return res.status(404).json({ message: 'Customer not found' })
    return res.json(profile)
  } catch (error) {
    return next(error)
  }
})

module.exports = router
