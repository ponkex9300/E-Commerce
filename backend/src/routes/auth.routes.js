const express = require('express')
const { getCustomerFullProfile, loginCustomerByEmail } = require('../services/customerService')

const router = express.Router()

router.post('/login', async (req, res, next) => {
  const { email, name } = req.body
  try {
    const result = await loginCustomerByEmail({ email, name })
    const profile = await getCustomerFullProfile(result.customer.id)

    return res.status(result.created ? 201 : 200).json({
      created: result.created,
      ...profile,
    })
  } catch (error) {
    return next(error)
  }
})

module.exports = router