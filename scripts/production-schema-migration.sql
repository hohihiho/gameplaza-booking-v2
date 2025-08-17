-- 운영 DB를 개발 DB와 완전히 동일한 스키마로 만드는 마이그레이션 스크립트
-- 실행 순서: 테이블 생성 → 인덱스 → 외래키 제약조건 → 함수 → 트리거 → RLS

-- =======================
-- 1. 누락된 테이블 생성
-- =======================

-- 1.1 admin_logs 테이블
CREATE TABLE IF NOT EXISTS public.admin_logs (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    admin_id uuid,
    action varchar(100) NOT NULL,
    target_type varchar(50),
    target_id uuid,
    details jsonb,
    ip_address inet,
    user_agent text,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT admin_logs_pkey PRIMARY KEY (id)
);

-- 1.2 bank_qr_codes 테이블
CREATE TABLE IF NOT EXISTS public.bank_qr_codes (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now(),
    bank_name varchar(50) NOT NULL,
    description text,
    qr_image_url text NOT NULL,
    qr_image_path text NOT NULL,
    is_active boolean NOT NULL DEFAULT true,
    sort_order integer NOT NULL DEFAULT 0,
    CONSTRAINT bank_qr_codes_pkey PRIMARY KEY (id)
);

-- 1.3 banned_words 테이블
CREATE SEQUENCE IF NOT EXISTS public.banned_words_id_seq;
CREATE TABLE IF NOT EXISTS public.banned_words (
    id integer NOT NULL DEFAULT nextval('banned_words_id_seq'::regclass),
    word text NOT NULL,
    severity integer NOT NULL DEFAULT 1,
    category text,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT banned_words_pkey PRIMARY KEY (id)
);

-- 1.4 content_pages 테이블
CREATE TABLE IF NOT EXISTS public.content_pages (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    slug varchar(100) NOT NULL,
    title varchar(200) NOT NULL,
    content jsonb NOT NULL,
    meta_description text,
    is_published boolean DEFAULT false,
    published_at timestamp with time zone,
    view_count integer DEFAULT 0,
    created_by uuid,
    updated_by uuid,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT content_pages_pkey PRIMARY KEY (id)
);

-- 1.5 device_categories 테이블 (중요 - 기기 관리)
CREATE TABLE IF NOT EXISTS public.device_categories (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    name varchar(100) NOT NULL,
    display_order integer NOT NULL DEFAULT 0,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT device_categories_pkey PRIMARY KEY (id)
);

-- 1.6 guide_content 테이블
CREATE TABLE IF NOT EXISTS public.guide_content (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    page_slug text NOT NULL,
    content jsonb NOT NULL DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT guide_content_pkey PRIMARY KEY (id)
);

-- 1.7 holidays 테이블
CREATE TABLE IF NOT EXISTS public.holidays (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    name text NOT NULL,
    date date NOT NULL,
    type varchar(20) NOT NULL,
    is_red_day boolean DEFAULT true,
    year integer NOT NULL,
    source varchar(20) DEFAULT 'manual'::character varying,
    last_synced_at timestamp with time zone DEFAULT now(),
    created_by uuid,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT holidays_pkey PRIMARY KEY (id)
);

-- 1.8 machine_rules 테이블
CREATE TABLE IF NOT EXISTS public.machine_rules (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    content text NOT NULL,
    is_active boolean DEFAULT true,
    display_order integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT machine_rules_pkey PRIMARY KEY (id)
);

-- 1.9 machines 테이블
CREATE TABLE IF NOT EXISTS public.machines (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    machine_number varchar(50) NOT NULL,
    name varchar(100) NOT NULL,
    type varchar(50) NOT NULL,
    status varchar(20) DEFAULT 'active'::character varying,
    purchase_date date,
    last_maintenance_date date,
    location varchar(100),
    notes text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT machines_pkey PRIMARY KEY (id)
);

-- 1.10 notifications 테이블
CREATE TABLE IF NOT EXISTS public.notifications (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    user_id uuid,
    type varchar(50) NOT NULL,
    title varchar(200) NOT NULL,
    message text NOT NULL,
    data jsonb,
    is_read boolean DEFAULT false,
    read_at timestamp with time zone,
    sent_at timestamp with time zone DEFAULT now(),
    CONSTRAINT notifications_pkey PRIMARY KEY (id)
);

-- 1.11 payment_accounts 테이블
CREATE TABLE IF NOT EXISTS public.payment_accounts (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    bank_name varchar(50) NOT NULL,
    account_number varchar(50) NOT NULL,
    account_holder varchar(50) NOT NULL,
    is_primary boolean DEFAULT false,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT payment_accounts_pkey PRIMARY KEY (id)
);

-- 1.12 play_modes 테이블
CREATE TABLE IF NOT EXISTS public.play_modes (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    device_type_id uuid NOT NULL,
    name varchar(50) NOT NULL,
    price integer NOT NULL DEFAULT 0,
    display_order integer NOT NULL DEFAULT 0,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT play_modes_pkey PRIMARY KEY (id)
);

-- 1.13 push_message_templates 테이블
CREATE TABLE IF NOT EXISTS public.push_message_templates (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now(),
    template_key varchar(50) NOT NULL,
    title varchar(100) NOT NULL,
    body text NOT NULL,
    is_active boolean NOT NULL DEFAULT true,
    description text,
    variables jsonb,
    CONSTRAINT push_message_templates_pkey PRIMARY KEY (id)
);

-- 1.14 push_subscriptions 테이블
CREATE TABLE IF NOT EXISTS public.push_subscriptions (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now(),
    user_email text NOT NULL,
    endpoint text NOT NULL,
    p256dh text,
    auth text,
    user_agent text,
    enabled boolean NOT NULL DEFAULT true,
    CONSTRAINT push_subscriptions_pkey PRIMARY KEY (id)
);

-- 1.15 rental_machines 테이블
CREATE TABLE IF NOT EXISTS public.rental_machines (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    machine_id uuid,
    display_name varchar(100) NOT NULL,
    display_order integer DEFAULT 0,
    hourly_rate integer NOT NULL,
    min_hours integer DEFAULT 1,
    max_hours integer DEFAULT 6,
    max_players integer DEFAULT 1,
    is_active boolean DEFAULT true,
    description text,
    image_url text,
    tags text[],
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT rental_machines_pkey PRIMARY KEY (id)
);

-- 1.16 rental_settings 테이블
CREATE TABLE IF NOT EXISTS public.rental_settings (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    device_type_id uuid NOT NULL,
    max_rental_units integer,
    min_rental_hours integer NOT NULL DEFAULT 1,
    max_rental_hours integer NOT NULL DEFAULT 24,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT rental_settings_pkey PRIMARY KEY (id)
);

-- 1.17 rental_time_slots 테이블 (중요 - 대여기기관리)
CREATE TABLE IF NOT EXISTS public.rental_time_slots (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    device_type_id uuid NOT NULL,
    slot_type text NOT NULL,
    start_time time without time zone NOT NULL,
    end_time time without time zone NOT NULL,
    credit_options jsonb NOT NULL DEFAULT '[]'::jsonb,
    enable_2p boolean NOT NULL DEFAULT false,
    price_2p_extra integer,
    is_youth_time boolean NOT NULL DEFAULT false,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT rental_time_slots_pkey PRIMARY KEY (id)
);

-- 1.18 reservation_completion_schedule 테이블
CREATE TABLE IF NOT EXISTS public.reservation_completion_schedule (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    reservation_id uuid,
    scheduled_at timestamp with time zone NOT NULL,
    processed boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT reservation_completion_schedule_pkey PRIMARY KEY (id)
);

-- 1.19 reservation_rules 테이블
CREATE TABLE IF NOT EXISTS public.reservation_rules (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    content text NOT NULL,
    is_active boolean DEFAULT true,
    display_order integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT reservation_rules_pkey PRIMARY KEY (id)
);

-- 1.20 schedule 테이블
CREATE TABLE IF NOT EXISTS public.schedule (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    date date NOT NULL,
    type varchar(50) NOT NULL,
    start_time time without time zone NOT NULL,
    end_time time without time zone NOT NULL,
    is_overnight boolean DEFAULT false,
    description text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT schedule_pkey PRIMARY KEY (id)
);

-- 1.21 special_schedules 테이블
CREATE TABLE IF NOT EXISTS public.special_schedules (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    date date NOT NULL,
    schedule_type varchar(20) NOT NULL,
    title varchar(100) NOT NULL,
    description text,
    start_time time without time zone NOT NULL,
    end_time time without time zone NOT NULL,
    min_reservations integer DEFAULT 1,
    is_confirmed boolean DEFAULT false,
    confirmed_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT special_schedules_pkey PRIMARY KEY (id)
);

-- 1.22 terms 테이블
CREATE TABLE IF NOT EXISTS public.terms (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    type text NOT NULL,
    title text NOT NULL,
    content text NOT NULL,
    version text NOT NULL,
    effective_date date NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    is_active boolean DEFAULT false,
    CONSTRAINT terms_pkey PRIMARY KEY (id)
);

-- =======================
-- 2. 기존 테이블 스키마 업데이트
-- =======================

-- 2.1 admins 테이블에 누락된 컬럼 추가
ALTER TABLE public.admins 
ADD COLUMN IF NOT EXISTS bank_account jsonb;

-- 2.2 device_types 테이블에 누락된 컬럼들 추가
ALTER TABLE public.device_types 
ADD COLUMN IF NOT EXISTS rental_settings jsonb DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS display_order integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS model_name varchar(100),
ADD COLUMN IF NOT EXISTS version_name varchar(100),
ADD COLUMN IF NOT EXISTS play_modes jsonb DEFAULT '[]'::jsonb;

-- 2.3 reservations 테이블에 누락된 컬럼들 추가
ALTER TABLE public.reservations 
ADD COLUMN IF NOT EXISTS actual_start_time timestamp with time zone,
ADD COLUMN IF NOT EXISTS actual_end_time timestamp with time zone,
ADD COLUMN IF NOT EXISTS time_adjustment_reason text,
ADD COLUMN IF NOT EXISTS adjusted_amount integer,
ADD COLUMN IF NOT EXISTS device_id uuid,
ADD COLUMN IF NOT EXISTS total_amount numeric(10,2),
ADD COLUMN IF NOT EXISTS hours integer,
ADD COLUMN IF NOT EXISTS credit_type varchar(50) DEFAULT 'freeplay'::character varying,
ADD COLUMN IF NOT EXISTS assigned_device_number integer,
ADD COLUMN IF NOT EXISTS completed_at timestamp with time zone;

-- 2.4 users 테이블에 누락된 컬럼들 추가
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS last_login_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS marketing_agreed boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS marketing_agreed_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS phone_changed_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS admin_notes text,
ADD COLUMN IF NOT EXISTS no_show_count integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS push_notifications_enabled boolean DEFAULT false;

-- =======================
-- 3. 고유 인덱스 및 제약조건 생성
-- =======================

-- 3.1 고유 제약조건들
CREATE UNIQUE INDEX IF NOT EXISTS admins_user_id_key ON public.admins USING btree (user_id);
CREATE UNIQUE INDEX IF NOT EXISTS banned_words_word_key ON public.banned_words USING btree (word);
CREATE UNIQUE INDEX IF NOT EXISTS content_pages_slug_key ON public.content_pages USING btree (slug);
CREATE UNIQUE INDEX IF NOT EXISTS device_categories_name_key ON public.device_categories USING btree (name);
CREATE UNIQUE INDEX IF NOT EXISTS devices_device_type_id_device_number_key ON public.devices USING btree (device_type_id, device_number);
CREATE UNIQUE INDEX IF NOT EXISTS guide_content_page_slug_key ON public.guide_content USING btree (page_slug);
CREATE UNIQUE INDEX IF NOT EXISTS holidays_date_name_key ON public.holidays USING btree (date, name);
CREATE UNIQUE INDEX IF NOT EXISTS machines_machine_number_key ON public.machines USING btree (machine_number);
CREATE UNIQUE INDEX IF NOT EXISTS push_message_templates_template_key_key ON public.push_message_templates USING btree (template_key);
CREATE UNIQUE INDEX IF NOT EXISTS push_subscriptions_endpoint_key ON public.push_subscriptions USING btree (endpoint);
CREATE UNIQUE INDEX IF NOT EXISTS rental_machines_machine_id_key ON public.rental_machines USING btree (machine_id);
CREATE UNIQUE INDEX IF NOT EXISTS rental_settings_device_type_id_key ON public.rental_settings USING btree (device_type_id);
CREATE UNIQUE INDEX IF NOT EXISTS reservation_completion_schedule_reservation_id_key ON public.reservation_completion_schedule USING btree (reservation_id);
CREATE UNIQUE INDEX IF NOT EXISTS reservations_reservation_number_key ON public.reservations USING btree (reservation_number);
CREATE UNIQUE INDEX IF NOT EXISTS schedule_date_type_key ON public.schedule USING btree (date, type);
CREATE UNIQUE INDEX IF NOT EXISTS special_schedules_date_schedule_type_key ON public.special_schedules USING btree (date, schedule_type);
CREATE UNIQUE INDEX IF NOT EXISTS time_slots_date_rental_machine_id_start_time_end_time_key ON public.time_slots USING btree (date, rental_machine_id, start_time, end_time);
CREATE UNIQUE INDEX IF NOT EXISTS users_email_key ON public.users USING btree (email);

-- =======================
-- 4. 일반 인덱스들
-- =======================

-- admin_logs
CREATE INDEX IF NOT EXISTS idx_admin_logs_admin ON public.admin_logs USING btree (admin_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_logs_created ON public.admin_logs USING btree (created_at DESC);

-- bank_qr_codes
CREATE INDEX IF NOT EXISTS idx_bank_qr_codes_active_sort ON public.bank_qr_codes USING btree (is_active, sort_order);
CREATE INDEX IF NOT EXISTS idx_bank_qr_codes_updated_at ON public.bank_qr_codes USING btree (updated_at DESC);

-- banned_words
CREATE INDEX IF NOT EXISTS idx_banned_words_active ON public.banned_words USING btree (is_active);
CREATE INDEX IF NOT EXISTS idx_banned_words_word ON public.banned_words USING btree (word);

-- device_types
CREATE INDEX IF NOT EXISTS idx_device_types_category ON public.device_types USING btree (category_id);

-- devices
CREATE INDEX IF NOT EXISTS idx_devices_status ON public.devices USING btree (status);
CREATE INDEX IF NOT EXISTS idx_devices_type ON public.devices USING btree (device_type_id);

-- holidays
CREATE INDEX IF NOT EXISTS idx_holidays_date ON public.holidays USING btree (date);
CREATE INDEX IF NOT EXISTS idx_holidays_year ON public.holidays USING btree (year);
CREATE INDEX IF NOT EXISTS idx_holidays_year_month ON public.holidays USING btree (year, EXTRACT(month FROM date));

-- notifications
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON public.notifications USING btree (user_id, is_read) WHERE (is_read = false);

-- payment_accounts
CREATE INDEX IF NOT EXISTS idx_payment_accounts_is_active ON public.payment_accounts USING btree (is_active);
CREATE INDEX IF NOT EXISTS idx_payment_accounts_is_primary ON public.payment_accounts USING btree (is_primary);

-- push_message_templates
CREATE INDEX IF NOT EXISTS idx_push_templates_active ON public.push_message_templates USING btree (is_active);
CREATE INDEX IF NOT EXISTS idx_push_templates_key ON public.push_message_templates USING btree (template_key);

-- push_subscriptions
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_created_at ON public.push_subscriptions USING btree (created_at);
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_enabled ON public.push_subscriptions USING btree (enabled);
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user_email ON public.push_subscriptions USING btree (user_email);

-- rental_settings
CREATE INDEX IF NOT EXISTS idx_rental_settings_device_type ON public.rental_settings USING btree (device_type_id);

-- rental_time_slots
CREATE INDEX IF NOT EXISTS idx_rental_time_slots_device_type ON public.rental_time_slots USING btree (device_type_id);
CREATE INDEX IF NOT EXISTS idx_rental_time_slots_slot_type ON public.rental_time_slots USING btree (slot_type);
CREATE INDEX IF NOT EXISTS idx_rental_time_slots_time ON public.rental_time_slots USING btree (start_time, end_time);

-- reservation_completion_schedule
CREATE INDEX IF NOT EXISTS idx_completion_schedule_time ON public.reservation_completion_schedule USING btree (scheduled_at, processed);

-- reservation_rules
CREATE INDEX IF NOT EXISTS idx_reservation_rules_active ON public.reservation_rules USING btree (is_active);
CREATE INDEX IF NOT EXISTS idx_reservation_rules_order ON public.reservation_rules USING btree (display_order);

-- reservations 추가 인덱스들
CREATE INDEX IF NOT EXISTS idx_reservation_number ON public.reservations USING btree (reservation_number);
CREATE INDEX IF NOT EXISTS idx_reservations_assigned_device ON public.reservations USING btree (assigned_device_number, date);
CREATE INDEX IF NOT EXISTS idx_reservations_created_at ON public.reservations USING btree (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reservations_date ON public.reservations USING btree (date);
CREATE INDEX IF NOT EXISTS idx_reservations_date_status ON public.reservations USING btree (date, status);
CREATE INDEX IF NOT EXISTS idx_reservations_device_date ON public.reservations USING btree (device_id, date);
CREATE INDEX IF NOT EXISTS idx_reservations_machine_date ON public.reservations USING btree (rental_machine_id, date);
CREATE INDEX IF NOT EXISTS idx_reservations_reservation_number ON public.reservations USING btree (reservation_number);
CREATE INDEX IF NOT EXISTS idx_reservations_user_status ON public.reservations USING btree (user_id, status);

-- schedule
CREATE INDEX IF NOT EXISTS idx_schedule_date ON public.schedule USING btree (date);
CREATE INDEX IF NOT EXISTS idx_schedule_date_type ON public.schedule USING btree (date, type);
CREATE INDEX IF NOT EXISTS idx_schedule_type ON public.schedule USING btree (type);

-- schedule_events 추가 인덱스들
CREATE INDEX IF NOT EXISTS idx_schedule_events_auto_generated ON public.schedule_events USING btree (is_auto_generated, date);
CREATE INDEX IF NOT EXISTS idx_schedule_events_date ON public.schedule_events USING btree (date);
CREATE INDEX IF NOT EXISTS idx_schedule_events_date_range ON public.schedule_events USING btree (date, end_date);
CREATE INDEX IF NOT EXISTS idx_schedule_events_source_reference ON public.schedule_events USING btree (source_reference);
CREATE INDEX IF NOT EXISTS idx_schedule_events_type ON public.schedule_events USING btree (type);

-- terms
CREATE INDEX IF NOT EXISTS idx_terms_effective_date ON public.terms USING btree (effective_date);
CREATE INDEX IF NOT EXISTS idx_terms_type_active ON public.terms USING btree (type, is_active);

-- time_slots 추가 인덱스들
CREATE INDEX IF NOT EXISTS idx_time_slots_availability ON public.time_slots USING btree (date, is_available) WHERE (is_available = true);
CREATE INDEX IF NOT EXISTS idx_time_slots_date_machine ON public.time_slots USING btree (date, rental_machine_id);

-- users 추가 인덱스들
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users USING btree (email);
CREATE INDEX IF NOT EXISTS idx_users_phone ON public.users USING btree (phone) WHERE (phone IS NOT NULL);
CREATE INDEX IF NOT EXISTS idx_users_phone_changed_at ON public.users USING btree (phone_changed_at);
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users USING btree (role) WHERE ((role)::text <> 'user'::text);

-- 마이그레이션 완료 메시지
SELECT 'Schema migration part 1 completed successfully' as status;