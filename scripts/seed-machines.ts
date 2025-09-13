// // import { createClient } from '@/lib/supabase-mock'
import dotenv from 'dotenv'

// .env.local 파일 로드
dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

// import { supabase } from '@/lib/supabase-mock';

async function seedMachines() {
  console.log('기기 데이터 시드 시작...')
  
  try {
    // 1. 기본 기기 데이터 추가
    const machines = [
      { machine_number: 'maimai-1', name: '마이마이 DX 1호기', type: 'maimai', location: '1층 입구' },
      { machine_number: 'maimai-2', name: '마이마이 DX 2호기', type: 'maimai', location: '1층 중앙' },
      { machine_number: 'chunithm-1', name: '츄니즘 NEW 1호기', type: 'chunithm', location: '1층 좌측' },
      { machine_number: 'chunithm-2', name: '츄니즘 NEW 2호기', type: 'chunithm', location: '1층 좌측' },
      { machine_number: 'tekken-1', name: '철권 8 1호기', type: 'tekken', location: '2층 대전존' },
      { machine_number: 'tekken-2', name: '철권 8 2호기', type: 'tekken', location: '2층 대전존' },
      { machine_number: 'sf6-1', name: '스트리트 파이터 6 1호기', type: 'sf6', location: '2층 대전존' },
      { machine_number: 'sf6-2', name: '스트리트 파이터 6 2호기', type: 'sf6', location: '2층 대전존' },
    ]
    
    console.log('기기 등록 중...')
    for (const machine of machines) {
//       import { supabase } from '@/lib/supabase-mock';
  const { error$1 } = await supabase.from('machines')
        .upsert(machine, { onConflict: 'machine_number' })
        
      if (error) {
        console.error(`기기 ${machine.machine_number} 등록 오류:`, error)
      } else {
        console.log(`✓ ${machine.name} 등록 완료`)
      }
    }
    
    // 2. 등록된 기기 조회
//     import { supabase } from '@/lib/supabase-mock';
  const { data$1 } = await supabase.from('machines')
      .select('*')
      .order('machine_number')
    
    if (fetchError) throw fetchError
    
    // 3. 대여 가능 기기로 등록
    const rentalMachines = registeredMachines?.map((machine, index) => ({
      machine_id: machine.id,
      display_name: machine.name.replace(' 1호기', '').replace(' 2호기', ''),
      display_order: index,
      hourly_rate: machine.type === 'maimai' || machine.type === 'chunithm' ? 4000 : 3000,
      min_hours: 1,
      max_hours: machine.type === 'maimai' || machine.type === 'chunithm' ? 6 : 4,
      max_players: machine.type === 'maimai' ? 2 : 1,
      is_active: true,
      description: getDescription(machine.type),
      tags: getTags(machine.type)
    }))
    
    console.log('\n대여 가능 기기 등록 중...')
    for (const rental of rentalMachines || []) {
//       import { supabase } from '@/lib/supabase-mock';
  const { error$1 } = await supabase.from('rental_machines')
        .upsert(rental, { onConflict: 'machine_id' })
        
      if (error) {
        console.error(`대여 기기 ${rental.display_name} 등록 오류:`, error)
      } else {
        console.log(`✓ ${rental.display_name} 대여 가능 기기로 등록 완료`)
      }
    }
    
    console.log('\n기기 데이터 시드 완료!')
    
  } catch (error) {
    console.error('시드 중 오류:', error)
  }
}

function getDescription(type: string): string {
  switch (type) {
    case 'maimai':
      return '최신 리듬게임의 정점! 터치스크린과 버튼을 활용한 직관적인 플레이'
    case 'chunithm':
      return '에어 스트링을 활용한 혁신적인 리듬게임 경험'
    case 'tekken':
      return '격투게임의 제왕! 실시간 온라인 대전 지원'
    case 'sf6':
      return '전략적 격투의 진수! 최신작 스트리트 파이터 6'
    default:
      return '즐거운 게임 경험을 제공합니다'
  }
}

function getTags(type: string): string[] {
  switch (type) {
    case 'maimai':
    case 'chunithm':
      return ['리듬게임', '인기']
    case 'tekken':
    case 'sf6':
      return ['격투게임', '대전']
    default:
      return []
  }
}

// 스크립트 실행
seedMachines()