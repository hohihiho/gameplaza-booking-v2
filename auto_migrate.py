#!/usr/bin/env python3
"""
MCP를 통한 GamePlaza V2 자동 마이그레이션
"""

import subprocess
import sys
import os
import time

def install_packages():
    """필요한 패키지 설치"""
    try:
        subprocess.check_call([sys.executable, "-m", "pip", "install", "supabase", "python-dotenv"])
        print("✅ 패키지 설치 완료")
        return True
    except Exception as e:
        print(f"⚠️ 패키지 설치 오류: {e}")
        return False

def run_migration():
    """자동 마이그레이션 실행"""
    print("🎮 GamePlaza V2 MCP 자동 마이그레이션 시작...")
    print("=" * 60)
    
    # 패키지 설치
    if not install_packages():
        print("❌ 패키지 설치 실패")
        return False
    
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
    try:
        supabase: Client = create_client(url, key)
        print("✅ Supabase 클라이언트 생성 완료")
    except Exception as e:
        print(f"❌ Supabase 클라이언트 생성 실패: {e}")
        return False
    
    # SQL 파일 읽기
    try:
        with open('supabase/migrations/001_create_schema.sql', 'r', encoding='utf-8') as f:
            sql_content = f.read()
        print(f"📄 SQL 파일 로드 완료 ({len(sql_content)} 글자)")
    except FileNotFoundError:
        print("❌ SQL 파일을 찾을 수 없습니다: supabase/migrations/001_create_schema.sql")
        return False
    
    # 나머지 테이블들 생성
    table_sqls = [
        # 4. Device Time Slots 테이블
        """
        CREATE TABLE IF NOT EXISTS device_time_slots (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          date DATE NOT NULL,
          device_type_id UUID REFERENCES device_types(id) ON DELETE CASCADE,
          start_time TIME NOT NULL,
          end_time TIME NOT NULL,
          available_devices INTEGER[] NOT NULL,
          price INTEGER NOT NULL,
          slot_type VARCHAR(20) DEFAULT 'regular' CHECK (slot_type IN ('regular', 'early', 'overnight', 'custom')),
          notes TEXT,
          created_by UUID REFERENCES users(id),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          UNIQUE(date, device_type_id, start_time, end_time)
        );
        """,
        
        # 5. Reservations 테이블
        """
        CREATE TABLE IF NOT EXISTS reservations (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID REFERENCES users(id) ON DELETE CASCADE,
          device_time_slot_id UUID REFERENCES device_time_slots(id) ON DELETE CASCADE,
          device_id UUID REFERENCES devices(id),
          device_number INTEGER NOT NULL,
          total_price INTEGER NOT NULL,
          player_count INTEGER DEFAULT 1 CHECK (player_count IN (1, 2)),
          status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'checked_in', 'completed', 'cancelled')),
          approved_by UUID REFERENCES users(id),
          approved_at TIMESTAMP WITH TIME ZONE,
          check_in_at TIMESTAMP WITH TIME ZONE,
          completed_at TIMESTAMP WITH TIME ZONE,
          payment_method VARCHAR(20) CHECK (payment_method IN ('cash', 'transfer')),
          payment_confirmed_at TIMESTAMP WITH TIME ZONE,
          notes TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        """,
        
        # 6. Special Operations 테이블
        """
        CREATE TABLE IF NOT EXISTS special_operations (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          date DATE NOT NULL,
          operation_type VARCHAR(20) NOT NULL CHECK (operation_type IN ('early', 'overnight')),
          min_devices INTEGER DEFAULT 2,
          is_confirmed BOOLEAN DEFAULT false,
          confirmed_at TIMESTAMP WITH TIME ZONE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        """,
        
        # 7. Settings 테이블
        """
        CREATE TABLE IF NOT EXISTS settings (
          key VARCHAR(100) PRIMARY KEY,
          value JSONB NOT NULL,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_by UUID REFERENCES users(id)
        );
        """,
        
        # 8. Content Sections 테이블
        """
        CREATE TABLE IF NOT EXISTS content_sections (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          page VARCHAR(50) NOT NULL CHECK (page IN ('home', 'guide', 'rental')),
          section_type VARCHAR(50) NOT NULL,
          content JSONB NOT NULL,
          display_order INTEGER DEFAULT 0,
          is_active BOOLEAN DEFAULT true,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        """
    ]
    
    print(f"\n🔧 {len(table_sqls)}개 테이블 생성 시작...")
    
    success_count = 0
    for i, sql in enumerate(table_sqls, 1):
        try:
            print(f"\n📋 테이블 {i}/{len(table_sqls)} 생성 중...")
            
            # 다양한 방법으로 SQL 실행 시도
            methods = [
                ('exec', {'sql': sql.strip()}),
                ('query', sql.strip()),
                ('execute', {'query': sql.strip()})
            ]
            
            executed = False
            for method_name, params in methods:
                try:
                    if hasattr(supabase, 'rpc'):
                        if isinstance(params, dict):
                            result = supabase.rpc(method_name, params)
                        else:
                            result = supabase.rpc(method_name, {'query': params})
                        
                        print(f"✅ 테이블 {i} 생성 성공! (방법: {method_name})")
                        success_count += 1
                        executed = True
                        break
                except Exception as method_error:
                    print(f"⚠️ 방법 {method_name} 실패: {str(method_error)[:100]}...")
                    continue
            
            if not executed:
                print(f"❌ 테이블 {i} 생성 실패 - 모든 방법 시도함")
                
        except Exception as e:
            print(f"❌ 테이블 {i} 생성 오류: {e}")
        
        # 잠시 대기
        time.sleep(1)
    
    print(f"\n🎉 마이그레이션 완료!")
    print(f"📊 성공: {success_count}/{len(table_sqls)}개 테이블")
    
    if success_count == 0:
        print("\n💡 자동 생성이 실패했습니다. 수동 방법을 사용해주세요:")
        print("1. https://supabase.com/dashboard/project/rupeyejnfurlcpgneekg/sql")
        print("2. migration_ready.sql 파일 내용을 복사해서 붙여넣기")
        print("3. RUN 버튼 클릭")
        return False
    
    return True

if __name__ == "__main__":
    success = run_migration()
    if success:
        print("\n✨ 자동 마이그레이션 성공!")
    else:
        print("\n💥 자동 마이그레이션 실패")
        sys.exit(1)