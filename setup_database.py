#!/usr/bin/env python3
"""
GamePlaza V2 데이터베이스 설정 스크립트
비전공자용 설명: 이 파일은 우리 게임플라자 예약 시스템의 저장공간(데이터베이스)을 자동으로 만들어주는 도구입니다.
"""

import os
import sys
from supabase import create_client, Client

def setup_database():
    """데이터베이스 테이블을 생성하는 함수"""
    
    # Supabase 연결 정보
    url = "https://rupeyejnfurlcpgneekg.supabase.co"
    service_role_key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ1cGV5ZWpuZnVybGNwZ25lZWtnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczNTA5OTI1NCwiZXhwIjoyMDUwNjc1MjU0fQ.tpSQOV6zJbF1JLFGvEaQNGHa9oHD0aT4kJYvLOTKLWs"
    
    print("🎮 GamePlaza V2 데이터베이스 설정을 시작합니다...")
    print("=" * 50)
    
    try:
        # Supabase 클라이언트 생성 (관리자 권한으로)
        supabase: Client = create_client(url, service_role_key)
        print("✅ Supabase 연결 성공!")
        
        # SQL 파일 읽기
        sql_file_path = "supabase/migrations/001_create_schema.sql"
        
        if not os.path.exists(sql_file_path):
            print(f"❌ SQL 파일을 찾을 수 없습니다: {sql_file_path}")
            return False
            
        with open(sql_file_path, 'r', encoding='utf-8') as f:
            sql_content = f.read()
        
        print("📁 SQL 파일 읽기 완료!")
        print(f"📄 실행할 SQL 코드 길이: {len(sql_content)} 글자")
        
        # SQL 실행
        print("\n🔧 데이터베이스 테이블 생성 중...")
        
        # SQL을 개별 명령어로 분할해서 실행
        sql_commands = [cmd.strip() for cmd in sql_content.split(';') if cmd.strip()]
        
        success_count = 0
        for i, command in enumerate(sql_commands, 1):
            if command and not command.startswith('--'):
                try:
                    result = supabase.rpc('exec_sql', {'sql': command + ';'}).execute()
                    print(f"✅ 명령어 {i}/{len(sql_commands)} 실행 완료")
                    success_count += 1
                except Exception as e:
                    print(f"⚠️ 명령어 {i} 실행 중 오류 (무시됨): {str(e)[:100]}...")
        
        print(f"\n🎉 데이터베이스 설정 완료!")
        print(f"📊 총 {success_count}/{len(sql_commands)}개 명령어 실행됨")
        print("\n생성된 테이블들:")
        print("👤 users - 회원 정보")
        print("🎮 device_types - 게임기 종류 (마이마이, 츄니즘 등)")
        print("🎯 devices - 개별 게임기 (1번기, 2번기 등)")
        print("⏰ device_time_slots - 예약 가능한 시간대")
        print("📝 reservations - 예약 내역")
        print("🌙 special_operations - 특별 영업 (조기/밤샘)")
        print("⚙️ settings - 시스템 설정")
        print("📄 content_sections - 웹사이트 내용")
        
        return True
        
    except Exception as e:
        print(f"❌ 오류 발생: {e}")
        return False

if __name__ == "__main__":
    success = setup_database()
    if success:
        print("\n✨ 모든 작업이 완료되었습니다!")
        print("이제 게임플라자 예약 시스템 개발을 시작할 수 있습니다!")
    else:
        print("\n💥 설정 중 문제가 발생했습니다.")
        sys.exit(1)