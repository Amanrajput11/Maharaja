// models/User.js
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  full_name: { type: String, required: true },
  email: { type: String, unique: true, sparse: true },
  password: { type: String, required: true },
  address: String,
  city: String,
  blood_group: String,
  mobile: { type: String, unique: true, required: true },
  firms: [
    {
      firm_mobile: { type: String, required: true },
      firm_name: String,
      address: String,
      city: String,
      email: String,
      is_owner: { type: Boolean, default: false },
      joined_date: Date
    }
  ]
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);