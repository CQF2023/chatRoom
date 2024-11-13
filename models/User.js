const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  avatar: { type: String, default: null },  // 用户头像，可以存储URL
  name: { type: String, default: function() { return this.email.slice(0, 2); } },  // 默认显示邮箱的前两位
  isVerified: { type: Boolean, default: false },
});

module.exports = mongoose.model('User', userSchema);
