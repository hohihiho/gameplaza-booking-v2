import Database from 'better-sqlite3'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import { devices, contentPages } from './schema'

const database = new Database('./dev.db')
const db = drizzle(database)

async function seed() {
  // 기기 데이터 삽입
  const deviceData = [
    {
      id: 'device-1',
      name: 'IIDX Lightning Model - 1',
      type: 'beatmania',
      status: 'available',
      floor: 1,
      location: '1층 비트매니아 섹션',
      description: '비트매니아 IIDX 31 EPOLIS',
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: 'device-2',
      name: 'IIDX Lightning Model - 2',
      type: 'beatmania',
      status: 'available',
      floor: 1,
      location: '1층 비트매니아 섹션',
      description: '비트매니아 IIDX 31 EPOLIS',
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: 'device-3',
      name: 'Sound Voltex Valkyrie Model - 1',
      type: 'sound_voltex',
      status: 'available',
      floor: 1,
      location: '1층 SDVX 섹션',
      description: 'SOUND VOLTEX EXCEED GEAR',
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: 'device-4',
      name: 'Sound Voltex Valkyrie Model - 2',
      type: 'sound_voltex',
      status: 'in_use',
      floor: 1,
      location: '1층 SDVX 섹션',
      description: 'SOUND VOLTEX EXCEED GEAR',
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: 'device-5',
      name: '레이싱 시뮬레이터 - 1',
      type: 'racing',
      status: 'available',
      floor: 2,
      location: '2층 레이싱 섹션',
      description: 'Initial D The Arcade',
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: 'device-6',
      name: '레이싱 시뮬레이터 - 2',
      type: 'racing',
      status: 'maintenance',
      floor: 2,
      location: '2층 레이싱 섹션',
      description: 'Initial D The Arcade',
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ]

  await db.insert(devices).values(deviceData).onConflictDoNothing()

  // 약관 데이터 삽입
  const contentPagesData = [
    {
      id: 'terms-1',
      slug: 'terms_of_service',
      title: '서비스 이용약관',
      content: `
# 게임플라자 서비스 이용약관

## 제1조 (목적)
이 약관은 게임플라자에서 제공하는 예약 서비스의 이용조건 및 절차에 관한 사항과 기타 필요한 사항을 규정함을 목적으로 합니다.

## 제2조 (용어의 정의)
1. "서비스"라 함은 게임플라자에서 제공하는 기기 예약 및 관련 서비스를 의미합니다.
2. "이용자"라 함은 이 약관에 따라 서비스를 이용하는 회원을 말합니다.

## 제3조 (약관의 효력 및 변경)
1. 이 약관은 서비스를 이용하고자 하는 모든 이용자에 대하여 그 효력을 발생합니다.
2. 회사는 필요하다고 인정되는 경우 이 약관을 변경할 수 있으며, 변경된 약관은 공지사항을 통해 공지합니다.

## 제4조 (예약 및 이용)
1. 예약은 온라인을 통해서만 가능합니다.
2. 예약 시간 30분 전까지 체크인을 완료해야 합니다.
3. 노쇼 시 향후 예약에 제한이 있을 수 있습니다.
      `,
      isPublished: true,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: 'privacy-1',
      slug: 'privacy_policy',
      title: '개인정보처리방침',
      content: `
# 게임플라자 개인정보처리방침

## 1. 개인정보의 처리 목적
게임플라자는 다음의 목적을 위하여 개인정보를 처리합니다.

### 회원 가입 및 관리
- 회원 가입의사 확인, 회원제 서비스 제공에 따른 본인 식별・인증
- 회원자격 유지・관리, 서비스 부정이용 방지, 각종 고지・통지

### 예약 서비스 제공
- 예약 관리, 기기 이용 관리
- 요금 결제 및 정산

## 2. 개인정보의 처리 및 보유기간
게임플라자는 법령에 따른 개인정보 보유・이용기간 또는 정보주체로부터 개인정보를 수집 시에 동의받은 개인정보 보유・이용기간 내에서 개인정보를 처리・보유합니다.

## 3. 처리하는 개인정보의 항목
- 필수항목: 이름, 이메일, 휴대전화번호
- 선택항목: 프로필 사진

## 4. 개인정보의 제3자 제공
게임플라자는 정보주체의 동의, 법률의 특별한 규정 등 개인정보 보호법 제17조 및 제18조에 해당하는 경우에만 개인정보를 제3자에게 제공합니다.
      `,
      isPublished: true,
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ]

  await db.insert(contentPages).values(contentPagesData).onConflictDoNothing()

  console.log('✅ 시드 데이터 삽입 완료')
}

seed().catch(console.error)