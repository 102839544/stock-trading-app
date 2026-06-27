// 全局变量
let currentUser = null;
let authToken = null;
let stockData = {};
let currentStockCode = null;
let priceHistory = [];
let socket = null;

// 页面加载时初始化
document.addEventListener('DOMContentLoaded', () => {
  // 检查本地存储的token
  const savedToken = localStorage.getItem('authToken');
  if (savedToken) {
    authToken = savedToken;
    verifyToken();
  } else {
    showAuthModal('login');
  }

  // 初始化WebSocket连接
  initWebSocket();

  // 绑定表单提交事件
  document.getElementById('loginForm').addEventListener('submit', handleLogin);
  document.getElementById('registerForm').addEventListener('submit', handleRegister);
});

// 验证token
async function verifyToken() {
  try {
    const response = await fetch('http://localhost:3000/api/user', {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });

    if (response.ok) {
      currentUser = await response.json();
      showApp();
    } else {
      localStorage.removeItem('authToken');
      showAuthModal('login');
    }
  } catch (error) {
    console.error('Token验证失败:', error);
    showAuthModal('login');
  }
}

// 显示认证弹窗
function showAuthModal(type) {
  document.getElementById('authModal').classList.add('active');
  if (type === 'register') {
    switchAuthTab('register');
  }
}

// 关闭认证弹窗
function closeAuthModal() {
  document.getElementById('authModal').classList.remove('active');
}

// 切换认证标签页
function switchAuthTab(tab) {
  const loginForm = document.getElementById('loginForm');
  const registerForm = document.getElementById('registerForm');
  const tabBtns = document.querySelectorAll('.tab-btn');

  if (tab === 'login') {
    loginForm.style.display = 'block';
    registerForm.style.display = 'none';
    tabBtns[0].classList.add('active');
    tabBtns[1].classList.remove('active');
    document.getElementById('authTitle').textContent = '登录';
  } else {
    loginForm.style.display = 'none';
    registerForm.style.display = 'block';
    tabBtns[0].classList.remove('active');
    tabBtns[1].classList.add('active');
    document.getElementById('authTitle').textContent = '注册';
  }
}

// 处理登录
async function handleLogin(e) {
  e.preventDefault();
  
  const username = document.getElementById('loginUsername').value;
  const password = document.getElementById('loginPassword').value;

  try {
    const response = await fetch('http://localhost:3000/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });

    const data = await response.json();

    if (response.ok) {
      authToken = data.token;
      currentUser = data.user;
      localStorage.setItem('authToken', authToken);
      closeAuthModal();
      showApp();
    } else {
      alert(data.error);
    }
  } catch (error) {
    alert('登录失败，请检查网络连接');
  }
}

// 处理注册
async function handleRegister(e) {
  e.preventDefault();

  const username = document.getElementById('registerUsername').value;
  const email = document.getElementById('registerEmail').value;
  const password = document.getElementById('registerPassword').value;

  try {
    const response = await fetch('http://localhost:3000/api/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, email, password })
    });

    const data = await response.json();

    if (response.ok) {
      alert('注册成功，请登录');
      switchAuthTab('login');
    } else {
      alert(data.error);
    }
  } catch (error) {
    alert('注册失败，请检查网络连接');
  }
}

// 显示主应用
function showApp() {
  document.getElementById('authModal').classList.remove('active');
  document.getElementById('app').style.display = 'block';
  document.getElementById('usernameDisplay').textContent = currentUser.username;
  document.getElementById('userAvatar').textContent = currentUser.username.charAt(0).toUpperCase();
  
  loadStockData();
  loadUserData();
  switchPage('market');
}

// 初始化WebSocket
function initWebSocket() {
  socket = io('http://localhost:3001');

  socket.on('connect', () => {
    console.log('WebSocket连接成功');
  });

  socket.on('stockUpdate', (data) => {
    stockData = data;
    updateStockDisplay();
  });

  socket.on('disconnect', () => {
    console.log('WebSocket断开连接');
  });
}

// 加载股票数据
async function loadStockData() {
  try {
    const response = await fetch('http://localhost:3000/api/stocks');
    stockData = await response.json();
    updateStockDisplay();
    populateStockList();
  } catch (error) {
    console.error('加载股票数据失败:', error);
  }
}

// 更新股票显示
function updateStockDisplay() {
  // 更新指数卡片
  ['000001', '399001', '399006'].forEach(code => {
    const stock = stockData[code];
    if (!stock) return;

    const card = document.getElementById(`index${code}`);
    if (!card) return;

    const priceEl = card.querySelector('.index-price');
    const changeValueEl = card.querySelector('.change-value');
    const changePercentEl = card.querySelector('.change-percent');

    priceEl.textContent = stock.price.toFixed(2);
    changeValueEl.textContent = (stock.change >= 0 ? '+' : '') + stock.change.toFixed(2);
    changePercentEl.textContent = (stock.changePercent >= 0 ? '+' : '') + stock.changePercent.toFixed(2) + '%';

    // 设置颜色
    if (stock.change >= 0) {
      priceEl.className = 'index-price up';
      changeValueEl.className = 'change-value up';
      changePercentEl.className = 'change-percent up';
    } else {
      priceEl.className = 'index-price down';
      changeValueEl.className = 'change-value down';
      changePercentEl.className = 'change-percent down';
    }
  });

  // 更新股票列表
  updateStockList();
}

// 填充股票列表
function populateStockList() {
  const stockListEl = document.getElementById('stockList');
  const stocks = Object.entries(stockData).filter(([code]) => 
    !code.startsWith('000') && !code.startsWith('399')
  );

  stockListEl.innerHTML = stocks.map(([code, stock]) => `
    <div class="stock-row" onclick="showStockDetail('${code}')">
      <div class="stock-info">
        <span class="stock-name">${stock.name}</span>
        <span class="stock-code">${code}</span>
      </div>
      <div class="stock-price ${stock.change >= 0 ? 'up' : 'down'}">${stock.price.toFixed(2)}</div>
      <div class="stock-change ${stock.change >= 0 ? 'up' : 'down'}">${(stock.changePercent >= 0 ? '+' : '') + stock.changePercent.toFixed(2)}%</div>
      <div class="stock-action">
        <button onclick="event.stopPropagation(); showTradeModal('buy', '${code}')">交易</button>
      </div>
    </div>
  `).join('');
}

// 更新股票列表
function updateStockList() {
  const stocks = Object.entries(stockData).filter(([code]) => 
    !code.startsWith('000') && !code.startsWith('399')
  );

  stocks.forEach(([code, stock]) => {
    const row = document.querySelector(`[onclick="showStockDetail('${code}')"]`);
    if (row) {
      const priceEl = row.querySelector('.stock-price');
      const changeEl = row.querySelector('.stock-change');
      
      priceEl.textContent = stock.price.toFixed(2);
      changeEl.textContent = (stock.changePercent >= 0 ? '+' : '') + stock.changePercent.toFixed(2) + '%';
      
      priceEl.className = `stock-price ${stock.change >= 0 ? 'up' : 'down'}`;
      changeEl.className = `stock-change ${stock.change >= 0 ? 'up' : 'down'}`;
    }
  });
}

// 显示股票详情
function showStockDetail(code) {
  const stock = stockData[code];
  if (!stock) return;

  currentStockCode = code;

  // 更新详情页信息
  document.getElementById('detailStockName').textContent = stock.name;
  document.getElementById('detailStockCode').textContent = code;
  document.getElementById('detailPrice').textContent = stock.price.toFixed(2);
  document.getElementById('detailChange').textContent = (stock.change >= 0 ? '+' : '') + stock.change.toFixed(2);
  document.getElementById('detailChangePercent').textContent = (stock.changePercent >= 0 ? '+' : '') + stock.changePercent.toFixed(2) + '%';
  document.getElementById('detailVolume').textContent = stock.volume ? stock.volume.toLocaleString() + '手' : '--';
  document.getElementById('detailAmount').textContent = stock.amount ? stock.amount.toFixed(2) + '亿' : '--';
  document.getElementById('detailMarketCap').textContent = stock.marketCap ? stock.marketCap.toFixed(2) + '万亿' : '--';
  document.getElementById('detailPE').textContent = stock.pe ? stock.pe.toFixed(1) : '--';

  // 设置颜色
  const priceEl = document.getElementById('detailPrice');
  const changeEl = document.getElementById('detailChange');
  const changePercentEl = document.getElementById('detailChangePercent');
  
  if (stock.change >= 0) {
    priceEl.className = 'price-large up';
    changeEl.className = 'change-value up';
    changePercentEl.className = 'change-percent up';
  } else {
    priceEl.className = 'price-large down';
    changeEl.className = 'change-value down';
    changePercentEl.className = 'change-percent down';
  }

  // 切换到详情页
  switchPage('stockDetail');

  // 绘制图表
  drawPriceChart(code);
}

// 绘制价格图表
function drawPriceChart(code) {
  const canvas = document.getElementById('priceChart');
  const ctx = canvas.getContext('2d');
  
  // 生成模拟价格历史数据
  if (priceHistory.length === 0) {
    let price = stockData[code].price;
    for (let i = 0; i < 50; i++) {
      price += (Math.random() - 0.5) * 20;
      priceHistory.push(price);
    }
  } else {
    priceHistory.shift();
    priceHistory.push(stockData[code].price);
  }

  // 清空画布
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // 绘制网格
  ctx.strokeStyle = '#EAEAEA';
  ctx.lineWidth = 0.5;
  for (let i = 0; i < 5; i++) {
    const y = (i + 1) * 80;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(canvas.width, y);
    ctx.stroke();
  }

  // 绘制价格线
  const minPrice = Math.min(...priceHistory);
  const maxPrice = Math.max(...priceHistory);
  const padding = 40;
  const chartWidth = canvas.width - 2 * padding;
  const chartHeight = canvas.height - 2 * padding;

  ctx.beginPath();
  ctx.strokeStyle = stockData[code].change >= 0 ? '#F5222D' : '#52C41A';
  ctx.lineWidth = 2;

  priceHistory.forEach((price, index) => {
    const x = padding + (index / (priceHistory.length - 1)) * chartWidth;
    const y = padding + (1 - (price - minPrice) / (maxPrice - minPrice)) * chartHeight;
    
    if (index === 0) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }
  });

  ctx.stroke();

  // 填充区域
  const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
  gradient.addColorStop(0, stockData[code].change >= 0 ? 'rgba(245, 34, 45, 0.1)' : 'rgba(82, 196, 26, 0.1)');
  gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');

  ctx.lineTo(padding + chartWidth, canvas.height - padding);
  ctx.lineTo(padding, canvas.height - padding);
  ctx.closePath();
  ctx.fillStyle = gradient;
  ctx.fill();
}

// 切换页面
function switchPage(page) {
  // 隐藏所有页面
  document.querySelectorAll('.page').forEach(p => p.style.display = 'none');
  
  // 更新导航状态
  document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
  
  // 显示目标页面
  switch(page) {
    case 'market':
      document.getElementById('marketPage').style.display = 'block';
      document.querySelectorAll('.nav-item')[0].classList.add('active');
      break;
    case 'watchlist':
      document.getElementById('marketPage').style.display = 'block'; // 简化：显示市场页面
      document.querySelectorAll('.nav-item')[1].classList.add('active');
      loadWatchlist();
      break;
    case 'trade':
      document.getElementById('marketPage').style.display = 'block';
      document.querySelectorAll('.nav-item')[2].classList.add('active');
      break;
    case 'holdings':
      document.getElementById('holdingsPage').style.display = 'block';
      document.querySelectorAll('.nav-item')[3].classList.add('active');
      loadHoldings();
      break;
    case 'stockDetail':
      document.getElementById('stockDetailPage').style.display = 'block';
      break;
  }
}

// 显示交易弹窗
function showTradeModal(type, code) {
  if (!currentUser) {
    alert('请先登录');
    return;
  }

  const stockCode = code || currentStockCode;
  const stock = stockData[stockCode];
  if (!stock) return;

  document.getElementById('tradeModalTitle').textContent = type === 'buy' ? '买入股票' : '卖出股票';
  document.getElementById('tradeStockCode').value = stockCode;
  document.getElementById('tradeStockName').value = stock.name;
  document.getElementById('tradePrice').value = stock.price.toFixed(2);
  document.getElementById('tradeQuantity').value = 1;
  document.getElementById('tradeSubmitBtn').textContent = type === 'buy' ? '确认买入' : '确认卖出';
  document.getElementById('tradeSubmitBtn').onclick = () => submitTrade(type);

  calculateTotal();
  loadUserBalance();

  document.getElementById('tradeModal').classList.add('active');
}

// 关闭交易弹窗
function closeTradeModal() {
  document.getElementById('tradeModal').classList.remove('active');
}

// 计算总金额
function calculateTotal() {
  const price = parseFloat(document.getElementById('tradePrice').value);
  const quantity = parseInt(document.getElementById('tradeQuantity').value) || 0;
  const total = price * quantity * 100; // 1手 = 100股
  
  document.getElementById('tradeTotal').value = total.toFixed(2);
}

// 加载用户余额
async function loadUserBalance() {
  try {
    const response = await fetch('http://localhost:3000/api/user', {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });

    if (response.ok) {
      const user = await response.json();
      document.getElementById('tradeBalance').value = user.balance.toFixed(2);
    }
  } catch (error) {
    console.error('加载余额失败:', error);
  }
}

// 提交交易
async function submitTrade(type) {
  const stockCode = document.getElementById('tradeStockCode').value;
  const stockName = document.getElementById('tradeStockName').value;
  const price = parseFloat(document.getElementById('tradePrice').value);
  const quantity = parseInt(document.getElementById('tradeQuantity').value) * 100; // 转换为股数

  try {
    const response = await fetch(`http://localhost:3000/api/trade/${type}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({ stockCode, stockName, quantity, price })
    });

    const data = await response.json();

    if (response.ok) {
      alert(`${type === 'buy' ? '买入' : '卖出'}成功！`);
      closeTradeModal();
      loadUserData();
    } else {
      alert(data.error);
    }
  } catch (error) {
    alert('交易失败，请检查网络连接');
  }
}

// 加载用户数据
async function loadUserData() {
  loadUserBalance();
  loadHoldings();
  loadTransactions();
}

// 加载持仓
async function loadHoldings() {
  try {
    const response = await fetch('http://localhost:3000/api/holdings', {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });

    if (response.ok) {
      const holdings = await response.json();
      displayHoldings(holdings);
    }
  } catch (error) {
    console.error('加载持仓失败:', error);
  }
}

// 显示持仓
function displayHoldings(holdings) {
  const listEl = document.getElementById('holdingsList');
  
  if (holdings.length === 0) {
    listEl.innerHTML = '<div class="empty-state">暂无持仓</div>';
    return;
  }

  listEl.innerHTML = `
    <div class="holding-row holding-header">
      <span>股票名称</span>
      <span>持仓数量</span>
      <span>成本价</span>
      <span>当前价</span>
      <span>盈亏</span>
    </div>
    ${holdings.map(h => `
      <div class="holding-row">
        <span>${h.stock_name} (${h.stock_code})</span>
        <span>${h.quantity}</span>
        <span>${h.avg_price.toFixed(2)}</span>
        <span>${h.currentPrice.toFixed(2)}</span>
        <span class="${h.profit >= 0 ? 'up' : 'down'}">${h.profit >= 0 ? '+' : ''}${h.profit.toFixed(2)}</span>
      </div>
    `).join('')}
  `;
}

// 加载交易记录
async function loadTransactions() {
  try {
    const response = await fetch('http://localhost:3000/api/transactions', {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });

    if (response.ok) {
      const transactions = await response.json();
      displayTransactions(transactions);
    }
  } catch (error) {
    console.error('加载交易记录失败:', error);
  }
}

// 显示交易记录
function displayTransactions(transactions) {
  const listEl = document.getElementById('transactionsList');
  
  if (transactions.length === 0) {
    listEl.innerHTML = '<div class="empty-state">暂无交易记录</div>';
    return;
  }

  listEl.innerHTML = `
    <div class="transaction-row" style="font-weight: 600; color: #6B7280;">
      <span>时间</span>
      <span>类型</span>
      <span>股票</span>
      <span>数量</span>
      <span>价格</span>
      <span>金额</span>
    </div>
    ${transactions.map(t => `
      <div class="transaction-row">
        <span>${new Date(t.created_at).toLocaleString('zh-CN')}</span>
        <span class="transaction-type-${t.type}">${t.type === 'buy' ? '买入' : '卖出'}</span>
        <span>${t.stock_name} (${t.stock_code})</span>
        <span>${t.quantity}</span>
        <span>${t.price.toFixed(2)}</span>
        <span>${t.total_amount.toFixed(2)}</span>
      </div>
    `).join('')}
  `;
}

// 搜索股票
function searchStock(event) {
  if (event.key === 'Enter') {
    const query = event.target.value.trim();
    if (!query) return;

    // 简化搜索：查找股票代码或名称
    const stock = Object.entries(stockData).find(([code, data]) => 
      code.includes(query) || data.name.includes(query)
    );

    if (stock) {
      showStockDetail(stock[0]);
    } else {
      alert('未找到相关股票');
    }
  }
}

// 刷新数据
function refreshData() {
  loadStockData();
  alert('数据已刷新');
}

// 显示用户菜单（简化）
function showUserMenu() {
  if (confirm('是否退出登录？')) {
    localStorage.removeItem('authToken');
    location.reload();
  }
}

// 加载自选股
async function loadWatchlist() {
  // 简化实现
  alert('自选股功能开发中...');
}
