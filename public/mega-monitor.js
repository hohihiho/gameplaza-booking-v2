
(function() {
  if (window.__megaMonitorInjected) return;
  window.__megaMonitorInjected = true;

  const ws = new WebSocket('ws://localhost:8080');

  ws.onopen = () => console.log('[MEGA] 모니터링 연결됨');

  // 오류 감지
  window.addEventListener('error', (e) => {
    ws.send(JSON.stringify({
      type: 'console_error',
      error: e.message,
      stack: e.error?.stack,
      url: e.filename,
      line: e.lineno,
      column: e.colno
    }));
  });

  // Promise rejection
  window.addEventListener('unhandledrejection', (e) => {
    ws.send(JSON.stringify({
      type: 'console_error',
      error: e.reason?.message || String(e.reason),
      stack: e.reason?.stack
    }));
  });

  // 클릭 모니터링
  document.addEventListener('click', (e) => {
    const target = e.target;

    if (target.disabled || target.style.pointerEvents === 'none') {
      ws.send(JSON.stringify({
        type: 'click_failed',
        element: target.tagName,
        reason: 'disabled'
      }));
    }
  }, true);

  // 네트워크 모니터링
  const originalFetch = window.fetch;
  window.fetch = async (...args) => {
    try {
      const response = await originalFetch(...args);

      if (!response.ok) {
        ws.send(JSON.stringify({
          type: 'network_error',
          url: args[0],
          status: response.status
        }));
      }

      return response;
    } catch (error) {
      ws.send(JSON.stringify({
        type: 'network_error',
        url: args[0],
        error: error.message
      }));
      throw error;
    }
  };

  // 자동 수정 수신
  ws.onmessage = (event) => {
    const data = JSON.parse(event.data);

    if (data.type === 'reload') {
      location.reload();
    }
  };
})();