// models/User.js
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const UserSchema = new Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  mobile: { type: String, unique: true, sparse: true },
  password: { type: String, required: true },
  profileImage: { type: String }, 
  firms: [{ type: Schema.Types.ObjectId, ref: 'Firm' }], 
  createdAt: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('User', UserSchema);