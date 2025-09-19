/**
 * PWA 설치 가이드 페이지
 * 플랫폼별 상세 설치 안내
 */

'use client';

import { useState, useEffect } from 'react';
import { ChevronRight, Smartphone, Monitor, Apple } from 'lucide-react';
import Image from 'next/image';

type Platform = 'android' | 'ios' | 'desktop' | 'unknown';

export default function InstallGuidePage() {
  const [platform, setPlatform] = useState<Platform>('unknown');
  const [selectedPlatform, setSelectedPlatform] = useState<Platform | null>(null);

  useEffect(() => {
    const detectPlatform = () => {
      const userAgent = navigator.userAgent.toLowerCase();

      if (/iphone|ipad|ipod/.test(userAgent)) {
        setPlatform('ios');
        setSelectedPlatform('ios');
      } else if (/android/.test(userAgent)) {
        setPlatform('android');
        setSelectedPlatform('android');
      } else if (/windows|mac|linux/.test(userAgent) && !(/mobile/.test(userAgent))) {
        setPlatform('desktop');
        setSelectedPlatform('desktop');
      }
    };

    detectPlatform();
  }, []);

  const platforms = [
    {
      id: 'android' as Platform,
      name: 'Android',
      icon: Smartphone,
      color: 'bg-green-500'
    },
    {
      id: 'ios' as Platform,
      name: 'iOS (iPhone/iPad)',
      icon: Apple,
      color: 'bg-gray-800'
    },
    {
      id: 'desktop' as Platform,
      name: 'PC (Chrome/Edge)',
      icon: Monitor,
      color: 'bg-blue-500'
    }
  ];

  const getGuideSteps = (platform: Platform) => {
    switch (platform) {
      case 'android':
        return [
          {
            title: 'Chrome 브라우저로 접속',
            description: '게임플라자 웹사이트를 Chrome 브라우저로 방문하세요.',
            tip: 'Samsung Internet도 지원합니다'
          },
          {
            title: '설치 배너 확인',
            description: '화면 하단에 나타나는 "홈 화면에 추가" 배너를 찾으세요.',
            tip: '배너가 안 보이면 메뉴에서 찾을 수 있습니다'
          },
          {
            title: '메뉴에서 설치 (대체 방법)',
            description: '우측 상단 점 3개 메뉴 → "앱 설치" 또는 "홈 화면에 추가"',
            tip: '브라우저 버전에 따라 메뉴명이 다를 수 있습니다'
          },
          {
            title: '설치 확인',
            description: '"설치" 또는 "추가" 버튼을 탭하세요.',
            tip: '앱 이름과 아이콘을 확인할 수 있습니다'
          },
          {
            title: '홈 화면에서 실행',
            description: '홈 화면에 추가된 게임플라자 아이콘을 탭하여 실행하세요.',
            tip: '일반 앱처럼 사용할 수 있습니다'
          }
        ];

      case 'ios':
        return [
          {
            title: 'Safari로 접속',
            description: '반드시 Safari 브라우저로 게임플라자에 접속하세요.',
            tip: 'Chrome이나 다른 브라우저는 지원하지 않습니다'
          },
          {
            title: '공유 버튼 탭',
            description: '화면 하단 중앙의 공유 버튼(상자에서 화살표가 나가는 모양)을 탭하세요.',
            tip: 'iPad는 상단에 있을 수 있습니다'
          },
          {
            title: '옵션 스크롤',
            description: '공유 메뉴를 아래로 스크롤하세요.',
            tip: '두 번째 줄의 옵션들을 확인하세요'
          },
          {
            title: '"홈 화면에 추가" 선택',
            description: '"홈 화면에 추가" 옵션을 찾아 탭하세요.',
            tip: '사각형에 + 아이콘이 있습니다'
          },
          {
            title: '이름 확인 후 추가',
            description: '앱 이름을 확인하고 우측 상단 "추가"를 탭하세요.',
            tip: '이름은 수정 가능합니다'
          },
          {
            title: '홈 화면에서 실행',
            description: '홈 화면에 추가된 아이콘으로 실행하세요.',
            tip: '일반 앱과 동일하게 작동합니다'
          }
        ];

      case 'desktop':
        return [
          {
            title: 'Chrome 또는 Edge 브라우저 사용',
            description: '게임플라자를 Chrome이나 Edge로 접속하세요.',
            tip: 'Firefox는 부분적으로 지원됩니다'
          },
          {
            title: '주소창 우측 아이콘 확인',
            description: '주소창 우측 끝의 설치 아이콘(+가 있는 모니터)을 찾으세요.',
            tip: '아이콘이 없으면 메뉴에서 찾을 수 있습니다'
          },
          {
            title: '메뉴에서 설치 (대체 방법)',
            description: '점 3개 메뉴 → "게임플라자 설치"',
            tip: 'Ctrl+Shift+I로 설치할 수도 있습니다'
          },
          {
            title: '설치 확인',
            description: '"설치" 버튼을 클릭하세요.',
            tip: '바탕화면 바로가기 생성 옵션이 있습니다'
          },
          {
            title: '앱 실행',
            description: '설치된 앱은 시작 메뉴나 바탕화면에서 실행할 수 있습니다.',
            tip: '작업 표시줄에 고정할 수 있습니다'
          }
        ];

      default:
        return [];
    }
  };

  const getTroubleshooting = (platform: Platform) => {
    switch (platform) {
      case 'android':
        return [
          {
            problem: '설치 버튼이 보이지 않아요',
            solution: '다른 브라우저를 사용 중이라면 Chrome으로 변경해보세요. 이미 설치된 경우에도 버튼이 나타나지 않습니다.'
          },
          {
            problem: '설치 후 아이콘이 없어요',
            solution: '앱 서랍이나 홈 화면의 다른 페이지를 확인하세요. 설정 → 앱에서도 확인할 수 있습니다.'
          },
          {
            problem: '알림이 오지 않아요',
            solution: '설정 → 앱 → 게임플라자 → 알림에서 알림 권한을 확인하세요.'
          }
        ];

      case 'ios':
        return [
          {
            problem: '"홈 화면에 추가"가 없어요',
            solution: 'Safari가 아닌 다른 브라우저를 사용 중입니다. 반드시 Safari로 접속하세요.'
          },
          {
            problem: '설치 후 오프라인에서 작동하지 않아요',
            solution: 'iOS의 제한으로 일부 오프라인 기능이 제한될 수 있습니다. 온라인 상태에서 먼저 접속해주세요.'
          },
          {
            problem: '푸시 알림이 작동하지 않아요',
            solution: 'iOS 16.4 이상에서만 웹 푸시 알림이 지원됩니다. iOS 버전을 확인하세요.'
          }
        ];

      case 'desktop':
        return [
          {
            problem: '설치 아이콘이 보이지 않아요',
            solution: 'HTTPS로 접속했는지 확인하세요. 개발자 도구(F12)를 열고 Application → Manifest를 확인하세요.'
          },
          {
            problem: '설치 후 창이 너무 작아요',
            solution: '앱 창의 모서리를 드래그하여 크기를 조절할 수 있습니다.'
          },
          {
            problem: '작업 표시줄에 고정이 안 돼요',
            solution: '앱을 실행한 상태에서 작업 표시줄 아이콘을 우클릭 → "작업 표시줄에 고정"을 선택하세요.'
          }
        ];

      default:
        return [];
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* 헤더 */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-4">게임플라자 앱 설치 가이드</h1>
          <p className="text-gray-600 dark:text-gray-400">
            기기에 맞는 설치 방법을 선택하세요
          </p>
        </div>

        {/* 플랫폼 선택 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {platforms.map((p) => (
            <button
              key={p.id}
              onClick={() => setSelectedPlatform(p.id)}
              className={`p-6 rounded-xl border-2 transition-all ${
                selectedPlatform === p.id
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
              }`}
            >
              <div className={`w-12 h-12 ${p.color} rounded-lg flex items-center justify-center mb-3 mx-auto`}>
                <p.icon className="w-6 h-6 text-white" />
              </div>
              <h3 className="font-medium">{p.name}</h3>
              {platform === p.id && (
                <span className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                  현재 기기
                </span>
              )}
            </button>
          ))}
        </div>

        {/* 설치 단계 */}
        {selectedPlatform && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-8">
            <h2 className="text-xl font-bold mb-6">설치 방법</h2>

            <div className="space-y-6">
              {getGuideSteps(selectedPlatform).map((step, index) => (
                <div key={index} className="flex gap-4">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
                      {index + 1}
                    </div>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold mb-1">{step.title}</h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-2">
                      {step.description}
                    </p>
                    {step.tip && (
                      <div className="bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500 p-3 text-sm">
                        <strong>💡 팁:</strong> {step.tip}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 문제 해결 */}
        {selectedPlatform && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-8">
            <h2 className="text-xl font-bold mb-6">자주 묻는 질문</h2>

            <div className="space-y-4">
              {getTroubleshooting(selectedPlatform).map((item, index) => (
                <details key={index} className="group">
                  <summary className="cursor-pointer list-none flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
                    <span className="font-medium">{item.problem}</span>
                    <ChevronRight className="w-5 h-5 transition-transform group-open:rotate-90" />
                  </summary>
                  <div className="p-4 text-gray-600 dark:text-gray-400">
                    {item.solution}
                  </div>
                </details>
              ))}
            </div>
          </div>
        )}

        {/* 장점 안내 */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-6 text-white">
          <h2 className="text-xl font-bold mb-4">앱 설치의 장점</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-white rounded-full mt-2 flex-shrink-0" />
              <div>
                <h3 className="font-semibold">빠른 접근</h3>
                <p className="text-white/80 text-sm">홈 화면에서 바로 실행</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-white rounded-full mt-2 flex-shrink-0" />
              <div>
                <h3 className="font-semibold">오프라인 지원</h3>
                <p className="text-white/80 text-sm">인터넷 없이도 기본 기능 사용</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-white rounded-full mt-2 flex-shrink-0" />
              <div>
                <h3 className="font-semibold">실시간 알림</h3>
                <p className="text-white/80 text-sm">예약 알림을 놓치지 마세요</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-white rounded-full mt-2 flex-shrink-0" />
              <div>
                <h3 className="font-semibold">전체 화면</h3>
                <p className="text-white/80 text-sm">브라우저 UI 없이 사용</p>
              </div>
            </div>
          </div>
        </div>

        {/* 도움말 링크 */}
        <div className="text-center mt-8">
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            설치에 문제가 있으신가요?
          </p>
          <a
            href="mailto:support@gameplaza.kr"
            className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium"
          >
            support@gameplaza.kr로 문의하기
            <ChevronRight className="w-4 h-4" />
          </a>
        </div>
      </div>
    </div>
  );
}