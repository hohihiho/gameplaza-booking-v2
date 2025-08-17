-- 개발 DB와 동일한 기기 관련 테이블들을 운영 DB에 생성/수정하는 스크립트

-- 1. device_types 테이블 생성/수정
CREATE TABLE IF NOT EXISTS device_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_id UUID,
    name TEXT NOT NULL,
    description TEXT,
    is_rentable BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    rental_settings JSONB,
    display_order INTEGER,
    model_name TEXT,
    version_name TEXT,
    play_modes JSONB
);

-- device_types 테이블에 누락된 컬럼들 추가
DO $$ 
BEGIN
    -- is_rentable 컬럼 추가
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'device_types' AND column_name = 'is_rentable') THEN
        ALTER TABLE device_types ADD COLUMN is_rentable BOOLEAN DEFAULT true;
    END IF;
    
    -- rental_settings 컬럼 추가
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'device_types' AND column_name = 'rental_settings') THEN
        ALTER TABLE device_types ADD COLUMN rental_settings JSONB;
    END IF;
    
    -- display_order 컬럼 추가
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'device_types' AND column_name = 'display_order') THEN
        ALTER TABLE device_types ADD COLUMN display_order INTEGER;
    END IF;
    
    -- model_name 컬럼 추가
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'device_types' AND column_name = 'model_name') THEN
        ALTER TABLE device_types ADD COLUMN model_name TEXT;
    END IF;
    
    -- version_name 컬럼 추가
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'device_types' AND column_name = 'version_name') THEN
        ALTER TABLE device_types ADD COLUMN version_name TEXT;
    END IF;
    
    -- play_modes 컬럼 추가
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'device_types' AND column_name = 'play_modes') THEN
        ALTER TABLE device_types ADD COLUMN play_modes JSONB;
    END IF;
    
    -- category_id 컬럼 추가
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'device_types' AND column_name = 'category_id') THEN
        ALTER TABLE device_types ADD COLUMN category_id UUID;
    END IF;
END $$;

-- 2. devices 테이블 생성/수정
CREATE TABLE IF NOT EXISTS devices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    device_type_id UUID REFERENCES device_types(id),
    device_number INTEGER NOT NULL,
    status TEXT DEFAULT 'available',
    notes TEXT,
    last_maintenance TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- devices 테이블에 누락된 컬럼들 추가
DO $$ 
BEGIN
    -- 기존 컬럼들이 있는지 확인하고 없으면 추가
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'devices' AND column_name = 'device_type_id') THEN
        ALTER TABLE devices ADD COLUMN device_type_id UUID REFERENCES device_types(id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'devices' AND column_name = 'device_number') THEN
        ALTER TABLE devices ADD COLUMN device_number INTEGER NOT NULL;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'devices' AND column_name = 'status') THEN
        ALTER TABLE devices ADD COLUMN status TEXT DEFAULT 'available';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'devices' AND column_name = 'notes') THEN
        ALTER TABLE devices ADD COLUMN notes TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'devices' AND column_name = 'last_maintenance') THEN
        ALTER TABLE devices ADD COLUMN last_maintenance TIMESTAMPTZ;
    END IF;
END $$;

-- 3. rental_time_slots 테이블 생성/수정
CREATE TABLE IF NOT EXISTS rental_time_slots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    device_type_id UUID REFERENCES device_types(id),
    slot_type TEXT,
    start_time TIME,
    end_time TIME,
    credit_options JSONB,
    enable_2p BOOLEAN DEFAULT false,
    price_2p_extra INTEGER,
    is_youth_time BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- rental_time_slots 테이블에 누락된 컬럼들 추가
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'rental_time_slots' AND column_name = 'device_type_id') THEN
        ALTER TABLE rental_time_slots ADD COLUMN device_type_id UUID REFERENCES device_types(id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'rental_time_slots' AND column_name = 'slot_type') THEN
        ALTER TABLE rental_time_slots ADD COLUMN slot_type TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'rental_time_slots' AND column_name = 'start_time') THEN
        ALTER TABLE rental_time_slots ADD COLUMN start_time TIME;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'rental_time_slots' AND column_name = 'end_time') THEN
        ALTER TABLE rental_time_slots ADD COLUMN end_time TIME;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'rental_time_slots' AND column_name = 'credit_options') THEN
        ALTER TABLE rental_time_slots ADD COLUMN credit_options JSONB;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'rental_time_slots' AND column_name = 'enable_2p') THEN
        ALTER TABLE rental_time_slots ADD COLUMN enable_2p BOOLEAN DEFAULT false;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'rental_time_slots' AND column_name = 'price_2p_extra') THEN
        ALTER TABLE rental_time_slots ADD COLUMN price_2p_extra INTEGER;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'rental_time_slots' AND column_name = 'is_youth_time') THEN
        ALTER TABLE rental_time_slots ADD COLUMN is_youth_time BOOLEAN DEFAULT false;
    END IF;
END $$;

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_devices_device_type_id ON devices(device_type_id);
CREATE INDEX IF NOT EXISTS idx_devices_status ON devices(status);
CREATE INDEX IF NOT EXISTS idx_rental_time_slots_device_type_id ON rental_time_slots(device_type_id);
CREATE INDEX IF NOT EXISTS idx_rental_time_slots_slot_type ON rental_time_slots(slot_type);

-- updated_at 자동 업데이트 트리거 함수
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 트리거 생성
DROP TRIGGER IF EXISTS update_device_types_updated_at ON device_types;
CREATE TRIGGER update_device_types_updated_at BEFORE UPDATE ON device_types FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_devices_updated_at ON devices;
CREATE TRIGGER update_devices_updated_at BEFORE UPDATE ON devices FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_rental_time_slots_updated_at ON rental_time_slots;
CREATE TRIGGER update_rental_time_slots_updated_at BEFORE UPDATE ON rental_time_slots FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();