const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ProductSchema = new Schema({
  name: { type: String, required: true },
  sku: { type: String },
  price: { type: Number, default: 0 },
  description: { type: String },
  images: [String]
}, { timestamps: true });

const FirmSchema = new Schema({
  name: { type: String, required: true },
  address: { type: String },
  gst: { type: String },
  partners: [{ type: Schema.Types.ObjectId, ref: 'User' }], 
  products: [ProductSchema],
  categories: [{ type: String }],
  meta: { type: Schema.Types.Mixed }
}, { timestamps: true, versionKey: '__v' }); 

module.exports = mongoose.model('Firm', FirmSchema);