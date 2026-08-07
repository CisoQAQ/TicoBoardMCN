// src/models/User.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  // 基础信息
  username: {
    type: String,
    required: [true, '请输入用户名'],
    unique: true,
    minlength: 3,
    maxlength: 20,
    trim: true,
  },
  email: {
    type: String,
    required: [true, '请输入邮箱'],
    unique: true,
    lowercase: true,
    match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, '请输入有效的邮箱地址'],
  },
  password: {
    type: String,
    required: [true, '请设置密码'],
    minlength: 6,
    select: true,
  },

  // 博客作者信息
  bio: {
    type: String,
    maxlength: 200,
    default: '这个人很懒，还没有设置个人简介',
  },
  avatar: {
    type: String,
    default: 'default-avatar.jpg',
  },

  // 用户角色与权限
  role: {
    type: String,
    enum: ['user', 'author', 'admin'],
    default: 'user',
  },
});

// 密码加密
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// 自动更新 updatedAt 字段
userSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('User', userSchema);
