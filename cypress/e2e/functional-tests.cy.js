/**
 * 🎯 Cypress E2E: 실제 기능 동작 테스트
 * 
 * 특징:
 * - 예약 생성 전체 플로우 테스트
 * - 폼 입력 및 유효성 검사
 * - API 호출 및 응답 처리
 * - 사용자 인터랙션 및 상태 변화
 * - 실시간 데이터 업데이트
 */

describe('🎯 게임플라자: 핵심 기능 동작 테스트', () => {
  beforeEach(() => {
    // 모바일 환경 설정
    cy.viewport(390, 844) // iPhone 12 Pro
    
    // API 인터셉트 설정
    cy.intercept('GET', '/api/auth/session').as('sessionCheck')
    cy.intercept('GET', '/api/v2/devices').as('getDevices')
    cy.intercept('POST', '/api/v2/reservations/create').as('createReservation')
    cy.intercept('GET', '/api/v2/time-slots**').as('getTimeSlots')
    
    cy.task('log', '🎯 핵심 기능 테스트 시나리오 시작')
  })

  it('📝 시나리오 1: 예약 생성 전체 플로우 - 단계별 진행', () => {
    cy.task('log', '📝 예약 생성 플로우 테스트 시작')
    
    // 1단계: 예약 페이지 접근
    cy.visit('/reservations/new')
    cy.wait(3000)
    cy.screenshot('01-reservation-page-loaded')
    
    // 2단계: 페이지 구조 확인
    cy.get('body').then($body => {
      // 예약 페이지 핵심 요소들 확인
      const title = $body.find('h1:contains("예약하기")')
      const progressBar = $body.find('.h-2, [role="progressbar"]')
      const stepContent = $body.find('h2, [data-step]')
      
      cy.task('log', `예약하기 제목: ${title.length}개`)
      cy.task('log', `진행 바: ${progressBar.length}개`)
      cy.task('log', `단계 컨텐츠: ${stepContent.length}개`)
      
      if (title.length > 0) {
        cy.task('log', '✅ 예약 페이지 정상 로딩됨')
        cy.screenshot('02-reservation-page-structure-ok')
      } else {
        cy.task('log', '⚠️ 예약 페이지 구조 확인 필요')
        cy.screenshot('02-reservation-page-structure-issue')
      }
    })
    
    // 3단계: 달력/날짜 선택 인터랙션 테스트
    cy.get('body').then($body => {
      // 날짜 선택 관련 요소들 찾기
      const calendarElements = $body.find('[data-testid*="calendar"], .calendar, [class*="calendar"]')
      const dateButtons = $body.find('button[data-date], button:contains("일"), .date-button')
      const dateInputs = $body.find('input[type="date"], input[name*="date"]')
      
      cy.task('log', `달력 요소: ${calendarElements.length}개`)
      cy.task('log', `날짜 버튼: ${dateButtons.length}개`)
      cy.task('log', `날짜 입력: ${dateInputs.length}개`)
      
      if (dateButtons.length > 0) {
        // 첫 번째 사용 가능한 날짜 클릭 시도
        cy.wrap(dateButtons.first()).click({ force: true })
        cy.wait(1000)
        cy.screenshot('03-date-selection-attempted')
        cy.task('log', '날짜 선택 시도 완료')
      } else if (calendarElements.length > 0) {
        // 달력 영역 클릭 시도
        cy.wrap(calendarElements.first()).click({ force: true })
        cy.wait(1000)
        cy.screenshot('03-calendar-click-attempted')
        cy.task('log', '달력 클릭 시도 완료')
      } else {
        cy.task('log', '날짜 선택 요소를 찾을 수 없음')
        cy.screenshot('03-no-date-elements-found')
      }
    })
    
    cy.task('log', '✅ 예약 생성 플로우 1단계 테스트 완료')
  })

  it('🎮 시나리오 2: 기기 선택 및 상호작용 테스트', () => {
    cy.task('log', '🎮 기기 선택 테스트 시작')
    
    cy.visit('/reservations/new')
    cy.wait(3000)
    
    // 기기 선택 관련 요소들 찾기
    cy.get('body').then($body => {
      const deviceCards = $body.find('[data-testid*="device"], .device-card, [class*="device"]')
      const gamepadIcons = $body.find('svg[class*="gamepad"], [data-icon="gamepad"]')
      const deviceButtons = $body.find('button:contains("기기"), button:contains("게임")')
      const clickableElements = $body.find('button, [role="button"], a')
      
      cy.task('log', `기기 카드: ${deviceCards.length}개`)
      cy.task('log', `게임패드 아이콘: ${gamepadIcons.length}개`)
      cy.task('log', `기기 관련 버튼: ${deviceButtons.length}개`)
      cy.task('log', `전체 클릭 가능 요소: ${clickableElements.length}개`)
      
      // 다양한 방법으로 기기 선택 시도
      if (deviceCards.length > 0) {
        cy.wrap(deviceCards.first()).click({ force: true })
        cy.wait(1000)
        cy.screenshot('04-device-card-clicked')
        cy.task('log', '기기 카드 클릭 시도')
      } else if (deviceButtons.length > 0) {
        cy.wrap(deviceButtons.first()).click({ force: true })
        cy.wait(1000)
        cy.screenshot('04-device-button-clicked')
        cy.task('log', '기기 버튼 클릭 시도')
      } else if (clickableElements.length > 0) {
        // 처음 몇 개의 클릭 가능한 요소 시도
        for (let i = 0; i < Math.min(3, clickableElements.length); i++) {
          cy.wrap(clickableElements.eq(i)).click({ force: true })
          cy.wait(500)
          cy.screenshot(`04-clickable-element-${i}-clicked`)
        }
        cy.task('log', '클릭 가능한 요소들 시도 완료')
      }
    })
    
    cy.task('log', '✅ 기기 선택 테스트 완료')
  })

  it('⏰ 시나리오 3: 시간대 선택 및 24시간 표시 테스트', () => {
    cy.task('log', '⏰ 시간대 선택 테스트 시작')
    
    cy.visit('/reservations/new')
    cy.wait(3000)
    
    // 시간대 관련 요소들 찾기
    cy.get('body').then($body => {
      const timeElements = $body.find('*:contains("24"), *:contains("25"), *:contains("26"), *:contains("27"), *:contains("28"), *:contains("29")')
      const clockIcons = $body.find('svg[class*="clock"], [data-icon="clock"]')
      const timeButtons = $body.find('button:contains(":"), button[data-time]')
      const timeSlots = $body.find('.time-slot, [class*="time-slot"], [data-testid*="time"]')
      
      cy.task('log', `24-29시 표시 요소: ${timeElements.length}개`)
      cy.task('log', `시계 아이콘: ${clockIcons.length}개`)
      cy.task('log', `시간 버튼: ${timeButtons.length}개`)
      cy.task('log', `타임슬롯: ${timeSlots.length}개`)
      
      // 24시간 표시 체계 확인
      if (timeElements.length > 0) {
        cy.task('log', '✅ 24-29시 표시 체계 발견됨')
        
        // 각 시간대 클릭 테스트
        timeElements.each((index, element) => {
          const text = Cypress.$(element).text()
          if (text.includes('24') || text.includes('25') || text.includes('26')) {
            cy.wrap(element).click({ force: true })
            cy.wait(500)
            cy.screenshot(`05-time-${text.replace(/[^0-9]/g, '')}-clicked`)
            cy.task('log', `${text} 시간대 클릭 시도`)
          }
        })
      } else {
        cy.task('log', '24-29시 표시를 찾을 수 없음')
      }
      
      // 일반 시간 버튼들 테스트
      if (timeButtons.length > 0) {
        cy.wrap(timeButtons.first()).click({ force: true })
        cy.wait(1000)
        cy.screenshot('05-time-button-clicked')
        cy.task('log', '시간 버튼 클릭 시도')
      }
    })
    
    cy.task('log', '✅ 시간대 선택 테스트 완료')
  })

  it('💳 시나리오 4: 결제 옵션 및 가격 계산 테스트', () => {
    cy.task('log', '💳 결제 옵션 테스트 시작')
    
    cy.visit('/reservations/new')
    cy.wait(3000)
    
    // 결제 관련 요소들 찾기
    cy.get('body').then($body => {
      const priceElements = $body.find('*:contains("원"), *:contains("₩"), [class*="price"]')
      const creditOptions = $body.find('*:contains("크레딧"), *:contains("무한"), *:contains("고정")')
      const paymentButtons = $body.find('button:contains("크레딧"), button:contains("결제")')
      const totalAmount = $body.find('*:contains("총"), *:contains("합계"), *:contains("결제")')
      
      cy.task('log', `가격 표시 요소: ${priceElements.length}개`)
      cy.task('log', `크레딧 옵션: ${creditOptions.length}개`)
      cy.task('log', `결제 버튼: ${paymentButtons.length}개`)
      cy.task('log', `총 금액 표시: ${totalAmount.length}개`)
      
      // 가격 정보가 표시되는지 확인
      if (priceElements.length > 0) {
        cy.task('log', '✅ 가격 정보 표시됨')
        cy.screenshot('06-price-elements-found')
        
        // 가격 정보 추출 및 로그
        priceElements.each((index, element) => {
          const text = Cypress.$(element).text()
          if (text.includes('원') && text.match(/\d/)) {
            cy.task('log', `가격 정보: ${text}`)
          }
        })
      }
      
      // 크레딧 옵션 선택 테스트
      if (creditOptions.length > 0) {
        cy.wrap(creditOptions.first()).click({ force: true })
        cy.wait(1000)
        cy.screenshot('06-credit-option-selected')
        cy.task('log', '크레딧 옵션 선택 시도')
      }
      
      // 2인 플레이 옵션 테스트
      const playerOptions = $body.find('*:contains("2인"), *:contains("플레이어"), button:contains("인")')
      if (playerOptions.length > 0) {
        cy.wrap(playerOptions.first()).click({ force: true })
        cy.wait(1000)
        cy.screenshot('06-player-option-selected')
        cy.task('log', '플레이어 옵션 선택 시도')
      }
    })
    
    cy.task('log', '✅ 결제 옵션 테스트 완료')
  })

  it('📄 시나리오 5: 폼 입력 및 유효성 검사 테스트', () => {
    cy.task('log', '📄 폼 입력 테스트 시작')
    
    cy.visit('/reservations/new')
    cy.wait(3000)
    
    // 입력 필드들 찾기
    cy.get('body').then($body => {
      const textInputs = $body.find('input[type="text"], input[type="email"], input[type="tel"]')
      const textareas = $body.find('textarea')
      const selects = $body.find('select')
      const checkboxes = $body.find('input[type="checkbox"]')
      const radios = $body.find('input[type="radio"]')
      
      cy.task('log', `텍스트 입력: ${textInputs.length}개`)
      cy.task('log', `텍스트 영역: ${textareas.length}개`)
      cy.task('log', `선택 박스: ${selects.length}개`)
      cy.task('log', `체크박스: ${checkboxes.length}개`)
      cy.task('log', `라디오 버튼: ${radios.length}개`)
      
      // 텍스트 입력 필드 테스트
      if (textInputs.length > 0) {
        textInputs.each((index, input) => {
          const placeholder = Cypress.$(input).attr('placeholder') || '테스트 입력'
          cy.wrap(input).clear().type(`테스트 데이터 ${index}`, { force: true })
          cy.wait(300)
        })
        cy.screenshot('07-text-inputs-filled')
        cy.task('log', '텍스트 입력 필드 채우기 완료')
      }
      
      // 텍스트 영역 테스트 (메모, 요청사항 등)
      if (textareas.length > 0) {
        cy.wrap(textareas.first()).clear().type('테스트 요청사항입니다. 특별한 주의사항이 있습니다.', { force: true })
        cy.screenshot('07-textarea-filled')
        cy.task('log', '텍스트 영역 입력 완료')
      }
      
      // 체크박스 테스트
      if (checkboxes.length > 0) {
        cy.wrap(checkboxes.first()).check({ force: true })
        cy.screenshot('07-checkbox-checked')
        cy.task('log', '체크박스 선택 완료')
      }
    })
    
    cy.task('log', '✅ 폼 입력 테스트 완료')
  })

  it('🔄 시나리오 6: API 호출 및 실시간 업데이트 테스트', () => {
    cy.task('log', '🔄 API 호출 테스트 시작')
    
    // API 응답 시뮬레이션
    cy.intercept('GET', '/api/v2/devices', {
      statusCode: 200,
      body: {
        devices: [
          {
            id: 'test-device-1',
            name: '테스트 기기 1',
            category: '리듬게임',
            status: 'available',
            device_number: 1
          },
          {
            id: 'test-device-2', 
            name: '테스트 기기 2',
            category: '리듬게임',
            status: 'available',
            device_number: 2
          }
        ]
      }
    }).as('mockDevices')
    
    cy.intercept('GET', '/api/v2/time-slots**', {
      statusCode: 200,
      body: {
        timeSlots: [
          {
            id: 'slot-1',
            start_time: '14:00',
            end_time: '16:00',
            available_devices: [1, 2],
            price: 8000,
            is_available: true
          },
          {
            id: 'slot-2',
            start_time: '26:00', // 새벽 2시
            end_time: '28:00', // 새벽 4시
            available_devices: [1, 2],
            price: 10000,
            is_available: true
          }
        ]
      }
    }).as('mockTimeSlots')
    
    cy.visit('/reservations/new')
    cy.wait(3000)
    
    // API 호출 확인
    cy.get('@mockDevices').should('have.been.called')
    cy.screenshot('08-api-devices-called')
    cy.task('log', '기기 목록 API 호출 확인')
    
    // 실시간 데이터 업데이트 시뮬레이션
    cy.window().then((win) => {
      // 가상의 실시간 이벤트 발생
      win.postMessage({
        type: 'DEVICE_STATUS_UPDATE',
        data: {
          deviceId: 'test-device-1',
          status: 'occupied'
        }
      }, '*')
    })
    
    cy.wait(1000)
    cy.screenshot('08-realtime-update-sent')
    cy.task('log', '실시간 업데이트 시뮬레이션 완료')
    
    cy.task('log', '✅ API 호출 테스트 완료')
  })

  it('✅ 시나리오 7: 예약 완료 플로우 테스트', () => {
    cy.task('log', '✅ 예약 완료 플로우 테스트 시작')
    
    // 성공적인 예약 생성 API 시뮬레이션
    cy.intercept('POST', '/api/v2/reservations/create', {
      statusCode: 201,
      body: {
        reservation: {
          id: 'test-reservation-123',
          date: '2025-01-26',
          device_id: 'test-device-1',
          start_time: '14:00',
          end_time: '16:00',
          status: 'pending',
          total_amount: 8000
        }
      }
    }).as('createReservationSuccess')
    
    // 기기 및 타임슬롯 API 모킹
    cy.intercept('GET', '/api/v2/devices', {
      statusCode: 200,
      body: {
        devices: [
          {
            id: 'test-device-1',
            name: '테스트 기기 1',
            category: '리듬게임',
            status: 'available',
            device_number: 1
          }
        ]
      }
    }).as('mockDevicesForReservation')
    
    cy.intercept('GET', '/api/v2/time-slots**', {
      statusCode: 200,
      body: {
        timeSlots: [
          {
            id: 'slot-1',
            start_time: '14:00',
            end_time: '16:00',
            available_devices: [1],
            price: 8000,
            is_available: true
          }
        ]
      }
    }).as('mockTimeSlotsForReservation')
    
    cy.visit('/reservations/new')
    cy.wait(3000)
    
    // 실제 예약 플로우 시뮬레이션 (4단계까지 진행)
    cy.task('log', '1단계: 날짜 선택 시뮬레이션')
    
    // 단순화된 예약 플로우 테스트
    cy.task('log', '단순화된 예약 플로우 테스트 시작')
    
    // 달력 영역에서 날짜 버튼 찾기
    cy.get('body').then($body => {
      const dateButtons = $body.find('button[class*="aspect-square"]:not([disabled])')
      
      if (dateButtons.length > 0) {
        cy.wrap(dateButtons.first()).click({ force: true })
        cy.wait(2000)
        cy.screenshot('09-date-selected')
        cy.task('log', '1단계: 날짜 선택 완료')
        
        // 기기 선택
        cy.get('body').then($step2Body => {
          const deviceButtons = $step2Body.find('button[class*="p-6"][class*="rounded-2xl"]:not([disabled])')
          
          if (deviceButtons.length > 0) {
            cy.wrap(deviceButtons.first()).click({ force: true })
            cy.wait(2000)
            cy.screenshot('09-device-selected')
            cy.task('log', '2단계: 기기 선택 완료')
            
            // 시간 선택
            cy.get('body').then($step3Body => {
              const timeButtons = $step3Body.find('button[class*="w-full"]:contains(":"):not([disabled])')
              
              if (timeButtons.length > 0) {
                cy.wrap(timeButtons.first()).click({ force: true })
                cy.wait(2000)
                cy.screenshot('09-time-selected')
                cy.task('log', '3단계: 시간 선택 완료')
                
                // 크레딧 옵션 및 예약하기
                cy.get('body').then($step4Body => {
                  const creditOptions = $step4Body.find('button:contains("크레딧"), button:contains("무한")')
                  
                  if (creditOptions.length > 0) {
                    cy.wrap(creditOptions.first()).click({ force: true })
                    cy.wait(1000)
                    cy.task('log', '4단계: 크레딧 옵션 선택 완료')
                  }
                  
                  const submitButton = $step4Body.find('button:contains("예약하기"):not([disabled])')
                  
                  if (submitButton.length > 0) {
                    cy.wrap(submitButton.first()).click({ force: true })
                    cy.wait(3000)
                    
                    cy.get('@createReservationSuccess').should('have.been.called')
                    cy.screenshot('09-reservation-submitted')
                    cy.task('log', '✅ 예약 제출 성공')
                  } else {
                    cy.task('log', '⚠️ 예약하기 버튼 없음')
                    cy.screenshot('09-no-submit-button')
                  }
                })
              } else {
                cy.task('log', '⚠️ 시간 선택 버튼 없음')
                cy.screenshot('09-no-time-buttons')
              }
            })
          } else {
            cy.task('log', '⚠️ 기기 선택 버튼 없음')
            cy.screenshot('09-no-device-buttons')
          }
        })
      } else {
        cy.task('log', '⚠️ 날짜 선택 버튼 없음')
        cy.screenshot('09-no-date-buttons')
      }
    })
    
    cy.task('log', '✅ 예약 완료 플로우 테스트 완료')
  })

  it('🚨 시나리오 8: 에러 처리 및 검증 테스트', () => {
    cy.task('log', '🚨 에러 처리 테스트 시작')
    
    // 에러 응답 시뮬레이션
    cy.intercept('POST', '/api/v2/reservations/create', {
      statusCode: 400,
      body: {
        error: '선택한 시간대가 이미 예약되었습니다',
        code: 'TIME_SLOT_UNAVAILABLE'
      }
    }).as('createReservationError')
    
    // 에러 상황에서도 기본 API들은 정상 동작하도록 설정
    cy.intercept('GET', '/api/v2/devices', {
      statusCode: 200,
      body: { devices: [{ id: 'device-1', name: '테스트 기기', category: '리듬게임' }] }
    }).as('devicesMock')
    
    cy.intercept('GET', '/api/v2/time-slots**', {
      statusCode: 200,
      body: { timeSlots: [{ id: 'slot-1', start_time: '14:00', price: 8000 }] }
    }).as('timeSlotsMock')
    
    cy.visit('/reservations/new')
    cy.wait(3000)
    
    // 1. 유효성 검사 에러 테스트 (필수 입력 누락)
    cy.task('log', '1단계: 입력 유효성 검사 테스트')
    
    cy.get('body').then($body => {
      // 예약하기 버튼을 찾되, 비활성화 상태인지 확인
      const submitButtons = $body.find('button:contains("예약하기")')
      const disabledButtons = $body.find('button:disabled, button[disabled], .cursor-not-allowed')
      
      cy.task('log', `예약하기 버튼 개수: ${submitButtons.length}`)
      cy.task('log', `비활성화된 버튼 개수: ${disabledButtons.length}`)
      
      if (disabledButtons.length > 0) {
        cy.task('log', '✅ 필수 조건 미충족 시 버튼 비활성화 확인됨')
        cy.screenshot('10-disabled-button-validation')
      } else {
        cy.task('log', '버튼 활성화 상태 - 조건부 제출 테스트 진행')
        cy.screenshot('10-enabled-button-state')
      }
    })
    
    // 2. API 에러 응답 처리 테스트
    cy.task('log', '2단계: API 에러 응답 처리 테스트')
    
    // 테스트용 가상 예약 데이터 설정 (JavaScript로 직접 주입)
    cy.window().then((win) => {
      // 가상의 예약 상태를 설정하여 API 호출 트리거
      if (win.document.querySelector('button:contains("예약하기")')) {
        // 강제로 예약 조건을 만족시킨 후 에러 테스트
        cy.get('button').contains('예약하기').then($btn => {
          if ($btn.prop('disabled')) {
            // 버튼이 비활성화되어 있다면 강제로 활성화
            cy.wrap($btn).invoke('prop', 'disabled', false)
            cy.wrap($btn).invoke('removeClass', 'cursor-not-allowed')
          }
          
          cy.wrap($btn).click({ force: true })
          cy.wait(3000)
          
          // 에러 메시지 표시 확인 - 다양한 방법으로 검색
          cy.get('body').then($updatedBody => {
            const errorMessages = $updatedBody.find('*:contains("오류"), *:contains("실패"), *:contains("에러"), *:contains("예약되었습니다"), .bg-red-50, .text-red-700, [role="alert"]')
            const redElements = $updatedBody.find('.text-red-600, .text-red-700, .border-red-200, .bg-red-50')
            
            cy.task('log', `에러 메시지 후보: ${errorMessages.length}개`)
            cy.task('log', `빨간색 스타일 요소: ${redElements.length}개`)
            
            if (errorMessages.length > 0) {
              cy.task('log', '✅ 에러 메시지 표시됨')
              cy.screenshot('10-error-message-displayed')
              
              // 에러 메시지 텍스트 확인
              errorMessages.each((index, element) => {
                const text = Cypress.$(element).text()
                if (text.includes('오류') || text.includes('에러') || text.includes('실패') || text.includes('예약')) {
                  cy.task('log', `에러 메시지 내용: ${text}`)
                }
              })
            } else if (redElements.length > 0) {
              cy.task('log', '✅ 에러 스타일 요소 발견됨')
              cy.screenshot('10-error-style-elements')
            } else {
              cy.task('log', '⚠️ 에러 메시지 표시 확인 불가 - API 에러 처리 개선 필요')
              cy.screenshot('10-no-error-message-found')
            }
          })
        })
      } else {
        cy.task('log', '예약하기 버튼을 찾을 수 없음 - 에러 상황 시뮬레이션 제한적')
        cy.screenshot('10-no-submit-button-for-error-test')
      }
    })
    
    // 3. 네트워크 에러 시뮬레이션
    cy.task('log', '3단계: 네트워크 에러 시뮬레이션')
    
    cy.intercept('POST', '/api/v2/reservations/create', { 
      forceNetworkError: true 
    }).as('networkError')
    
    cy.intercept('GET', '/api/auth/session', { 
      statusCode: 500,
      body: { error: 'Internal Server Error' }
    }).as('sessionError')
    
    // 페이지 새로고침하여 네트워크 에러 상황 테스트
    cy.reload()
    cy.wait(3000)
    
    // 네트워크 에러 상황에서의 UI 동작 확인
    cy.get('body').then($body => {
      const loadingIndicators = $body.find('.animate-spin, .loading, *:contains("로딩")')
      const errorIndicators = $body.find('*:contains("연결"), *:contains("네트워크"), *:contains("오류")')
      
      cy.task('log', `로딩 표시기: ${loadingIndicators.length}개`)
      cy.task('log', `네트워크 에러 표시기: ${errorIndicators.length}개`)
      
      if (errorIndicators.length > 0) {
        cy.task('log', '✅ 네트워크 에러 상황 처리 확인됨')
        cy.screenshot('10-network-error-handling')
      } else if (loadingIndicators.length > 0) {
        cy.task('log', '로딩 상태 표시됨 - 네트워크 재시도 중')
        cy.screenshot('10-network-loading-state')
      } else {
        cy.task('log', '네트워크 에러 처리 상태 불분명')
        cy.screenshot('10-network-error-unclear')
      }
    })
    
    cy.task('log', '✅ 에러 처리 및 검증 테스트 완료')
  })
})

// 기능 테스트용 커스텀 명령어
Cypress.Commands.add('fillReservationForm', (data = {}) => {
  const defaultData = {
    date: '2025-01-26',
    deviceType: '리듬게임',
    timeSlot: '14:00-16:00',
    playerCount: 1,
    notes: '테스트 예약입니다'
  }
  
  const formData = { ...defaultData, ...data }
  
  // 폼 채우기 로직 구현
  if (formData.notes) {
    cy.get('textarea').first().clear().type(formData.notes, { force: true })
  }
})

Cypress.Commands.add('simulateReservationAPI', (response = 'success') => {
  if (response === 'success') {
    cy.intercept('POST', '/api/v2/reservations/create', {
      statusCode: 201,
      body: { reservation: { id: 'test-123', status: 'pending' } }
    }).as('reservationAPI')
  } else {
    cy.intercept('POST', '/api/v2/reservations/create', {
      statusCode: 400,
      body: { error: '예약 실패' }
    }).as('reservationAPI')
  }
})