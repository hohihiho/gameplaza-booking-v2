#!/usr/bin/env node

/**
 * Simple WebSocket Server for error monitoring
 */

const WebSocket = require('ws');
const http = require('http');

// WebSocket 서버
const wss = new WebSocket.Server({ port: 8080 });

console.log('📡 WebSocket Server started on port 8080');

wss.on('connection', (ws) => {
  console.log('🔌 Client connected');

  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);
      console.log('📨 Received:', data.type, data.message || '');

      // 에러 타입별 처리
      if (data.type === 'error' || data.type === 'console') {
        console.log('🔴 Error detected:', data.message);
      }

      if (data.type === 'network' && data.status >= 400) {
        console.log('🌐 Network error:', data.url, 'Status:', data.status);
      }

      if (data.type === 'clickFailed') {
        console.log('🖱️ Click failed:', data.element, data.text);
      }
    } catch (error) {
      console.error('Message parsing error:', error);
    }
  });

  ws.on('close', () => {
    console.log('❌ Client disconnected');
  });
});

// 간단한 대시보드 서버
const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  res.end(`
<!DOCTYPE html>
<html>
<head>
  <title>Error Monitor Dashboard</title>
  <style>
    body { font-family: monospace; background: #1a1a1a; color: #fff; padding: 20px; }
    h1 { color: #00ff88; }
    #logs { background: #000; padding: 20px; height: 600px; overflow-y: auto; }
    .error { color: #ff4444; }
    .network { color: #ffaa00; }
    .click { color: #ff00ff; }
    .info { color: #00aaff; }
  </style>
</head>
<body>
  <h1>🔮 Error Monitor Dashboard</h1>
  <div id="logs"></div>
  <script>
    const ws = new WebSocket('ws://localhost:8080');
    const logs = document.getElementById('logs');

    function addLog(message, className = 'info') {
      const div = document.createElement('div');
      div.className = className;
      div.textContent = '[' + new Date().toLocaleTimeString() + '] ' + message;
      logs.appendChild(div);
      logs.scrollTop = logs.scrollHeight;
    }

    ws.onopen = () => addLog('Connected to monitor', 'info');
    ws.onclose = () => addLog('Disconnected from monitor', 'error');

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);

      if (data.type === 'error' || data.type === 'console') {
        addLog('ERROR: ' + (data.message || 'Unknown error'), 'error');
      } else if (data.type === 'network') {
        addLog('NETWORK: ' + data.url + ' (Status: ' + data.status + ')', 'network');
      } else if (data.type === 'clickFailed') {
        addLog('CLICK FAILED: ' + data.element + ' - ' + data.text, 'click');
      }
    };

    // 페이지에서 에러 감지
    window.addEventListener('error', (e) => {
      ws.send(JSON.stringify({
        type: 'error',
        message: e.message,
        filename: e.filename,
        timestamp: Date.now()
      }));
    });
  </script>
</body>
</html>
  `);
});

server.listen(8888);
console.log('📊 Dashboard available at http://localhost:8888');

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n👋 Shutting down...');
  wss.close();
  server.close();
  process.exit(0);
});
