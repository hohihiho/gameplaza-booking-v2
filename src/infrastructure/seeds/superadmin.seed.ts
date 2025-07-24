import { SupabaseClient } from '@supabase/supabase-js'
import { Database } from '@/src/types/supabase'
import * as bcrypt from 'bcryptjs'

/**
 * 슈퍼관리자 시드 데이터
 * 
 * 광주 게임플라자 예약 시스템의 슈퍼관리자를 초기화합니다.
 * 슈퍼관리자는 시스템의 모든 권한을 가지며, 다른 관리자를 추가/삭제할 수 있습니다.
 */
export async function seedSuperAdmins(supabase: SupabaseClient<Database>) {
  console.log('🌱 슈퍼관리자 시드 데이터 생성 시작...')

  // 슈퍼관리자 계정 정보
  const superAdmins = [
    {
      email: 'ndz5496@gmail.com',
      fullName: '슈퍼관리자1',
      phoneNumber: '010-0000-0001',
      password: 'superadmin123!' // 실제 운영 시 환경변수로 관리
    },
    {
      email: 'leejinseok94@gmail.com',
      fullName: '슈퍼관리자2',
      phoneNumber: '010-0000-0002',
      password: 'superadmin123!' // 실제 운영 시 환경변수로 관리
    }
  ]

  try {
    for (const adminData of superAdmins) {
      // 1. 이미 존재하는 사용자인지 확인
      const { data: existingUser } = await supabase
        .from('users')
        .select('id, role')
        .eq('email', adminData.email)
        .single()

      let userId: string

      if (existingUser) {
        console.log(`✅ 사용자 이미 존재: ${adminData.email}`)
        userId = existingUser.id

        // 사용자가 이미 슈퍼관리자가 아닌 경우 업데이트
        if (existingUser.role !== 'superadmin') {
          const { error: updateError } = await supabase
            .from('users')
            .update({ role: 'superadmin' })
            .eq('id', userId)

          if (updateError) {
            console.error(`❌ 사용자 역할 업데이트 실패: ${adminData.email}`, updateError)
            continue
          }
          console.log(`✅ 사용자 역할을 슈퍼관리자로 업데이트: ${adminData.email}`)
        }
      } else {
        // 2. 새 사용자 생성
        const hashedPassword = await bcrypt.hash(adminData.password, 10)
        const newUserId = `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

        const { data: newUser, error: createError } = await supabase
          .from('users')
          .insert({
            id: newUserId,
            email: adminData.email,
            fullName: adminData.fullName,
            phoneNumber: adminData.phoneNumber,
            password: hashedPassword,
            role: 'superadmin',
            isActive: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          })
          .select()
          .single()

        if (createError) {
          console.error(`❌ 사용자 생성 실패: ${adminData.email}`, createError)
          continue
        }

        userId = newUserId
        console.log(`✅ 새 사용자 생성: ${adminData.email}`)
      }

      // 3. 관리자 테이블에 슈퍼관리자 권한 추가
      const { data: existingAdmin } = await supabase
        .from('admins')
        .select('id')
        .eq('userId', userId)
        .single()

      if (!existingAdmin) {
        const adminId = `admin-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
        
        const { error: adminError } = await supabase
          .from('admins')
          .insert({
            id: adminId,
            userId: userId,
            permissions: {
              reservations: true,
              users: true,
              devices: true,
              cms: true,
              settings: true
            },
            isSuperAdmin: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          })

        if (adminError) {
          console.error(`❌ 관리자 권한 생성 실패: ${adminData.email}`, adminError)
          continue
        }

        console.log(`✅ 슈퍼관리자 권한 추가: ${adminData.email}`)
      } else {
        console.log(`✅ 관리자 권한 이미 존재: ${adminData.email}`)
      }
    }

    // 4. 슈퍼관리자 수 확인
    const { data: superAdminCount, error: countError } = await supabase
      .from('admins')
      .select('id', { count: 'exact' })
      .eq('isSuperAdmin', true)

    if (!countError && superAdminCount) {
      console.log(`✅ 총 슈퍼관리자 수: ${superAdminCount.length}명`)
    }

    console.log('🌱 슈퍼관리자 시드 데이터 생성 완료!')

  } catch (error) {
    console.error('❌ 슈퍼관리자 시드 데이터 생성 중 오류 발생:', error)
    throw error
  }
}

/**
 * 슈퍼관리자 시드 데이터 제거
 * 
 * 테스트 환경에서 시드 데이터를 정리할 때 사용합니다.
 */
export async function removeSuperAdminSeeds(supabase: SupabaseClient<Database>) {
  console.log('🧹 슈퍼관리자 시드 데이터 제거 시작...')

  const emails = ['ndz5496@gmail.com', 'leejinseok94@gmail.com']

  try {
    for (const email of emails) {
      // 1. 사용자 찾기
      const { data: user } = await supabase
        .from('users')
        .select('id')
        .eq('email', email)
        .single()

      if (user) {
        // 2. 관리자 권한 제거
        await supabase
          .from('admins')
          .delete()
          .eq('userId', user.id)

        // 3. 사용자 역할을 일반 사용자로 변경 (삭제하지 않음)
        await supabase
          .from('users')
          .update({ role: 'user' })
          .eq('id', user.id)

        console.log(`✅ 슈퍼관리자 권한 제거: ${email}`)
      }
    }

    console.log('🧹 슈퍼관리자 시드 데이터 제거 완료!')
  } catch (error) {
    console.error('❌ 슈퍼관리자 시드 데이터 제거 중 오류 발생:', error)
    throw error
  }
}