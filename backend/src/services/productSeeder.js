const Product = require('../models/Product')
const seedProducts = require('../data/products')

async function seedProductsInDatabase() {
  await Product.deleteMany({})
  await Product.insertMany(seedProducts)
}

module.exports = seedProductsInDatabase