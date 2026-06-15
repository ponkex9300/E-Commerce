const mongoose = require('mongoose')

const productSchema = new mongoose.Schema(
  {
    slug: {
      type: String,
      index: true,
      unique: true,
      sparse: true,
      trim: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      required: true,
      index: true,
      trim: true,
    },
    price: {
      type: Number,
      required: true,
    },
    image: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      default: '',
    },
    currency: {
      type: String,
      default: 'BOB',
    },
    // Flexible attributes to support dynamic category-specific fields
    attributes: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    // Common arrays for tags, variants, brands, etc.
    tags: {
      type: [String],
      default: [],
      index: true,
    },
    variants: {
      type: [mongoose.Schema.Types.Mixed],
      default: [],
    },
    brand: {
      type: String,
      index: true,
    },
    industry: {
      type: String,
      index: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
    toJSON: {
      virtuals: true,
      transform: (_doc, ret) => {
        ret.id = ret._id.toString()
        delete ret._id
      },
    },
  },
)

module.exports = mongoose.model('Product', productSchema)