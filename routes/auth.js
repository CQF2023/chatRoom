const express = require('express');
const session = require('express-session');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const path = require('path');


const app = express();

app.use(session({
    secret: 'your-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false }
  }));

  const router = express.Router();

// 渲染注册页面（GET 请求）
router.get('/register', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/register.html'));  // 假设注册页面放在 public 文件夹中
  });
  

// 注册用户
router.post('/register', async (req, res) => {
  const { email, password } = req.body;

  if (password.length < 4) {
    return res.status(400).json({ message: '密码至少需要 4 位' });
  }

  try {
    // 检查邮箱是否已注册
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: '该邮箱已被注册' });
    }

    // 对密码进行加密
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = new User({
      email,
      password: hashedPassword,
    });

    await user.save();

    res.status(200).json({ message: '注册成功' });
  } catch (error) {
    console.error('注册失败:', error);
    res.status(500).json({ message: '注册失败，请稍后再试' });
  }
});

// 登录用户
router.post('/login', async (req, res) => {
    const { email, password } = req.body;
  
    try {
      const user = await User.findOne({ email });
      if (!user) {
        return res.status(400).json({ message: '该邮箱未注册' });
      }
  
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(400).json({ message: '密码错误' });
      }

     // 将用户信息存入 session
    req.session.user = {
        email: user.email,
        name: user.name,
        avatar: user.avatar || null
      };
  
      // 登录成功后返回头像和名字等信息
      // res.status(200).json({ message: '登录成功' });
      res.status(200).json({ message: '登录成功', user: req.session.user });

    } catch (error) {
      console.error('登录失败:', error);
      res.status(500).json({ message: '登录失败，请稍后再试' });
    }
  });


// 假设你使用 session 来保存登录的用户信息
router.get('/profile', (req, res) => {
    // 如果 session 中没有用户信息，则返回未登录状态
    if (!req.session.user) {
      return res.status(401).json({ message: '未登录' });
    }
  
    // 发送个人主页的 HTML 文件
    res.sendFile(path.join(__dirname, '..', 'public', 'profile.html')); // 确保路径正确
  });

  
// 假设你使用 session 来保存登录的用户信息
router.get('/chatroom', (req, res) => {
    // 如果 session 中没有用户信息，则返回未登录状态
    if (!req.session.user) {
      return res.status(401).json({ message: '未登录' });
    }
  
    // 发送个人主页的 HTML 文件
    res.sendFile(path.join(__dirname, '..', 'public', 'chatroom.html')); // 确保路径正确
  });
  

module.exports = router;
