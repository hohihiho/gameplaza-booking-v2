import { NextRequest, NextResponse } from 'next/server';

// 임시로 하드코딩된 데이터 반환 (데이터베이스 마이그레이션 중)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    
    // 캐시 헤더 설정 - 30분 캐시, stale-while-revalidate 사용
    const headers = new Headers({
      'Cache-Control': 'public, max-age=1800, stale-while-revalidate=3600',
      'Content-Type': 'application/json',
    });
    
    // 임시 하드코딩된 데이터 (전체 내용)
    const privacyPolicy = {
      id: 2,
      type: 'privacy_policy',
      title: '개인정보처리방침',
      content: `<div class="prose prose-gray dark:prose-invert max-w-none">
  <h1>개인정보처리방침</h1>
  
  <p class="text-gray-600 mb-8 leading-relaxed">
    광주 게임플라자(이하 "회사")는 이용자의 개인정보를 중요시하며, 「개인정보보호법」, 「정보통신망 이용촉진 및 정보보호 등에 관한 법률」 등 관련 법령을 준수하고 있습니다.<br/>
    본 개인정보처리방침을 통해 이용자가 제공하는 개인정보가 어떠한 용도와 방식으로 이용되고 있으며, 개인정보보호를 위해 어떠한 조치가 취해지고 있는지 알려드립니다.
  </p>

  <div class="mt-12">
    <h2 class="text-2xl font-bold mb-6">제1조 (수집하는 개인정보의 항목 및 수집방법)</h2>
    
    <div class="mb-8">
      <h3 class="text-xl font-semibold mb-4">① 회원가입 시 수집항목</h3>
      
      <div class="mb-6">
        <h4 class="text-lg font-medium mb-3 text-blue-600">필수항목</h4>
        <ul class="space-y-2 ml-4">
          <li>• 이메일 주소 (Google OAuth 인증 시 자동 수집)</li>
          <li>• 이름 (Google 계정에서 제공)</li>
          <li>• 닉네임 (서비스 내 활동명)</li>
          <li>• 생년월일 (연령 확인용)</li>
          <li>• Google 계정 고유 식별자 (UID)</li>
        </ul>
      </div>
      
      <div class="mb-6">
        <h4 class="text-lg font-medium mb-3 text-blue-600">선택항목</h4>
        <ul class="space-y-2 ml-4">
          <li>• 프로필 사진 (Google 계정에서 제공 시)</li>
          <li>• 마케팅 수신 동의 여부</li>
          <li>• 선호 게임 장르</li>
        </ul>
      </div>
    </div>

    <div class="mb-8">
      <h3 class="text-xl font-semibold mb-4">② 서비스 이용 과정에서 자동 수집되는 정보</h3>
      <ul class="space-y-2 ml-4">
        <li>• 서비스 이용 기록 (예약 내역, 체크인 시간, 이용 시간)</li>
        <li>• 접속 로그 (IP 주소, 접속 시간, 접속 기기 정보)</li>
        <li>• 쿠키 (Cookie) 정보</li>
        <li>• 브라우저 종류 및 버전</li>
        <li>• 운영체제 (OS) 정보</li>
        <li>• 기기 고유 식별자 (디바이스 ID)</li>
        <li>• 위치 정보 (선택적, 동의 시)</li>
      </ul>
    </div>
  </div>

  <div class="mt-12">
    <h2 class="text-2xl font-bold mb-6">제2조 (개인정보의 수집 및 이용목적)</h2>
    
    <div class="mb-8">
      <h3 class="text-xl font-semibold mb-4">회원관리</h3>
      <ul class="space-y-2 ml-4">
        <li>• 회원제 서비스 이용에 따른 본인확인</li>
        <li>• 개인 식별 및 부정이용 방지</li>
        <li>• 가입 및 가입횟수 제한</li>
        <li>• 만 14세 미만 아동 가입 제한</li>
        <li>• 분쟁 조정을 위한 기록 보존</li>
      </ul>
    </div>
    
    <div class="mb-8">
      <h3 class="text-xl font-semibold mb-4">서비스 제공</h3>
      <ul class="space-y-2 ml-4">
        <li>• 게임기기 예약 서비스 제공</li>
        <li>• 예약 확인 및 변경 알림</li>
        <li>• 체크인/체크아웃 관리</li>
        <li>• 이용 통계 및 패턴 분석</li>
        <li>• 맞춤형 서비스 제공</li>
      </ul>
    </div>
    
    <div class="mb-8">
      <h3 class="text-xl font-semibold mb-4">서비스 개선</h3>
      <ul class="space-y-2 ml-4">
        <li>• 서비스 이용 통계 분석</li>
        <li>• 이용 패턴 분석을 통한 서비스 개선</li>
        <li>• 신규 서비스 개발을 위한 자료 활용</li>
      </ul>
    </div>
    
    <div class="mb-8">
      <h3 class="text-xl font-semibold mb-4">법적 의무 준수</h3>
      <ul class="space-y-2 ml-4">
        <li>• 관련 법령에 따른 의무 이행</li>
        <li>• 법적 분쟁 대응</li>
        <li>• 수사기관 요청 협조</li>
        <li>• 정산 및 세무 처리</li>
        <li>• 소비자 보호 의무 이행</li>
      </ul>
    </div>
  </div>

  <div class="mt-12">
    <h2 class="text-2xl font-bold mb-6">제3조 (개인정보의 보유 및 이용기간)</h2>
    
    <p class="mb-6 leading-relaxed">
      회사는 개인정보 수집 및 이용목적이 달성된 후에는 해당 정보를 지체 없이 파기합니다.<br/>
      단, 다음의 정보에 대해서는 아래의 이유로 명시한 기간 동안 보존합니다.
    </p>

    <div class="mb-8">
      <h3 class="text-xl font-semibold mb-4">① 회사 내부 방침에 의한 정보 보유</h3>
      <ul class="space-y-2 ml-4">
        <li>• <strong>회원 정보:</strong> 회원 탈퇴 후 30일 (통계 분석 및 서비스 개선)</li>
        <li>• <strong>예약 이력:</strong> 10년 (서비스 개선, 통계 분석 및 이용 기록 보존)</li>
        <li>• <strong>불량 이용 기록:</strong> 3년 (부정 이용 방지)</li>
      </ul>
      
      <div class="mt-4 p-4 bg-blue-50 rounded-lg">
        <p class="text-sm">
          <strong>※ 참고:</strong> 회원 탈퇴 후 재가입은 즉시 가능하나, 블랙리스트에 등록된 이메일의 경우 예약 서비스 이용이 제한될 수 있습니다.
        </p>
      </div>
    </div>

    <div class="mb-8">
      <h3 class="text-xl font-semibold mb-4">② 관련 법령에 의한 정보 보유</h3>
      <ul class="space-y-2 ml-4">
        <li>• <strong>웹사이트 방문 기록:</strong> 3개월 (통신비밀보호법)</li>
        <li>• <strong>본인확인 정보:</strong> 6개월 (정보통신망법)</li>
      </ul>
      
      <div class="mt-4 p-4 bg-gray-50 rounded-lg">
        <p class="text-sm">
          <strong>※ 안내:</strong> 본 서비스는 기기 예약 서비스로 별도의 결제가 발생하지 않으며, 
          고객 문의는 카카오톡 채널을 통해 관리됩니다.
        </p>
      </div>
    </div>
  </div>

  <div class="mt-12">
    <h2 class="text-2xl font-bold mb-6">제4조 (개인정보의 제3자 제공)</h2>
    
    <p class="mb-6 font-medium">회사는 이용자의 개인정보를 원칙적으로 외부에 제공하지 않습니다.</p>
    
    <p class="mb-4">다만, 아래의 경우에는 예외로 합니다:</p>
    
    <ol class="space-y-4">
      <li>
        <strong class="text-blue-600">1. 이용자의 사전 동의를 받은 경우</strong>
        <ul class="mt-2 ml-6">
          <li>• 제공받는 자, 제공 목적, 제공 항목, 보유 기간을 명시하여 동의</li>
        </ul>
      </li>
      <li>
        <strong class="text-blue-600">2. 법령의 규정에 의한 경우</strong>
        <ul class="mt-2 ml-6 space-y-1">
          <li>• 수사기관의 적법한 절차에 따른 요청</li>
          <li>• 법원의 제출 명령</li>
          <li>• 기타 관계 법령에서 정한 절차에 따른 요청</li>
        </ul>
      </li>
    </ol>
  </div>

  <div class="mt-12">
    <h2 class="text-2xl font-bold mb-6">제5조 (개인정보 처리의 위탁)</h2>
    
    <p class="mb-6">회사는 서비스 향상을 위해 다음과 같이 개인정보를 위탁하고 있습니다:</p>
    
    <div class="overflow-x-auto">
      <table class="min-w-full divide-y divide-gray-200">
        <thead class="bg-gray-50">
          <tr>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">수탁업체</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">위탁업무</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">보유기간</th>
          </tr>
        </thead>
        <tbody class="bg-white divide-y divide-gray-200">
          <tr>
            <td class="px-6 py-4 whitespace-nowrap">Google</td>
            <td class="px-6 py-4">OAuth 인증, 계정 연동</td>
            <td class="px-6 py-4">회원 탈퇴 시까지</td>
          </tr>
          <tr class="bg-gray-50">
            <td class="px-6 py-4 whitespace-nowrap">Cloudflare</td>
            <td class="px-6 py-4">데이터베이스 관리, CDN, 보안</td>
            <td class="px-6 py-4">회원 탈퇴 시까지</td>
          </tr>
          <tr>
            <td class="px-6 py-4 whitespace-nowrap">Vercel</td>
            <td class="px-6 py-4">웹 호스팅, CDN</td>
            <td class="px-6 py-4">서비스 이용 시까지</td>
          </tr>
        </tbody>
      </table>
    </div>
    
    <p class="mt-4 text-sm text-gray-600">※ 위탁업체가 변경될 경우 개인정보처리방침을 통해 고지하겠습니다.</p>
  </div>

  <div class="mt-12">
    <h2 class="text-2xl font-bold mb-6">제6조 (정보주체의 권리·의무 및 행사방법)</h2>
    
    <p class="mb-6">이용자는 개인정보주체로서 다음과 같은 권리를 행사할 수 있습니다:</p>
    
    <ol class="space-y-2 ml-4">
      <li>1. 개인정보 열람요구</li>
      <li>2. 오류 등이 있을 경우 정정 요구</li>
      <li>3. 삭제요구</li>
      <li>4. 처리정지 요구</li>
    </ol>
    
    <p class="mt-6 leading-relaxed">
      위 권리 행사는 개인정보 보호책임자에게 서면, 전자우편 등을 통하여 하실 수 있으며, 
      회사는 이에 대해 지체 없이 조치하겠습니다.
    </p>
  </div>

  <div class="mt-12">
    <h2 class="text-2xl font-bold mb-6">제7조 (개인정보의 파기)</h2>
    
    <p class="mb-6 leading-relaxed">
      회사는 개인정보 보유기간의 경과, 처리목적 달성 등 개인정보가 불필요하게 되었을 때에는 
      지체없이 해당 개인정보를 파기합니다.
    </p>
    
    <div class="mb-6">
      <h3 class="text-xl font-semibold mb-4">파기절차</h3>
      <p class="leading-relaxed">
        이용자가 입력한 정보는 목적 달성 후 별도의 DB에 옮겨져 내부 방침 및 기타 관련 법령에 따라 
        일정기간 저장된 후 혹은 즉시 파기됩니다.
      </p>
    </div>
    
    <div class="mb-6">
      <h3 class="text-xl font-semibold mb-4">파기방법</h3>
      <ul class="space-y-2 ml-4">
        <li>• 전자적 파일 형태의 정보는 기록을 재생할 수 없는 기술적 방법을 사용합니다.</li>
        <li>• 종이에 출력된 개인정보는 분쇄기로 분쇄하거나 소각을 통하여 파기합니다.</li>
      </ul>
    </div>
  </div>

  <div class="mt-12">
    <h2 class="text-2xl font-bold mb-6">제8조 (개인정보의 안전성 확보 조치)</h2>
    
    <p class="mb-6">회사는 개인정보보호법 제29조에 따라 다음과 같이 안전성 확보에 필요한 기술적/관리적 및 물리적 조치를 하고 있습니다:</p>
    
    <ol class="space-y-2 ml-4">
      <li>1. 개인정보 취급 직원의 최소화 및 교육</li>
      <li>2. 내부관리계획의 수립 및 시행</li>
      <li>3. 개인정보의 암호화</li>
      <li>4. 해킹 등에 대비한 기술적 대책</li>
      <li>5. 개인정보에 대한 접근 제한</li>
      <li>6. 접속기록의 보관 및 위변조 방지</li>
      <li>7. 문서보안을 위한 잠금장치 사용</li>
      <li>8. 비인가자에 대한 출입 통제</li>
    </ol>
  </div>

  <div class="mt-12">
    <h2 class="text-2xl font-bold mb-6">제9조 (개인정보 자동 수집 장치의 설치·운영 및 거부에 관한 사항)</h2>
    
    <p class="mb-6 leading-relaxed">
      회사는 이용자에게 개별적인 맞춤서비스를 제공하기 위해 이용정보를 저장하고 수시로 불러오는 
      '쿠키(cookie)'를 사용합니다.
    </p>
    
    <div class="mb-6">
      <h3 class="text-xl font-semibold mb-4">쿠키의 사용 목적</h3>
      <ul class="space-y-2 ml-4">
        <li>• 로그인 상태 유지</li>
        <li>• 이용자의 서비스 이용 패턴 분석</li>
        <li>• 개인 맞춤형 서비스 제공</li>
      </ul>
    </div>
    
    <div class="mb-6">
      <h3 class="text-xl font-semibold mb-4">쿠키의 설치·운영 및 거부</h3>
      <p class="leading-relaxed">
        이용자는 쿠키 설치에 대한 선택권을 가지고 있습니다. 웹브라우저 설정을 통해 쿠키를 
        허용/차단할 수 있으며, 쿠키를 거부할 경우 일부 서비스 이용에 제한이 있을 수 있습니다.
      </p>
    </div>
  </div>

  <div class="mt-12">
    <h2 class="text-2xl font-bold mb-6">제10조 (개인정보 보호책임자)</h2>
    
    <p class="mb-6 leading-relaxed">
      개인정보 처리에 관한 업무를 총괄해서 책임지고, 개인정보 처리와 관련한 정보주체의 
      불만처리 및 피해구제 등을 위하여 개인정보 보호책임자를 지정하고 있습니다.
    </p>
    
    <div class="p-6 bg-blue-50 rounded-lg">
      <h3 class="text-xl font-semibold mb-4">개인정보 보호책임자</h3>
      <ul class="space-y-2">
        <li><strong>성명:</strong> 장세희</li>
        <li><strong>이메일:</strong> ndz5496@gmail.com</li>
      </ul>
    </div>
  </div>

  <div class="mt-12">
    <h2 class="text-2xl font-bold mb-6">제11조 (개인정보처리방침의 변경)</h2>
    
    <p class="mb-6 leading-relaxed">
      이 개인정보처리방침은 2025년 9월 15일부터 적용됩니다.<br/>
      법령이나 서비스의 변경사항을 반영하기 위한 목적 등으로 개인정보처리방침을 수정할 수 있으며, 
      개정 시에는 변경사항을 서비스 화면에 팝업으로 고지할 것입니다.
    </p>
    
    <div class="p-6 bg-yellow-50 rounded-lg border-l-4 border-yellow-400">
      <p class="font-medium">
        <strong class="text-yellow-700">중요:</strong> 정보주체의 권리에 중대한 영향을 미치는 변경이 있을 경우, 
        시행 최소 7일 전에 서비스 화면을 통해 사전 고지하겠습니다.
      </p>
    </div>
  </div>

  <div class="mt-12 mb-8 pb-8 border-t pt-8">
    <p class="text-center text-gray-500">
      마지막 업데이트: 2025년 9월 15일
    </p>
  </div>
</div>`,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const termsOfService = {
      id: 1,
      type: 'terms_of_service',
      title: '이용약관',
      content: `
        <h1>이용약관<br /><span style="font-size: 1.5rem; color: #6b7280; font-weight: normal;">Terms of Service</span></h1>
        
        <p><strong>버전: 1.0</strong><br />
        <strong>시행일: 2025. 8. 15.</strong></p>
        
        <br />
        
        <h2>제1장 총칙</h2>
        
        <h3>제1조 (목적)</h3>
        <p>이 약관은 광주 게임플라자(이하 "회사")가 제공하는 게임기기 예약 서비스의 이용 조건 및 절차, 회사와 회원 간의 권리, 의무 및 책임사항을 규정함을 목적으로 합니다.</p>
      `,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    // 특정 타입이 요청된 경우
    if (type === 'privacy_policy') {
      return NextResponse.json({ data: privacyPolicy }, { headers });
    } else if (type === 'terms_of_service') {
      return NextResponse.json({ data: termsOfService }, { headers });
    }
    
    // 전체 약관 반환
    const termsMap = {
      terms_of_service: termsOfService,
      privacy_policy: privacyPolicy
    };
    
    return NextResponse.json({ data: termsMap }, { headers });
    
  } catch (error) {
    console.error('약관 API 오류:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}