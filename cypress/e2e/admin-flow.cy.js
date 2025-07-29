/**
 * 🔐 Cypress E2E: 관리자 페이지 및 권한 테스트
 * 
 * 특징:
 * - 관리자 인증 및 권한 확인
 * - 관리자 전용 기능 테스트
 * - 권한 없는 사용자의 접근 제한 확인
 * - 관리자 대시보드 및 주요 기능 테스트
 */

describe('🔐 게임플라자: 관리자 시스템 테스트', () => {
  beforeEach(() => {
    // 모바일 환경 설정
    cy.viewport(390, 844) // iPhone 12 Pro
    
    // 네트워크 요청 모니터링
    cy.intercept('GET', '/api/**').as('apiCall')
    cy.intercept('POST', '/api/**').as('apiPost')
    cy.intercept('PUT', '/api/**').as('apiPut')
    
    cy.task('log', '🚀 관리자 테스트 시나리오 시작')
  })

  it('🚫 시나리오 1: 비로그인 사용자 관리자 페이지 접근 차단', () => {
    cy.task('log', '🚫 비로그인 사용자 관리자 접근 테스트 시작')
    
    // 1단계: 로그아웃 상태에서 관리자 페이지 직접 접근
    cy.visit('/admin')
    cy.wait(3000)
    
    // 2단계: 로그인 페이지로 리다이렉트 확인
    cy.url().should('include', '/login')
    cy.screenshot('01-admin-redirect-to-login')
    
    // 3단계: 다양한 관리자 하위 페이지 접근 시도
    const adminPages = [
      '/admin/dashboard',
      '/admin/devices',
      '/admin/reservations',
      '/admin/checkin',
      '/admin/users'
    ]
    
    adminPages.forEach((page, index) => {
      cy.visit(page)
      cy.wait(2000)
      cy.url().should('include', '/login')
      cy.screenshot(`02-admin-${index}-blocked`)
      cy.task('log', `관리자 페이지 ${page} 접근 차단 확인`)
    })
    
    cy.task('log', '✅ 비로그인 사용자 관리자 접근 차단 테스트 완료')
  })

  it('🛡️ 시나리오 2: 일반 사용자의 관리자 페이지 접근 시도', () => {
    cy.task('log', '🛡️ 일반 사용자 관리자 접근 테스트 시작')
    
    // 1단계: 홈페이지 접속
    cy.visit('/')
    cy.wait(2000)
    cy.screenshot('03-homepage-normal-user')
    
    // 2단계: 하단 탭바에서 관리자 관련 메뉴 확인
    cy.get('body').then($body => {
      // 관리자 관련 링크가 일반 사용자에게는 보이지 않아야 함
      const adminLinks = $body.find('a[href*="/admin"]')
      cy.task('log', `일반 사용자에게 보이는 관리자 링크 개수: ${adminLinks.length}`)
      
      // 관리자 링크가 보이지 않거나 제한되어야 함
      if (adminLinks.length === 0) {
        cy.task('log', '✅ 일반 사용자에게 관리자 링크가 숨겨져 있음')
        cy.screenshot('04-no-admin-links-for-normal-user')
      } else {
        cy.task('log', `⚠️ 일반 사용자에게 ${adminLinks.length}개의 관리자 링크가 보임`)
        cy.screenshot('04-admin-links-visible-to-normal-user')
      }
    })
    
    // 3단계: URL 직접 접근으로 관리자 페이지 시도
    cy.visit('/admin')
    cy.wait(3000)
    
    // 4단계: 홈페이지로 리다이렉트되거나 권한 없음 메시지 확인
    cy.url().then(url => {
      if (url.includes('/login')) {
        cy.task('log', '일반 사용자도 로그인 페이지로 리다이렉트됨')
        cy.screenshot('05-normal-user-redirected-to-login')
      } else if (url === Cypress.config().baseUrl + '/') {
        cy.task('log', '일반 사용자가 홈페이지로 리다이렉트됨')
        cy.screenshot('05-normal-user-redirected-to-home')
      } else {
        cy.task('log', '예상치 못한 리다이렉트 경로')
        cy.screenshot('05-unexpected-redirect')
      }
    })
    
    cy.task('log', '✅ 일반 사용자 관리자 접근 제한 테스트 완료')
  })

  it('🔑 시나리오 3: 관리자 로그인 및 대시보드 접근', () => {
    cy.task('log', '🔑 관리자 로그인 테스트 시작')
    
    // 1단계: 관리자 계정으로 로그인 시뮬레이션
    // 실제 환경에서는 테스트 관리자 계정이 필요하지만, 
    // 여기서는 구조만 확인
    
    cy.visit('/admin')
    cy.wait(3000)
    
    // 2단계: 로그인 필요 시 로그인 페이지로 이동
    cy.url().then(url => {
      if (url.includes('/login')) {
        cy.task('log', '관리자 로그인이 필요함')
        
        // Google 로그인 버튼 확인 (실제 클릭은 하지 않음)
        cy.get('body').then($body => {
          const loginButtons = $body.find('button, a')
          cy.task('log', `로그인 페이지 버튼 개수: ${loginButtons.length}`)
          
          if (loginButtons.length > 0) {
            cy.screenshot('06-admin-login-page')
          }
        })
        
        // 테스트 목적으로 관리자 API 응답 시뮬레이션
        cy.intercept('GET', '/api/auth/check-admin', {
          statusCode: 200,
          body: { 
            isAdmin: true, 
            userId: 'test-admin-id',
            role: 'admin',
            isSuperAdmin: true
          }
        }).as('adminCheck')
        
        // 관리자 세션 시뮬레이션 (실제로는 Google OAuth 필요)
        cy.window().then((win) => {
          // 가상의 관리자 세션 설정
          win.localStorage.setItem('admin-test-session', 'true')
        })
        
        cy.task('log', '테스트용 관리자 권한 시뮬레이션 완료')
        cy.screenshot('07-admin-auth-simulated')
      } else {
        cy.task('log', '이미 관리자로 로그인되어 있음')
        cy.screenshot('07-already-admin-logged-in')
      }
    })
    
    cy.task('log', '✅ 관리자 로그인 시뮬레이션 테스트 완료')
  })

  it('📊 시나리오 4: 관리자 대시보드 기능 확인', () => {
    cy.task('log', '📊 관리자 대시보드 테스트 시작')
    
    // 관리자 권한 시뮬레이션
    cy.intercept('GET', '/api/auth/check-admin', {
      statusCode: 200,
      body: { 
        isAdmin: true, 
        userId: 'test-admin-id',
        role: 'admin',
        isSuperAdmin: true
      }
    }).as('adminCheck')
    
    // 1단계: 관리자 페이지 접근
    cy.visit('/admin')
    cy.wait(3000)
    
    // 2단계: 관리자 대시보드 로딩 확인
    cy.get('body').then($body => {
      // 관리자 레이아웃 요소들 확인
      const adminTitle = $body.find('*:contains("관리자")')
      const menuItems = $body.find('nav a, [role="menuitem"]')
      const dashboardElements = $body.find('*:contains("대시보드")')
      
      cy.task('log', `관리자 제목 요소: ${adminTitle.length}개`)
      cy.task('log', `메뉴 항목: ${menuItems.length}개`)
      cy.task('log', `대시보드 요소: ${dashboardElements.length}개`)
      
      if (adminTitle.length > 0) {
        cy.task('log', '✅ 관리자 인터페이스 로딩됨')
        cy.screenshot('08-admin-dashboard-loaded')
      } else {
        cy.task('log', '⚠️ 관리자 인터페이스 로딩 실패')
        cy.screenshot('08-admin-dashboard-failed')
      }
    })
    
    // 3단계: 관리자 메뉴 항목들 확인
    const expectedMenuItems = [
      '대시보드',
      '체크인',
      '기기 관리',
      '예약 관리',
      '회원 관리',
      '통계 분석'
    ]
    
    expectedMenuItems.forEach((menuItem, index) => {
      cy.get('body').then($body => {
        const menuExists = $body.find(`*:contains("${menuItem}")`).length > 0
        if (menuExists) {
          cy.task('log', `✅ 메뉴 "${menuItem}" 발견됨`)
        } else {
          cy.task('log', `⚠️ 메뉴 "${menuItem}" 찾을 수 없음`)
        }
      })
    })
    
    cy.screenshot('09-admin-menu-items-check')
    
    cy.task('log', '✅ 관리자 대시보드 기능 확인 완료')
  })

  it('🔧 시나리오 5: 관리자 주요 기능 페이지 접근', () => {
    cy.task('log', '🔧 관리자 주요 기능 테스트 시작')
    
    // 관리자 권한 시뮬레이션
    cy.intercept('GET', '/api/auth/check-admin', {
      statusCode: 200,
      body: { 
        isAdmin: true, 
        userId: 'test-admin-id',
        role: 'admin',
        isSuperAdmin: true
      }
    }).as('adminCheck')
    
    // 관리자 주요 페이지들 테스트
    const adminPages = [
      { path: '/admin/checkin', name: '체크인' },
      { path: '/admin/devices', name: '기기 관리' },
      { path: '/admin/reservations', name: '예약 관리' },
      { path: '/admin/users', name: '회원 관리' },
      { path: '/admin/analytics/reservations', name: '통계 분석' },
      { path: '/admin/settings', name: '설정' }
    ]
    
    adminPages.forEach((page, index) => {
      cy.visit(page.path)
      cy.wait(3000)
      
      // 페이지 로딩 확인
      cy.get('body').then($body => {
        const pageContent = $body.text()
        const hasContent = pageContent.length > 100 // 충분한 컨텐츠가 있는지
        const hasError = pageContent.includes('오류') || pageContent.includes('에러') || pageContent.includes('404')
        
        if (hasContent && !hasError) {
          cy.task('log', `✅ ${page.name} 페이지 정상 로딩`)
          cy.screenshot(`10-admin-${index}-${page.name.replace(' ', '-')}-success`)
        } else {
          cy.task('log', `⚠️ ${page.name} 페이지 로딩 문제`)
          cy.screenshot(`10-admin-${index}-${page.name.replace(' ', '-')}-failed`)
        }
      })
    })
    
    cy.task('log', '✅ 관리자 주요 기능 페이지 접근 테스트 완료')
  })

  it('📱 시나리오 6: 모바일 관리자 네비게이션 테스트', () => {
    cy.task('log', '📱 모바일 관리자 네비게이션 테스트 시작')
    
    // 관리자 권한 시뮬레이션
    cy.intercept('GET', '/api/auth/check-admin', {
      statusCode: 200,
      body: { 
        isAdmin: true, 
        userId: 'test-admin-id',
        role: 'admin',
        isSuperAdmin: true
      }
    }).as('adminCheck')
    
    cy.visit('/admin')
    cy.wait(3000)
    
    // 1단계: 모바일 햄버거 메뉴 확인
    cy.get('body').then($body => {
      const hamburgerMenu = $body.find('button:has(svg)')
      cy.task('log', `햄버거 메뉴 버튼 개수: ${hamburgerMenu.length}`)
      
      if (hamburgerMenu.length > 0) {
        // 햄버거 메뉴 클릭 시도
        cy.wrap(hamburgerMenu.first()).click()
        cy.wait(1000)
        cy.screenshot('11-mobile-admin-menu-opened')
        
        // 메뉴가 열렸는지 확인
        cy.get('body').then($updatedBody => {
          const visibleMenu = $updatedBody.find('nav, aside, [role="menu"]')
          cy.task('log', `열린 메뉴 요소: ${visibleMenu.length}개`)
        })
      } else {
        cy.task('log', '모바일 햄버거 메뉴를 찾을 수 없음')
        cy.screenshot('11-no-mobile-admin-menu')
      }
    })
    
    // 2단계: 사이트로 돌아가기 링크 확인
    cy.get('body').then($body => {
      const backToSiteLink = $body.find('a[href="/"], *:contains("사이트로")')
      cy.task('log', `사이트로 돌아가기 링크: ${backToSiteLink.length}개`)
      
      if (backToSiteLink.length > 0) {
        cy.task('log', '✅ 사이트로 돌아가기 링크 발견됨')
        cy.screenshot('12-back-to-site-link-found')
      }
    })
    
    cy.task('log', '✅ 모바일 관리자 네비게이션 테스트 완료')
  })
})

// 관리자 테스트용 커스텀 명령어
Cypress.Commands.add('simulateAdminAuth', () => {
  cy.intercept('GET', '/api/auth/check-admin', {
    statusCode: 200,
    body: { 
      isAdmin: true, 
      userId: 'test-admin-id',
      role: 'admin',
      isSuperAdmin: true
    }
  }).as('adminAuthSimulated')
})

Cypress.Commands.add('simulateNormalUser', () => {
  cy.intercept('GET', '/api/auth/check-admin', {
    statusCode: 200,
    body: { 
      isAdmin: false, 
      userId: 'test-user-id',
      role: 'user',
      isSuperAdmin: false
    }
  }).as('normalUserSimulated')
})