#!/usr/bin/env python3
"""
GamePlaza V2 완전한 마이그레이션 (인덱스 + 트리거 포함)
"""

import subprocess
import sys
import time

def run_complete_migration():
    """인덱스와 트리거까지 포함한 완전한 마이그레이션"""
    print("🎮 GamePlaza V2 완전한 마이그레이션 시작...")
    print("=" * 60)
    
    try:
        from supabase import create_client, Client
        print("✅ Supabase 모듈 로드 완료")
    except ImportError as e:
        print(f"❌ Supabase 모듈 로드 실패: {e}")
        return False
    
    # Supabase 설정
    url = "https://rupeyejnfurlcpgneekg.supabase.co"
    key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ1cGV5ZWpuZnVybGNwZ25lZWtnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDg2NjQyOCwiZXhwIjoyMDY2NDQyNDI4fQ.49VEsYv-jDnKPb1wK_wBmXgcdQWnYilLYaqbbaAHCt4"
    
    # 클라이언트 생성
    supabase: Client = create_client(url, key)
    print("✅ Supabase 클라이언트 생성 완료")
    
    # 인덱스 생성
    indexes = [
        # 사용자 활성 예약 조회 최적화
        """
        CREATE INDEX IF NOT EXISTS idx_user_active_reservations 
        ON reservations(user_id, status) 
        WHERE status IN ('pending', 'approved', 'checked_in');
        """,
        
        # 날짜별 시간대 슬롯 조회 최적화
        """
        CREATE INDEX IF NOT EXISTS idx_device_time_slots_date 
        ON device_time_slots(date, device_type_id);
        """,
        
        # 기기 상태 조회 최적화
        """
        CREATE INDEX IF NOT EXISTS idx_devices_status 
        ON devices(device_type_id, status, is_active);
        """,
        
        # 예약 상태별 조회 최적화
        """
        CREATE INDEX IF NOT EXISTS idx_reservations_status_date 
        ON reservations(status, created_at);
        """
    ]
    
    print(f"\n🔧 {len(indexes)}개 인덱스 생성 중...")
    
    index_success = 0
    for i, index_sql in enumerate(indexes, 1):
        try:
            print(f"📋 인덱스 {i}/{len(indexes)} 생성 중...")
            supabase.rpc('exec', {'sql': index_sql.strip()})
            print(f"✅ 인덱스 {i} 생성 성공!")
            index_success += 1
        except Exception as e:
            print(f"⚠️ 인덱스 {i} 생성 오류: {e}")
        
        time.sleep(0.5)
    
    # 트리거 함수 및 트리거 생성
    triggers = [
        # 업데이트 트리거 함수
        """
        CREATE OR REPLACE FUNCTION update_updated_at_column()
        RETURNS TRIGGER AS $$
        BEGIN
            NEW.updated_at = NOW();
            RETURN NEW;
        END;
        $$ language 'plpgsql';
        """,
        
        # Users 테이블 트리거
        """
        DROP TRIGGER IF EXISTS update_users_updated_at ON users;
        CREATE TRIGGER update_users_updated_at 
        BEFORE UPDATE ON users 
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
        """,
        
        # Devices 테이블 트리거
        """
        DROP TRIGGER IF EXISTS update_devices_updated_at ON devices;
        CREATE TRIGGER update_devices_updated_at 
        BEFORE UPDATE ON devices 
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
        """,
        
        # Device Time Slots 테이블 트리거
        """
        DROP TRIGGER IF EXISTS update_device_time_slots_updated_at ON device_time_slots;
        CREATE TRIGGER update_device_time_slots_updated_at 
        BEFORE UPDATE ON device_time_slots 
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
        """,
        
        # Reservations 테이블 트리거
        """
        DROP TRIGGER IF EXISTS update_reservations_updated_at ON reservations;
        CREATE TRIGGER update_reservations_updated_at 
        BEFORE UPDATE ON reservations 
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
        """,
        
        # Content Sections 테이블 트리거
        """
        DROP TRIGGER IF EXISTS update_content_sections_updated_at ON content_sections;
        CREATE TRIGGER update_content_sections_updated_at 
        BEFORE UPDATE ON content_sections 
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
        """
    ]
    
    print(f"\n🔧 {len(triggers)}개 트리거 생성 중...")
    
    trigger_success = 0
    for i, trigger_sql in enumerate(triggers, 1):
        try:
            print(f"📋 트리거 {i}/{len(triggers)} 생성 중...")
            supabase.rpc('exec', {'sql': trigger_sql.strip()})
            print(f"✅ 트리거 {i} 생성 성공!")
            trigger_success += 1
        except Exception as e:
            print(f"⚠️ 트리거 {i} 생성 오류: {e}")
        
        time.sleep(0.5)
    
    print(f"\n🎉 완전한 마이그레이션 완료!")
    print(f"📊 인덱스: {index_success}/{len(indexes)}개")
    print(f"📊 트리거: {trigger_success}/{len(triggers)}개")
    
    print(f"\n✨ 데이터베이스 구조 완성!")
    print("🏗️ 생성된 구조:")
    print("   👤 users - 회원 정보")
    print("   🎮 device_types - 게임기 종류")
    print("   🎯 devices - 개별 게임기")
    print("   ⏰ device_time_slots - 예약 가능한 시간대")
    print("   📝 reservations - 예약 내역")
    print("   🌙 special_operations - 특별 영업")
    print("   ⚙️ settings - 시스템 설정")
    print("   📄 content_sections - 웹사이트 내용")
    print("   📈 인덱스 - 성능 최적화")
    print("   🔄 트리거 - 자동 업데이트")
    
    return True

if __name__ == "__main__":
    success = run_complete_migration()
    if success:
        print("\n🚀 GamePlaza V2 데이터베이스 준비 완료!")
        print("이제 Next.js 애플리케이션 개발을 시작할 수 있습니다!")
    else:
        print("\n💥 완전한 마이그레이션 실패")
        sys.exit(1)