const assets = [
  { category: 'footwear', file: 'Adidas-Copa-Pure.avif' },
  { category: 'footwear', file: 'Adidas-F50-Hyperfast.webp' },
  { category: 'footwear', file: 'Adidas-Predator.jpg' },
  { category: 'footwear', file: 'Nike-Air-Zoom-Mercurial-Superfly.webp' },
  { category: 'footwear', file: 'Nike-Tiempo.webp' },
  { category: 'footwear', file: 'Puma-Future-9-Ultimate.jpg' },
  { category: 'footwear', file: 'Puma-Ultra-6-Ultimate.jpg' },

  { category: 'training', file: 'Clear-Passage-Nasal-Strips.jpg' },
  { category: 'training', file: 'Forza-Cohesive-Bandage.webp' },
  { category: 'training', file: 'Training-Cones.jpg' },
  { category: 'training', file: 'Training-Vest.jpg' },

  { category: 'equipment', file: 'Adidas-Copa-Pro-Gloves.webp' },
  { category: 'equipment', file: 'Adidas-Predator-Pro-Gloves.webp' },
  { category: 'equipment', file: 'Adidas-Tiro-Shin-Guards.jpg' },
  { category: 'equipment', file: 'Adidas-Trionda-Football.jpg' },
  { category: 'equipment', file: 'Nike-Mercurial-Shin-Guards.jpg' },
  { category: 'equipment', file: 'Puma-Future-Ultimate-Gloves.avif' },
  { category: 'equipment', file: 'Puma-Neymar-Jr-BNA-Shin-Guards.webp' },
  { category: 'equipment', file: 'Puma-Orbita-Football.webp' },
  { category: 'equipment', file: 'Puma-Stellar-Football.jpg' },
  { category: 'equipment', file: 'Puma-Ultra-Ultimate-Gloves.jpg' },
  { category: 'equipment', file: 'Reusch-Attrakt-Fusion-Gloves.jpg' },

  { category: 'apparel', file: 'Adidas-Germany-Shirt.jpg' },
  { category: 'apparel', file: 'Adidas-Japan_Shirt.avif' },
  { category: 'apparel', file: 'Adidas-Mexico-Shirt.jpg' },
  { category: 'apparel', file: 'High-Performance-Shorts.jpg' },
  { category: 'apparel', file: 'Lux-Grip-Socks.jpg' },
  { category: 'apparel', file: 'Marathon-Bolivia-Shirt.webp' },
  { category: 'apparel', file: 'Nike-Brazil-Shirt.jpg' },
  { category: 'apparel', file: 'Nike-England-Shirt.webp' },
  { category: 'apparel', file: 'Nike-France-Shirt.jpg' },
  { category: 'apparel', file: 'Puma-New-Zealand-Shirt.jpg' },
  { category: 'apparel', file: 'Puma-Portugal-Shirt.jpg' },
  { category: 'apparel', file: 'Udiyo-High-Performance-Tube-Socks.avif' },
]

const BASE_PRICE = {
  footwear: 210,
  equipment: 95,
  apparel: 75,
  training: 45,
}

function getBrand(file) {
  return file.split('-')[0]
}

function slugify(value) {
  return value
    .toLowerCase()
    .replace(/\.[^.]+$/, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function toSpanishName(file, category) {
  const raw = file.replace(/\.[^.]+$/, '').replace(/[_-]+/g, ' ').trim()
  const normalized = raw.toLowerCase()

  if (category === 'apparel' && normalized.includes('shirt')) return `Camiseta ${raw.replace(/shirt/gi, '').trim()}`
  if (category === 'apparel' && normalized.includes('socks')) return `Medias ${raw.replace(/socks?/gi, '').trim()}`
  if (category === 'apparel' && normalized.includes('shorts')) return `Short ${raw.replace(/shorts/gi, '').trim()}`
  if (category === 'equipment' && normalized.includes('gloves')) return `Guantes ${raw.replace(/gloves/gi, '').trim()}`
  if (category === 'equipment' && normalized.includes('shin guards')) return `Canilleras ${raw.replace(/shin guards/gi, '').trim()}`
  if (category === 'equipment' && normalized.includes('football')) return `Balon ${raw.replace(/football/gi, '').trim()}`
  if (category === 'training' && normalized.includes('cones')) return 'Conos de entrenamiento'
  if (category === 'training' && normalized.includes('vest')) return 'Chaleco de entrenamiento'
  if (category === 'training' && normalized.includes('nasal strips')) return 'Tiras nasales deportivas'
  if (category === 'training' && normalized.includes('bandage')) return 'Vendaje cohesivo deportivo'
  if (category === 'footwear') return `Botines ${raw}`

  return raw
}

function buildAttributes(category) {
  if (category === 'footwear') return { tallas: [39, 40, 41, 42, 43], tipo: 'fg', material: 'sintetico' }
  if (category === 'apparel') return { tallas: ['S', 'M', 'L', 'XL'], material: 'polyester' }
  if (category === 'equipment') return { uso: 'partido', nivel: 'pro' }
  return { uso: 'entrenamiento' }
}

const products = assets.map((asset, index) => {
  const name = toSpanishName(asset.file, asset.category)
  const brand = getBrand(asset.file)
  const price = Number((BASE_PRICE[asset.category] + (index % 7) * 8.5).toFixed(2))

  return {
    slug: `${asset.category}-${slugify(asset.file)}`,
    name,
    category: asset.category,
    price,
    image: `/products/${asset.category}/${asset.file}`,
    description: `${name} de la marca ${brand}.`,
    tags: [asset.category, brand.toLowerCase()],
    brand,
    attributes: buildAttributes(asset.category),
  }
})

module.exports = products