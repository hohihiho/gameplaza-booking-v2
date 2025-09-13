
// Ultimate Monitor Client Script
(function() {
  const ws = new WebSocket('ws://localhost:8080');

  ws.onopen = () => {
    console.log('[Monitor] 연결됨');
  };

  // 콘솔 오류 감지
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

  // Promise rejection 감지
  window.addEventListener('unhandledrejection', (e) => {
    ws.send(JSON.stringify({
      type: 'console_error',
      error: e.reason?.message || e.reason,
      stack: e.reason?.stack
    }));
  });

  // 클릭 이벤트 모니터링
  document.addEventListener('click', (e) => {
    const target = e.target;

    // 비활성화된 요소 감지
    if (target.disabled || target.getAttribute('aria-disabled') === 'true') {
      ws.send(JSON.stringify({
        type: 'click_failed',
        selector: getSelector(target),
        reason: 'element_disabled',
        element: {
          tag: target.tagName,
          text: target.textContent?.substring(0, 50)
        }
      }));
    }

    // 숨겨진 요소 감지
    const style = window.getComputedStyle(target);
    if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') {
      ws.send(JSON.stringify({
        type: 'click_failed',
        selector: getSelector(target),
        reason: 'element_hidden'
      }));
    }
  }, true);

  // 네트워크 오류 감지
  const originalFetch = window.fetch;
  window.fetch = async (...args) => {
    try {
      const response = await originalFetch(...args);

      if (!response.ok) {
        ws.send(JSON.stringify({
          type: 'network_error',
          url: args[0],
          status: response.status,
          method: args[1]?.method || 'GET'
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

  // 성능 모니터링
  const observer = new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      if (entry.duration > 1000) {
        ws.send(JSON.stringify({
          type: 'performance_issue',
          metric: entry.name,
          value: Math.round(entry.duration),
          threshold: 1000
        }));
      }
    }
  });

  observer.observe({ entryTypes: ['navigation', 'resource', 'measure'] });

  // 요소 선택자 생성
  function getSelector(element) {
    if (element.id) return '#' + element.id;
    if (element.className) return '.' + element.className.split(' ').join('.');
    return element.tagName.toLowerCase();
  }

  // WebSocket 메시지 수신
  ws.onmessage = (event) => {
    const data = JSON.parse(event.data);

    switch(data.type) {
      case 'enable_element':
        const disabled = document.querySelector(data.selector);
        if (disabled) {
          disabled.disabled = false;
          disabled.removeAttribute('aria-disabled');
        }
        break;

      case 'show_element':
        const hidden = document.querySelector(data.selector);
        if (hidden) {
          hidden.style.display = '';
          hidden.style.visibility = 'visible';
          hidden.style.opacity = '1';
        }
        break;

      case 'fix_applied':
        console.log('[Monitor] 수정 적용됨:', data.fix);
        // 페이지 새로고침 (핫 리로드가 안되는 경우)
        if (data.fix.requireReload) {
          setTimeout(() => location.reload(), 1000);
        }
        break;
    }
  };
})();
