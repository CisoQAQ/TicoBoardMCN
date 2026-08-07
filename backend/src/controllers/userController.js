const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// 注册用户
const registerUser = async (req, res) => {
  try {
    const { username, email, password, bio, avatar, role } = req.body;

    // 检查用户是否已存在
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: '用户已存在' });
    }

    // 创建新用户（包含新增字段）
    const user = await User.create({
      username,
      email,
      password,
      bio, // 新增：个人简介
      avatar, // 新增：头像
      role, // 新增：用户角色
    });

    // 生成 token
    const token = generateToken(user._id);

    res.status(201).json({
      code: 200,
      success: true,
      message: '用户注册成功',
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// 更新用户信息（新增）
const updateUser = async (req, res) => {
  try {
    const userId = req.user._id;
    const updates = req.body;

    // 过滤不允许更新的字段
    const allowedUpdates = ['username', 'email', 'password', 'bio', 'avatar', 'role'];
    const isValidOperation = Object.keys(updates).every(update => allowedUpdates.includes(update));

    if (!isValidOperation) {
      return res.status(400).json({ message: '不允许更新的字段' });
    }

    // 更新用户信息
    const user = await User.findByIdAndUpdate(userId, updates, {
      new: true,
      runValidators: true,
    }).select('-password');

    if (!user) {
      return res.status(404).json({ message: '用户不存在' });
    }

    res.json(user);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const loginUser = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: '请提供用户名和密码' });
    }

    // 查找用户（确保返回password字段）
    const user = await User.findOne({ username });

    if (!user) {
      return res.status(401).json({ message: '用户名或密码不正确' });
    }

    // 检查user.password是否存在
    if (!user.password) {
      return res.status(401).json({ message: '用户名或密码不正确' });
    }

    // 验证密码（参数顺序正确）
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: '邮箱或密码不正确' });
    }

    // 登录成功
    res.json({
      code: 200,
      success: true,
      message: '用户登录成功',
      data: {
        user: {
          _id: user._id,
          username: user.username,
          email: user.email,
          bio: user.bio, // 返回新增字段
          avatar: user.avatar, // 返回新增字段
          role: user.role, // 返回新增字段
        },
        token: generateToken(user._id),
      },
    });
  } catch (error) {
    console.error('登录错误:', error.message);
    res.status(500).json({ message: '服务器错误' });
  }
};

// 生成 JWT Token
const generateToken = id => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d',
  });
};

module.exports = {
  registerUser,
  loginUser,
  updateUser,
  generateToken,
};
