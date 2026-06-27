const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const axios = require('axios');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*' }
});

const PORT = 3001;
const JWT_SECRET = 'your-secret-key-change-in-production';

// 中间件
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../frontend')));

// 数据库初始化
const db = new sqlite3.Database(':memory:', (err) => {
  if (err) console.error('数据库连接失败:', err);
  else console.log('数据库连接成功（内存模式）');
});

db.serialize(() => {
  // 用户表
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    email TEXT UNIQUE,
    balance REAL DEFAULT 100000.00,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // 持仓表
  db.run(`CREATE TABLE IF NOT EXISTS holdings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    stock_code TEXT NOT NULL,
    stock_name TEXT NOT NULL,
    quantity INTEGER NOT NULL,
    avg_price REAL NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id)
  )`);

  // 交易记录表
  db.run(`CREATE TABLE IF NOT EXISTS transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    stock_code TEXT NOT NULL,
    stock_name TEXT NOT NULL,
    type TEXT NOT NULL,
    quantity INTEGER NOT NULL,
    price REAL NOT NULL,
    total_amount REAL NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
  )`);

  // 自选股表
  db.run(`CREATE TABLE IF NOT EXISTS watchlist (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    stock_code TEXT NOT NULL,
    stock_name TEXT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id)
  )`);
});

// 模拟股票数据（真实场景应接入API如东方财富、新浪财经等）
const stockData = {
  '600519': { name: '贵州茅台', price: 1856.00, change: 42.50, changePercent: 2.35, volume: 12345, amount: 22.89, marketCap: 2.34, pe: 32.5 },
  '300750': { name: '宁德时代', price: 198.50, change: -2.50, changePercent: -1.25, volume: 23456, amount: 46.78, marketCap: 0.89, pe: 28.3 },
  '601318': { name: '中国平安', price: 48.92, change: 0.43, changePercent: 0.88, volume: 56789, amount: 27.45, marketCap: 0.89, pe: 15.2 },
  '000001': { name: '上证指数', price: 3245.67, change: 23.45, changePercent: 0.73, volume: 0, amount: 0, marketCap: 0, pe: 0 },
  '399001': { name: '深证成指', price: 10892.34, change: -45.67, changePercent: -0.42, volume: 0, amount: 0, marketCap: 0, pe: 0 },
  '399006': { name: '创业板指', price: 2156.89, change: 12.34, changePercent: 0.58, volume: 0, amount: 0, marketCap: 0, pe: 0 }
};

// 实时更新股票价格（模拟）
function updateStockPrices() {
  Object.keys(stockData).forEach(code => {
    if (code.startsWith('6') || code.startsWith('3') || code.startsWith('0')) {
      const stock = stockData[code];
      const fluctuation = (Math.random() - 0.5) * 2; // -1% 到 +1%
      const oldPrice = stock.price;
      stock.price = parseFloat((stock.price * (1 + fluctuation / 100)).toFixed(2));
      stock.change = parseFloat((stock.price - (oldPrice - stock.change)).toFixed(2));
      stock.changePercent = parseFloat((stock.change / (stock.price - stock.change) * 100).toFixed(2));
      
      if (code !== '000001' && code !== '399001' && code !== '399006') {
        stock.volume = Math.floor(stock.volume * (0.9 + Math.random() * 0.2));
        stock.amount = parseFloat((stock.volume * stock.price / 100000000).toFixed(2));
      }
    }
  });
  
  // 广播更新
  io.emit('stockUpdate', stockData);
}

setInterval(updateStockPrices, 3000); // 每3秒更新一次

// 认证中间件
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) return res.status(401).json({ error: '未登录' });
  
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'token无效' });
    req.user = user;
    next();
  });
}

// 路由

// 注册
app.post('/api/register', (req, res) => {
  const { username, password, email } = req.body;
  
  if (!username || !password) {
    return res.status(400).json({ error: '用户名和密码必填' });
  }
  
  const hashedPassword = bcrypt.hashSync(password, 10);
  
  db.run('INSERT INTO users (username, password, email) VALUES (?, ?, ?)', 
    [username, hashedPassword, email], 
    function(err) {
      if (err) {
        if (err.message.includes('UNIQUE')) {
          return res.status(400).json({ error: '用户名已存在' });
        }
        return res.status(500).json({ error: '注册失败' });
      }
      
      const token = jwt.sign({ id: this.lastID, username }, JWT_SECRET, { expiresIn: '24h' });
      res.json({ message: '注册成功', token, userId: this.lastID });
    }
  );
});

// 登录
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  
  db.get('SELECT * FROM users WHERE username = ?', [username], (err, user) => {
    if (err) return res.status(500).json({ error: '登录失败' });
    if (!user) return res.status(400).json({ error: '用户不存在' });
    
    if (!bcrypt.compareSync(password, user.password)) {
      return res.status(400).json({ error: '密码错误' });
    }
    
    const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '24h' });
    res.json({ 
      message: '登录成功', 
      token, 
      user: { 
        id: user.id, 
        username: user.username, 
        email: user.email, 
        balance: user.balance 
      } 
    });
  });
});

// 获取用户信息
app.get('/api/user', authenticateToken, (req, res) => {
  db.get('SELECT id, username, email, balance FROM users WHERE id = ?', [req.user.id], (err, user) => {
    if (err) return res.status(500).json({ error: '查询失败' });
    res.json(user);
  });
});

// 获取所有股票数据
app.get('/api/stocks', (req, res) => {
  res.json(stockData);
});

// 获取特定股票数据
app.get('/api/stocks/:code', (req, res) => {
  const stock = stockData[req.params.code];
  if (!stock) return res.status(404).json({ error: '股票不存在' });
  res.json(stock);
});

// 获取自选股
app.get('/api/watchlist', authenticateToken, (req, res) => {
  db.all('SELECT * FROM watchlist WHERE user_id = ?', [req.user.id], (err, rows) => {
    if (err) return res.status(500).json({ error: '查询失败' });
    
    const watchlistWithData = rows.map(item => ({
      ...item,
      ...stockData[item.stock_code]
    }));
    
    res.json(watchlistWithData);
  });
});

// 添加自选股
app.post('/api/watchlist', authenticateToken, (req, res) => {
  const { stockCode, stockName } = req.body;
  
  db.run('INSERT INTO watchlist (user_id, stock_code, stock_name) VALUES (?, ?, ?)',
    [req.user.id, stockCode, stockName],
    function(err) {
      if (err) return res.status(500).json({ error: '添加失败' });
      res.json({ message: '添加成功', id: this.lastID });
    }
  );
});

// 删除自选股
app.delete('/api/watchlist/:code', authenticateToken, (req, res) => {
  db.run('DELETE FROM watchlist WHERE user_id = ? AND stock_code = ?',
    [req.user.id, req.params.code],
    function(err) {
      if (err) return res.status(500).json({ error: '删除失败' });
      res.json({ message: '删除成功' });
    }
  );
});

// 获取持仓
app.get('/api/holdings', authenticateToken, (req, res) => {
  db.all('SELECT * FROM holdings WHERE user_id = ?', [req.user.id], (err, rows) => {
    if (err) return res.status(500).json({ error: '查询失败' });
    
    const holdingsWithData = rows.map(item => ({
      ...item,
      currentPrice: stockData[item.stock_code]?.price || 0,
      profit: (stockData[item.stock_code]?.price || 0) * item.quantity - item.avg_price * item.quantity
    }));
    
    res.json(holdingsWithData);
  });
});

// 买入股票
app.post('/api/trade/buy', authenticateToken, (req, res) => {
  const { stockCode, stockName, quantity, price } = req.body;
  const totalAmount = quantity * price;
  
  db.get('SELECT balance FROM users WHERE id = ?', [req.user.id], (err, user) => {
    if (err) return res.status(500).json({ error: '查询失败' });
    
    if (user.balance < totalAmount) {
      return res.status(400).json({ error: '余额不足' });
    }
    
    db.serialize(() => {
      db.run('UPDATE users SET balance = balance - ? WHERE id = ?', [totalAmount, req.user.id]);
      
      db.get('SELECT * FROM holdings WHERE user_id = ? AND stock_code = ?', 
        [req.user.id, stockCode], 
        (err, holding) => {
          if (holding) {
            const newAvgPrice = (holding.avg_price * holding.quantity + price * quantity) / (holding.quantity + quantity);
            db.run('UPDATE holdings SET quantity = quantity + ?, avg_price = ? WHERE id = ?',
              [quantity, newAvgPrice, holding.id]);
          } else {
            db.run('INSERT INTO holdings (user_id, stock_code, stock_name, quantity, avg_price) VALUES (?, ?, ?, ?, ?)',
              [req.user.id, stockCode, stockName, quantity, price]);
          }
          
          db.run('INSERT INTO transactions (user_id, stock_code, stock_name, type, quantity, price, total_amount) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [req.user.id, stockCode, stockName, 'buy', quantity, price, totalAmount]);
          
          res.json({ message: '买入成功', balance: user.balance - totalAmount });
        }
      );
    });
  });
});

// 卖出股票
app.post('/api/trade/sell', authenticateToken, (req, res) => {
  const { stockCode, stockName, quantity, price } = req.body;
  const totalAmount = quantity * price;
  
  db.get('SELECT * FROM holdings WHERE user_id = ? AND stock_code = ?', 
    [req.user.id, stockCode], 
    (err, holding) => {
      if (err) return res.status(500).json({ error: '查询失败' });
      
      if (!holding || holding.quantity < quantity) {
        return res.status(400).json({ error: '持仓不足' });
      }
      
      db.serialize(() => {
        db.run('UPDATE users SET balance = balance + ? WHERE id = ?', [totalAmount, req.user.id]);
        
        if (holding.quantity === quantity) {
          db.run('DELETE FROM holdings WHERE id = ?', [holding.id]);
        } else {
          db.run('UPDATE holdings SET quantity = quantity - ? WHERE id = ?', [quantity, holding.id]);
        }
        
        db.run('INSERT INTO transactions (user_id, stock_code, stock_name, type, quantity, price, total_amount) VALUES (?, ?, ?, ?, ?, ?, ?)',
          [req.user.id, stockCode, stockName, 'sell', quantity, price, totalAmount]);
        
        db.get('SELECT balance FROM users WHERE id = ?', [req.user.id], (err, user) => {
          res.json({ message: '卖出成功', balance: user.balance });
        });
      });
    }
  );
});

// 获取交易记录
app.get('/api/transactions', authenticateToken, (req, res) => {
  db.all('SELECT * FROM transactions WHERE user_id = ? ORDER BY created_at DESC LIMIT 100', 
    [req.user.id], 
    (err, rows) => {
      if (err) return res.status(500).json({ error: '查询失败' });
      res.json(rows);
    }
  );
});

// WebSocket连接
io.on('connection', (socket) => {
  console.log('用户连接:', socket.id);
  
  socket.emit('stockUpdate', stockData);
  
  socket.on('disconnect', () => {
    console.log('用户断开:', socket.id);
  });
});

// 启动服务器
server.listen(PORT, () => {
  console.log(`服务器运行在 http://localhost:${PORT}`);
  console.log('实时股票数据更新已启动（每3秒）');
});
