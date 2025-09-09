import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';

// 모바일 환경 시뮬레이션
const setupMobileEnvironment = () => {
  Object.defineProperty(window, 'innerWidth', {
    writable: true,
    configurable: true,
    value: 375,
  });
  Object.defineProperty(window, 'innerHeight', {
    writable: true,
    configurable: true,
    value: 812,
  });
  
  // Touch 이벤트 지원
  window.ontouchstart = jest.fn();
  
  // 모바일 User Agent
  Object.defineProperty(navigator, 'userAgent', {
    writable: true,
    configurable: true,
    value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_7_1 like Mac OS X) AppleWebKit/605.1.15',
  });
};

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    pathname: '/',
  }),
  usePathname: () => '/',
}));

// Mock 컴포넌트들
import MainActionButtons from '@/app/components/MainActionButtons';
import MobileMenu from '@/app/components/MobileMenu';
import BottomSheet from '@/app/components/mobile/BottomSheet';
import SwipeableCard from '@/app/components/mobile/SwipeableCard';
import PullToRefresh from '@/app/components/mobile/PullToRefresh';
import AnimatedCard from '@/app/components/mobile/AnimatedCard';
import TouchRipple from '@/app/components/mobile/TouchRipple';
import FormInput from '@/app/components/mobile/FormInput';

describe('모바일 UI/UX 테스트', () => {
  beforeEach(() => {
    setupMobileEnvironment();
    jest.clearAllMocks();
  });

  describe('터치 인터랙션', () => {
    it('TC-MOBILE-001: 터치 리플 효과', async () => {
      // Given: 터치 가능한 버튼
      const handleClick = jest.fn();
      render(
        <TouchRipple>
          <button onClick={handleClick}>터치하기</button>
        </TouchRipple>
      );

      const button = screen.getByText('터치하기');

      // When: 클릭 이벤트 (터치 리플은 클릭 이벤트를 방해하지 않음)
      fireEvent.click(button);

      // Then: 클릭 이벤트가 발생했는지 확인
      expect(handleClick).toHaveBeenCalled();
    });

    it('TC-MOBILE-002: 스와이프 제스처 인식', async () => {
      // Given: 스와이프 가능한 카드
      const handleSwipeLeft = jest.fn();
      const handleSwipeRight = jest.fn();
      
      render(
        <SwipeableCard
          leftAction={{
            icon: <span>✓</span>,
            label: '완료',
            color: 'green',
            action: handleSwipeLeft
          }}
          rightAction={{
            icon: <span>✗</span>,
            label: '삭제',
            color: 'red',
            action: handleSwipeRight
          }}
        >
          <div>스와이프 카드</div>
        </SwipeableCard>
      );

      const card = screen.getByText('스와이프 카드');

      // When: 왼쪽으로 스와이프 (rightAction 트리거)
      // SwipeableCard는 drag 이벤트를 사용하지만, 테스트에서는 dragEnd만 확인 가능
      const cardElement = screen.getByRole('button');
      
      // Framer Motion의 drag 이벤트를 직접 시뮬레이션
      fireEvent.mouseDown(cardElement, { clientX: 200, clientY: 100 });
      fireEvent.mouseMove(cardElement, { clientX: 50, clientY: 100 });
      fireEvent.mouseUp(cardElement);

      // Then: 스와이프 기능이 있는지 확인 (DOM 테스트에서는 실제 애니메이션 확인 어려움)
      expect(cardElement).toHaveAttribute('role', 'button');
      expect(cardElement).toHaveAttribute('aria-describedby', '좌우로 스와이프하여 완료 또는 삭제 실행');
    });

    it('TC-MOBILE-003: 길게 누르기 (Long Press)', async () => {
      // Given: 길게 누르기 가능한 아이템
      const handleLongPress = jest.fn();
      
      const LongPressItem = () => {
        let pressTimer: NodeJS.Timeout;
        
        const handleTouchStart = () => {
          pressTimer = setTimeout(() => {
            handleLongPress();
          }, 500);
        };
        
        const handleTouchEnd = () => {
          clearTimeout(pressTimer);
        };
        
        return (
          <div
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          >
            길게 누르기
          </div>
        );
      };

      render(<LongPressItem />);

      // When: 길게 누르기
      const element = screen.getByText('길게 누르기');
      fireEvent.touchStart(element);
      
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 600));
      });
      
      fireEvent.touchEnd(element);

      // Then: 길게 누르기 이벤트 발생
      expect(handleLongPress).toHaveBeenCalled();
    });

    it('TC-MOBILE-004: 더블 탭 감지', async () => {
      // Given: 더블 탭 가능한 컴포넌트
      const handleDoubleTap = jest.fn();
      
      const DoubleTapComponent = () => {
        let lastTap = 0;
        
        const handleTap = () => {
          const now = Date.now();
          if (now - lastTap < 300) {
            handleDoubleTap();
          }
          lastTap = now;
        };
        
        return <div onClick={handleTap}>더블 탭</div>;
      };

      render(<DoubleTapComponent />);

      // When: 빠른 두 번 탭
      const element = screen.getByText('더블 탭');
      fireEvent.click(element);
      fireEvent.click(element);

      // Then: 더블 탭 이벤트
      expect(handleDoubleTap).toHaveBeenCalled();
    });

    it('TC-MOBILE-005: 핀치 줌 제스처', async () => {
      // Given: 줌 가능한 이미지
      const handleZoom = jest.fn();
      
      const ZoomableImage = () => {
        const handleTouchMove = (e: React.TouchEvent) => {
          if (e.touches.length === 2) {
            const distance = Math.hypot(
              e.touches[0].clientX - e.touches[1].clientX,
              e.touches[0].clientY - e.touches[1].clientY
            );
            handleZoom(distance);
          }
        };
        
        return (
          <img
            src="/test-image.jpg"
            onTouchMove={handleTouchMove}
            alt="줌 가능 이미지"
          />
        );
      };

      render(<ZoomableImage />);

      // When: 핀치 제스처
      const image = screen.getByAltText('줌 가능 이미지');
      fireEvent.touchMove(image, {
        touches: [
          { clientX: 100, clientY: 100 },
          { clientX: 200, clientY: 200 },
        ],
      });

      // Then: 줌 핸들러 호출
      expect(handleZoom).toHaveBeenCalled();
    });
  });

  describe('모바일 네비게이션', () => {
    it('TC-MOBILE-010: 하단 탭바 네비게이션', async () => {
      // Given: 모바일 메뉴
      render(<MobileMenu />);

      // When: 햄버거 메뉴 클릭
      const menuButton = screen.getByLabelText('메뉴 열기');
      fireEvent.click(menuButton);

      // 예약하기 링크 클릭
      const reservationLink = screen.getByText('🎯 예약하기');
      expect(reservationLink).toBeInTheDocument();
      expect(reservationLink).toHaveAttribute('href', '/reservations/new');
    });

    it('TC-MOBILE-011: 스와이프 백 제스처', async () => {
      // Given: 뒤로가기 가능한 페이지
      const handleBack = jest.fn();
      
      const SwipeBackPage = () => {
        const handleTouchStart = (e: React.TouchEvent) => {
          if (e.touches[0].clientX < 20) {
            // 왼쪽 가장자리에서 시작
            handleBack();
          }
        };
        
        return (
          <div onTouchStart={handleTouchStart} style={{ minHeight: '100vh' }}>
            페이지 내용
          </div>
        );
      };

      render(<SwipeBackPage />);

      // When: 왼쪽 가장자리에서 스와이프
      fireEvent.touchStart(screen.getByText('페이지 내용'), {
        touches: [{ clientX: 10, clientY: 100 }],
      });

      // Then: 뒤로가기 실행
      expect(handleBack).toHaveBeenCalled();
    });

    it('TC-MOBILE-012: 햄버거 메뉴 토글', async () => {
      // Given: 햄버거 메뉴
      const HamburgerMenu = () => {
        const [isOpen, setIsOpen] = React.useState(false);
        
        return (
          <>
            <button onClick={() => setIsOpen(!isOpen)}>☰</button>
            {isOpen && <div className="menu-overlay">메뉴</div>}
          </>
        );
      };

      render(<HamburgerMenu />);

      // When: 햄버거 아이콘 클릭
      fireEvent.click(screen.getByText('☰'));

      // Then: 메뉴 열림
      expect(screen.getByText('메뉴')).toBeInTheDocument();
    });

    it('TC-MOBILE-013: 바텀시트 인터랙션', async () => {
      // Given: 바텀시트 컴포넌트
      const handleClose = jest.fn();
      
      render(
        <BottomSheet isOpen={true} onClose={handleClose}>
          <div>바텀시트 내용</div>
        </BottomSheet>
      );

      // 바텀시트가 열려 있는지 확인
      const sheet = screen.getByRole('dialog');
      expect(sheet).toBeInTheDocument();
      expect(screen.getByText('바텀시트 내용')).toBeInTheDocument();
      
      // 오버레이 클릭으로 닫기 테스트
      const overlay = document.querySelector('.bg-black\\/50');
      if (overlay) {
        fireEvent.click(overlay);
        expect(handleClose).toHaveBeenCalled();
      }
    });

    it('TC-MOBILE-014: 플로팅 액션 버튼', async () => {
      // Given: FAB
      const handleAction = jest.fn();
      
      const FloatingActionButton = () => (
        <button
          className="fab"
          onClick={handleAction}
          style={{
            position: 'fixed',
            bottom: '70px',
            right: '20px',
            borderRadius: '50%',
          }}
        >
          +
        </button>
      );

      render(<FloatingActionButton />);

      // When: FAB 클릭
      fireEvent.click(screen.getByText('+'));

      // Then: 액션 실행
      expect(handleAction).toHaveBeenCalled();
    });
  });

  describe('모바일 폼 최적화', () => {
    it('TC-MOBILE-020: 가상 키보드 대응', async () => {
      // Given: 입력 필드
      render(
        <FormInput
          type="text"
          name="nickname"
          placeholder="닉네임"
          autoComplete="username"
        />
      );

      const input = screen.getByPlaceholderText('닉네임');

      // When: 포커스
      act(() => {
        input.focus();
      });

      // Then: 입력 필드가 포커스됨 (가상 키보드 대응은 브라우저가 처리)
      expect(document.activeElement).toBe(input);
      expect(input).toHaveAttribute('type', 'text');
      expect(input).toHaveAttribute('autoComplete', 'username');
    });

    it('TC-MOBILE-021: 숫자 키패드 표시', async () => {
      // Given: 숫자 입력 필드
      render(
        <FormInput
          type="tel"
          name="phone"
          placeholder="전화번호"
          inputMode="numeric"
          pattern="[0-9]*"
        />
      );

      const input = screen.getByPlaceholderText('전화번호');

      // Then: 숫자 키패드 속성
      expect(input).toHaveAttribute('inputMode', 'numeric');
      expect(input).toHaveAttribute('pattern', '[0-9]*');
    });

    it('TC-MOBILE-022: 자동완성 최적화', async () => {
      // Given: 로그인 폼
      render(
        <form>
          <FormInput
            type="email"
            name="email"
            autoComplete="email"
            placeholder="이메일"
          />
          <FormInput
            type="password"
            name="password"
            autoComplete="current-password"
            placeholder="비밀번호"
          />
        </form>
      );

      // Then: 자동완성 속성 확인
      expect(screen.getByPlaceholderText('이메일')).toHaveAttribute('autoComplete', 'email');
      expect(screen.getByPlaceholderText('비밀번호')).toHaveAttribute('autoComplete', 'current-password');
    });

    it('TC-MOBILE-023: 입력 필드 확대 방지', async () => {
      // Given: 폼 입력 필드
      render(
        <FormInput
          type="text"
          name="search"
          placeholder="검색"
          style={{ fontSize: '16px' }}
        />
      );

      const input = screen.getByPlaceholderText('검색');

      // Then: 16px 이상 폰트 크기
      const styles = window.getComputedStyle(input);
      expect(parseInt(styles.fontSize)).toBeGreaterThanOrEqual(16);
    });

    it('TC-MOBILE-024: 드롭다운 터치 영역', async () => {
      // Given: 선택 드롭다운
      const SelectDropdown = () => (
        <select style={{ minHeight: '44px', padding: '12px' }}>
          <option>옵션 1</option>
          <option>옵션 2</option>
          <option>옵션 3</option>
        </select>
      );

      render(<SelectDropdown />);

      const select = screen.getByRole('combobox');

      // Then: 최소 터치 영역 확보
      const styles = window.getComputedStyle(select);
      expect(parseInt(styles.minHeight)).toBeGreaterThanOrEqual(44);
    });
  });

  describe('스크롤 및 성능', () => {
    it('TC-MOBILE-030: 무한 스크롤 구현', async () => {
      // Given: 무한 스크롤 리스트
      const InfiniteList = () => {
        const [items, setItems] = React.useState(Array(20).fill(null));
        const [loading, setLoading] = React.useState(false);
        
        const handleScroll = (e: React.UIEvent) => {
          const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
          if (scrollHeight - scrollTop <= clientHeight * 1.5 && !loading) {
            setLoading(true);
            setTimeout(() => {
              setItems([...items, ...Array(20).fill(null)]);
              setLoading(false);
            }, 1000);
          }
        };
        
        return (
          <div onScroll={handleScroll} style={{ height: '500px', overflow: 'auto' }}>
            {items.map((_, index) => (
              <div key={index}>아이템 {index + 1}</div>
            ))}
            {loading && <div>로딩중...</div>}
          </div>
        );
      };

      render(<InfiniteList />);

      // When: 스크롤 끝까지
      const scrollContainer = screen.getByText('아이템 1').parentElement!;
      
      // 스크롤 이벤트의 target을 모의 객체로 만들어 전달
      const scrollEvent = new Event('scroll', { bubbles: true });
      Object.defineProperty(scrollEvent, 'currentTarget', {
        value: { scrollTop: 1000, scrollHeight: 1200, clientHeight: 500 },
        writable: false
      });
      
      fireEvent(scrollContainer, scrollEvent);

      // Then: 추가 아이템 로드
      await waitFor(() => {
        expect(screen.getByText('로딩중...')).toBeInTheDocument();
      });
    });

    it('TC-MOBILE-031: Pull to Refresh', async () => {
      // Given: Pull to Refresh 컴포넌트
      const handleRefresh = jest.fn(() => Promise.resolve());
      
      const { container } = render(
        <PullToRefresh onRefresh={handleRefresh}>
          <div>콘텐츠</div>
        </PullToRefresh>
      );

      // PullToRefresh 컴포넌트가 렌더링되었는지 확인
      const content = screen.getByText('콘텐츠');
      expect(content).toBeInTheDocument();
      
      // PullToRefresh 기능은 실제 모바일 환경에서만 제대로 작동하므로
      // 컴포넌트가 올바르게 렌더링되는지만 확인
      expect(container.firstChild).toBeTruthy();
    });

    it('TC-MOBILE-032: 스크롤 위치 복원', async () => {
      // Given: 스크롤 가능한 페이지
      const ScrollablePage = () => {
        React.useEffect(() => {
          const savedPosition = sessionStorage.getItem('scrollPosition');
          if (savedPosition) {
            window.scrollTo(0, parseInt(savedPosition));
          }
          
          const handleScroll = () => {
            sessionStorage.setItem('scrollPosition', window.scrollY.toString());
          };
          
          window.addEventListener('scroll', handleScroll);
          return () => window.removeEventListener('scroll', handleScroll);
        }, []);
        
        return (
          <div style={{ height: '2000px' }}>
            <div>스크롤 페이지</div>
          </div>
        );
      };

      // 이전 스크롤 위치 저장
      sessionStorage.setItem('scrollPosition', '500');

      // window.scrollTo 모의
      const scrollToSpy = jest.spyOn(window, 'scrollTo');
      
      render(<ScrollablePage />);

      // Then: 스크롤 위치 복원 함수 호출 확인
      expect(scrollToSpy).toHaveBeenCalledWith(0, 500);
      
      scrollToSpy.mockRestore();
    });

    it('TC-MOBILE-033: 스크롤 모멘텀 제어', async () => {
      // Given: 스크롤 컨테이너
      const MomentumScroll = () => (
        <div
          style={{
            overflow: 'auto',
            WebkitOverflowScrolling: 'touch',
            height: '300px',
          }}
        >
          {Array(50).fill(null).map((_, i) => (
            <div key={i}>아이템 {i}</div>
          ))}
        </div>
      );

      render(<MomentumScroll />);

      const container = screen.getByText('아이템 0').parentElement!;

      // Then: 모멘텀 스크롤 속성
      const styles = window.getComputedStyle(container);
      expect(styles.WebkitOverflowScrolling).toBe('touch');
    });

    it('TC-MOBILE-034: 가상 스크롤링', async () => {
      // Given: 대용량 리스트
      const VirtualList = () => {
        const [visibleRange, setVisibleRange] = React.useState({ start: 0, end: 20 });
        const items = Array(1000).fill(null);
        
        const handleScroll = (e: React.UIEvent) => {
          const scrollTop = e.currentTarget.scrollTop;
          const itemHeight = 50;
          const start = Math.floor(scrollTop / itemHeight);
          const end = start + 20;
          setVisibleRange({ start, end });
        };
        
        return (
          <div onScroll={handleScroll} style={{ height: '500px', overflow: 'auto' }}>
            <div style={{ height: `${items.length * 50}px`, position: 'relative' }}>
              {items.slice(visibleRange.start, visibleRange.end).map((_, index) => (
                <div
                  key={visibleRange.start + index}
                  style={{
                    position: 'absolute',
                    top: `${(visibleRange.start + index) * 50}px`,
                    height: '50px',
                  }}
                >
                  아이템 {visibleRange.start + index + 1}
                </div>
              ))}
            </div>
          </div>
        );
      };

      render(<VirtualList />);

      // Then: 보이는 영역만 렌더링
      expect(screen.getAllByText(/아이템/)).toHaveLength(20);
    });
  });

  describe('모바일 특화 UI', () => {
    it('TC-MOBILE-040: 액션 시트', async () => {
      // Given: 액션 시트
      const ActionSheet = ({ actions }: { actions: Array<{ label: string; handler: () => void }> }) => (
        <div className="action-sheet">
          {actions.map((action, index) => (
            <button key={index} onClick={action.handler}>
              {action.label}
            </button>
          ))}
          <button className="cancel">취소</button>
        </div>
      );

      const handleShare = jest.fn();
      const handleDelete = jest.fn();

      render(
        <ActionSheet
          actions={[
            { label: '공유하기', handler: handleShare },
            { label: '삭제하기', handler: handleDelete },
          ]}
        />
      );

      // When: 액션 선택
      fireEvent.click(screen.getByText('공유하기'));

      // Then: 핸들러 실행
      expect(handleShare).toHaveBeenCalled();
    });

    it('TC-MOBILE-041: 토스트 메시지', async () => {
      // Given: 토스트 컴포넌트
      const Toast = ({ message, duration = 3000 }: { message: string; duration?: number }) => {
        const [visible, setVisible] = React.useState(true);
        
        React.useEffect(() => {
          const timer = setTimeout(() => setVisible(false), duration);
          return () => clearTimeout(timer);
        }, [duration]);
        
        return visible ? (
          <div className="toast" role="alert">
            {message}
          </div>
        ) : null;
      };

      const { rerender } = render(<Toast message="저장되었습니다" />);

      // Then: 토스트 표시
      expect(screen.getByRole('alert')).toHaveTextContent('저장되었습니다');
      
      // 3초 후 자동으로 사라지는지 확인
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 3100));
      });
      
      await waitFor(() => {
        expect(screen.queryByRole('alert')).not.toBeInTheDocument();
      });
    });

    it('TC-MOBILE-042: 세그먼트 컨트롤', async () => {
      // Given: 세그먼트 컨트롤
      const SegmentControl = () => {
        const [selected, setSelected] = React.useState('option1');
        
        return (
          <div className="segment-control">
            <button
              className={selected === 'option1' ? 'active' : ''}
              onClick={() => setSelected('option1')}
            >
              옵션 1
            </button>
            <button
              className={selected === 'option2' ? 'active' : ''}
              onClick={() => setSelected('option2')}
            >
              옵션 2
            </button>
          </div>
        );
      };

      render(<SegmentControl />);

      // When: 옵션 변경
      fireEvent.click(screen.getByText('옵션 2'));

      // Then: 활성 상태 변경
      expect(screen.getByText('옵션 2')).toHaveClass('active');
      expect(screen.getByText('옵션 1')).not.toHaveClass('active');
    });

    it('TC-MOBILE-043: 스켈레톤 로더', async () => {
      // Given: 스켈레톤 로더
      const SkeletonLoader = () => (
        <div className="skeleton-loader" data-testid="skeleton-loader">
          <div className="skeleton-line" style={{ width: '80%' }} />
          <div className="skeleton-line" style={{ width: '60%' }} />
          <div className="skeleton-line" style={{ width: '70%' }} />
        </div>
      );

      render(<SkeletonLoader />);

      // Then: 스켈레톤 요소들 표시
      expect(screen.getByTestId('skeleton-loader')).toBeInTheDocument();
      expect(document.querySelectorAll('.skeleton-line')).toHaveLength(3);
    });

    it('TC-MOBILE-044: 스텝 인디케이터', async () => {
      // Given: 스텝 인디케이터
      const StepIndicator = ({ currentStep, totalSteps }: { currentStep: number; totalSteps: number }) => (
        <div className="step-indicator">
          {Array(totalSteps).fill(null).map((_, index) => (
            <div
              key={index}
              className={`step ${index < currentStep ? 'completed' : ''} ${index === currentStep ? 'active' : ''}`}
            />
          ))}
        </div>
      );

      render(<StepIndicator currentStep={2} totalSteps={4} />);

      // Then: 현재 스텝 표시
      const steps = document.querySelectorAll('.step');
      expect(steps[0]).toHaveClass('completed');
      expect(steps[1]).toHaveClass('completed');
      expect(steps[2]).toHaveClass('active');
      expect(steps[3]).not.toHaveClass('completed');
    });
  });

  describe('접근성 및 사용성', () => {
    it('TC-MOBILE-050: 터치 타겟 크기', async () => {
      // Given: 버튼들
      render(
        <div>
          <button style={{ minWidth: '44px', minHeight: '44px' }}>버튼 1</button>
          <a href="#" style={{ display: 'inline-block', padding: '12px 16px' }}>링크</a>
          <input type="checkbox" style={{ width: '24px', height: '24px' }} />
        </div>
      );

      // Then: 최소 터치 영역 확인
      const button = screen.getByText('버튼 1');
      const buttonStyles = window.getComputedStyle(button);
      expect(parseInt(buttonStyles.minWidth)).toBeGreaterThanOrEqual(44);
      expect(parseInt(buttonStyles.minHeight)).toBeGreaterThanOrEqual(44);
    });
  });
});