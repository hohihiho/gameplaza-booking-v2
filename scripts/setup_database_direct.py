#!/usr/bin/env python3
"""
GamePlaza V2 데이터베이스 직접 설정 스크립트
비전공자용 설명: PostgreSQL 데이터베이스에 직접 연결해서 테이블을 만드는 도구입니다.
"""

import psycopg2
import os

def setup_database():
    """PostgreSQL에 직접 연결해서 데이터베이스 테이블을 생성하는 함수"""
    
    # 데이터베이스 연결 정보
    connection_string = "postgresql://postgres:tpgml12%40%40@db.rupeyejnfurlcpgneekg.supabase.co:5432/postgres"
    
    print("🎮 GamePlaza V2 데이터베이스 직접 설정을 시작합니다...")
    print("=" * 60)
    
    try:
        # PostgreSQL 연결
        print("🔌 PostgreSQL 데이터베이스에 연결 중...")
        conn = psycopg2.connect(connection_string)
        cursor = conn.cursor()
        print("✅ 데이터베이스 연결 성공!")
        
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
        
        # 전체 SQL을 한번에 실행
        cursor.execute(sql_content)
        conn.commit()
        
        print("✅ 모든 SQL 명령어 실행 완료!")
        
        # 생성된 테이블 확인
        print("\n📋 생성된 테이블 목록 확인 중...")
        cursor.execute("""
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            ORDER BY table_name;
        """)
        
        tables = cursor.fetchall()
        print(f"✅ 총 {len(tables)}개 테이블 생성됨:")
        
        table_descriptions = {
            'users': '👤 회원 정보 (이름, 이메일, 전화번호 등)',
            'device_types': '🎮 게임기 종류 (마이마이, 츄니즘, 발키리, 라이트닝)',
            'devices': '🎯 개별 게임기 (1번기, 2번기, 3번기 등)',
            'device_time_slots': '⏰ 예약 가능한 시간대 (07:00~12:00, 08:00~12:00 등)',
            'reservations': '📝 예약 내역 (누가, 언제, 어떤 기기)',
            'special_operations': '🌙 특별 영업 (조기개장, 밤샘영업)',
            'settings': '⚙️ 시스템 설정 (가격, 운영시간 등)',
            'content_sections': '📄 웹사이트 내용 (공지사항, 이용안내 등)'
        }
        
        for table in tables:
            table_name = table[0]
            description = table_descriptions.get(table_name, '📦 기타 테이블')
            print(f"  • {table_name}: {description}")
        
        # 연결 종료
        cursor.close()
        conn.close()
        
        print(f"\n🎉 데이터베이스 설정 완료!")
        print("이제 게임플라자 예약 시스템 개발을 시작할 수 있습니다!")
        
        return True
        
    except Exception as e:
        print(f"❌ 오류 발생: {e}")
        return False

if __name__ == "__main__":
    success = setup_database()
    if success:
        print("\n✨ 모든 작업이 완료되었습니다!")
    else:
        print("\n💥 설정 중 문제가 발생했습니다.")