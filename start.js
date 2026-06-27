const net = require('net');
const { spawn } = require('child_process');

// 查找可用端口
function findAvailablePort(startPort) {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.listen(startPort, () => {
      const port = server.address().port;
      server.close(() => resolve(port));
    });
    server.on('error', () => {
      findAvailablePort(startPort + 1).then(resolve).catch(reject);
    });
  });
}

async function start() {
  try {
    const port = await findAvailablePort(3001);
    console.log(`启动服务器在端口 ${port}...`);
    
    // 修改server.js中的端口
    const fs = require('fs');
    const serverPath = './backend/server.js';
    let serverCode = fs.readFileSync(serverPath, 'utf8');
    serverCode = serverCode.replace(/const PORT = \d+/, `const PORT = ${port}`);
    fs.writeFileSync(serverPath, serverCode);
    
    // 修改前端API地址
    const appPath = './frontend/app.js';
    let appCode = fs.readFileSync(appPath, 'utf8');
    appCode = appCode.replace(/localhost:\d+/g, `localhost:${port}`);
    fs.writeFileSync(appPath, appCode);
    
    // 启动服务器
    const server = spawn('node', ['backend/server.js'], {
      stdio: 'inherit',
      shell: true
    });
    
    console.log(`服务器已启动！访问 http://localhost:${port}`);
    
    // 等待3秒后打开浏览器
    setTimeout(() => {
      const { exec } = require('child_process');
      exec(`start http://localhost:${port}`);
    }, 3000);
    
  } catch (error) {
    console.error('启动失败:', error);
  }
}

start();
