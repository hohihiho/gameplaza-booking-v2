// Custom Cypress commands for Game Plaza testing

// 모바일 뷰포트 설정
Cypress.Commands.add('setMobileViewport', () => {
  cy.viewport(390, 844); // iPhone 12 Pro 해상도
});

// 특정 시간대로 시간 설정 (KST 시간대)
Cypress.Commands.add('setKSTTime', (dateString) => {
  const targetDate = new Date(dateString + 'T00:00:00+09:00');
  cy.clock(targetDate.getTime());
});

// 24시간 표시 체계 확인
Cypress.Commands.add('verifyDisplayTime', (expectedTime) => {
  cy.get('[data-testid="display-time"]')
    .should('contain', expectedTime);
});

// 예약 프로세스 시뮬레이션
Cypress.Commands.add('simulateReservation', (userData) => {
  const { timeSlot, name, phone, deviceType } = userData;
  
  // 시간 선택
  if (timeSlot) {
    cy.get(`[data-time="${timeSlot}"]`).click();
  }
  
  // 사용자 정보 입력
  if (name) {
    cy.get('input[name="name"]').clear().type(name);
  }
  
  if (phone) {
    cy.get('input[name="phone"]').clear().type(phone);
  }
  
  if (deviceType) {
    cy.get(`[data-device-type="${deviceType}"]`).click();
  }
});

// 네트워크 요청 대기
Cypress.Commands.add('waitForNetworkIdle', () => {
  cy.intercept('**').as('allRequests');
  cy.wait('@allRequests');
});

// 로딩 상태 확인
Cypress.Commands.add('waitForLoadingComplete', () => {
  cy.get('[data-testid="loading"]').should('not.exist');
});

// 에러 메시지 확인
Cypress.Commands.add('shouldShowError', (message) => {
  cy.get('[data-testid="error-message"]')
    .should('be.visible')
    .and('contain', message);
});

// 성공 메시지 확인
Cypress.Commands.add('shouldShowSuccess', (message) => {
  cy.get('[data-testid="success-message"]')
    .should('be.visible')
    .and('contain', message);
});

// 페이지 성능 측정
Cypress.Commands.add('measurePagePerformance', () => {
  cy.window().then((win) => {
    const navigation = win.performance.getEntriesByType('navigation')[0];
    if (navigation) {
      const metrics = {
        domContentLoaded: navigation.domContentLoadedEventEnd - navigation.navigationStart,
        loadComplete: navigation.loadEventEnd - navigation.navigationStart,
        firstPaint: 0,
        firstContentfulPaint: 0
      };
      
      // Paint 메트릭 가져오기
      const paintEntries = win.performance.getEntriesByType('paint');
      paintEntries.forEach(entry => {
        if (entry.name === 'first-paint') {
          metrics.firstPaint = entry.startTime;
        } else if (entry.name === 'first-contentful-paint') {
          metrics.firstContentfulPaint = entry.startTime;
        }
      });
      
      cy.log('Performance Metrics', metrics);
      return cy.wrap(metrics);
    }
  });
});

// 접근성 확인
Cypress.Commands.add('checkAccessibility', () => {
  // 기본적인 접근성 체크
  cy.get('h1, h2, h3, h4, h5, h6').should('exist');
  cy.get('main').should('exist');
  cy.get('nav').should('exist');
});

// 모바일 터치 시뮬레이션
Cypress.Commands.add('touchSwipe', (element, direction) => {
  cy.get(element).then($el => {
    const el = $el[0];
    const rect = el.getBoundingClientRect();
    const startX = rect.left + rect.width / 2;
    const startY = rect.top + rect.height / 2;
    
    let endX = startX;
    let endY = startY;
    
    switch (direction) {
      case 'left':
        endX = startX - 100;
        break;
      case 'right':
        endX = startX + 100;
        break;
      case 'up':
        endY = startY - 100;
        break;
      case 'down':
        endY = startY + 100;
        break;
    }
    
    cy.trigger('touchstart', { touches: [{ clientX: startX, clientY: startY }] });
    cy.trigger('touchmove', { touches: [{ clientX: endX, clientY: endY }] });
    cy.trigger('touchend');
  });
});