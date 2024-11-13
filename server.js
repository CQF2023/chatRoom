require('dotenv').config();
const http = require('http');
const multer = require('multer');
const express = require('express');
const session = require('express-session');
const mongoose = require('mongoose');
const WebSocket = require('ws');
const bodyParser = require('body-parser');
const authRouter = require('./routes/auth');
const path = require('path');
const app = express();
const server = http.createServer(app);  // 创建 HTTP 服务器
const wss = new WebSocket.Server({ server });  // 在 HTTP 服务器上创建 WebSocket 服务器
const upload = multer({ dest: 'uploads/' });  // 上传目录

// 头像上传接口
app.post('/upload-avatar', upload.single('avatar'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: '没有选择文件' });
  }

  // 假设文件上传成功，返回文件的 URL
  const avatarUrl = `/uploads/${req.file.filename}`;
  res.json({ avatar: avatarUrl });
});

// 静态文件服务，提供上传后的文件
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// 设置 session
app.use(session({
  secret: '133333',  // 设置一个随机密钥
  resave: false,              // 如果 session 没有更改，就不保存
  saveUninitialized: false    // 如果 session 没有被初始化，便不保存
}));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// 处理静态文件
app.use(express.static(path.join(__dirname, 'public')));

// MongoDB 连接
mongoose.connect('mongodb://localhost:27017/chatapp', { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('MongoDB Connected'))
  .catch(err => {
    console.error('MongoDB Connection Error:', err);
    process.exit(1);  // 如果数据库连接失败，退出进程
  });

// 聊天消息 Schema
const messageSchema = new mongoose.Schema({
  name: String,
  content: String,
  time: String,
});
const Message = mongoose.model('Message', messageSchema);

// WebSocket 连接
wss.on('connection', (ws) => {
  console.log('Client connected');
  ws.on('message', async (data) => {
    const messageData = JSON.parse(data);

    // 将消息保存到数据库
    const message = new Message({
      name: messageData.name,
      content: messageData.content,
      time: messageData.time,
    });
    await message.save();

    // 向所有连接的客户端广播消息
    wss.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(messageData));
      }
    });
  });

  ws.on('error', (error) => {
    console.error('WebSocket Error:', error);
  });
});

// 获取聊天记录
app.get('/chat-history', async (req, res) => {
  const messages = await Message.find().sort({ _id: 1 });  // 获取所有消息，按时间排序
  res.json(messages);
});

// 使用路由
app.use('/auth', authRouter);

// 默认路由，当用户访问根路径时，返回登录页面
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

// 启动服务器
server.listen(process.env.PORT || 3000, () => {
  console.log(`Server is running on port ${process.env.PORT || 3000}`);
});
