-- 운영 DB에 함수, 트리거, RLS 정책을 추가하는 스크립트
-- 실행 순서: 함수 → 트리거 → RLS 정책

-- =======================
-- 1. 함수 생성
-- =======================

-- 1.1 is_admin 함수 (중요 - 여러 RLS에서 사용)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 
        FROM public.admins 
        WHERE admins.user_id = auth.uid()
    );
END;
$$;

-- 1.2 update_updated_at_column 함수
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

-- 1.3 update_updated_at 함수
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;

-- 1.4 generate_reservation_number 함수들
CREATE OR REPLACE FUNCTION public.generate_reservation_number(p_date date)
RETURNS character varying
LANGUAGE plpgsql
AS $$
DECLARE
    date_str text;
    sequence_num integer;
    reservation_number text;
BEGIN
    -- 날짜를 YYMMDD 형식으로 변환
    date_str := to_char(p_date, 'YYMMDD');
    
    -- 해당 날짜의 예약 건수 + 1
    SELECT COALESCE(MAX(
        CASE 
            WHEN reservation_number ~ ('^' || date_str || '[0-9]{3}$') 
            THEN CAST(substring(reservation_number from 7 for 3) AS integer)
            ELSE 0
        END
    ), 0) + 1
    INTO sequence_num
    FROM public.reservations
    WHERE date = p_date;
    
    -- 예약번호 생성 (YYMMDD + 3자리 순번)
    reservation_number := date_str || lpad(sequence_num::text, 3, '0');
    
    RETURN reservation_number;
END;
$$;

-- 1.5 set_reservation_number 트리거 함수
CREATE OR REPLACE FUNCTION public.set_reservation_number()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    IF NEW.reservation_number IS NULL OR NEW.reservation_number = '' THEN
        NEW.reservation_number := public.generate_reservation_number(NEW.date);
    END IF;
    RETURN NEW;
END;
$$;

-- 1.6 schedule_reservation_completion 함수
CREATE OR REPLACE FUNCTION public.schedule_reservation_completion()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    -- 체크인이 되었고 완료 예약이 없는 경우에만 스케줄 생성
    IF NEW.check_in_at IS NOT NULL AND OLD.check_in_at IS NULL THEN
        INSERT INTO public.reservation_completion_schedule (
            reservation_id,
            scheduled_at
        ) VALUES (
            NEW.id,
            NEW.check_in_at + (NEW.hours || ' hours')::interval
        )
        ON CONFLICT (reservation_id) DO NOTHING;
    END IF;
    
    RETURN NEW;
END;
$$;

-- 1.7 ensure_single_primary_account 함수
CREATE OR REPLACE FUNCTION public.ensure_single_primary_account()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    -- 새로 추가되거나 업데이트되는 계정이 primary이면 다른 모든 계정을 non-primary로 변경
    IF NEW.is_primary = true THEN
        UPDATE public.payment_accounts 
        SET is_primary = false 
        WHERE id != NEW.id AND is_primary = true;
    END IF;
    
    RETURN NEW;
END;
$$;

-- 1.8 전용 updated_at 함수들
CREATE OR REPLACE FUNCTION public.update_bank_qr_codes_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_payment_accounts_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_push_templates_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_terms_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

-- 1.9 예약 완료 처리 함수들
CREATE OR REPLACE FUNCTION public.process_scheduled_completions()
RETURNS integer
LANGUAGE plpgsql
AS $$
DECLARE
    processed_count integer := 0;
    completion_record record;
BEGIN
    FOR completion_record IN 
        SELECT rcs.id, rcs.reservation_id
        FROM public.reservation_completion_schedule rcs
        JOIN public.reservations r ON rcs.reservation_id = r.id
        WHERE rcs.processed = false
        AND rcs.scheduled_at <= now()
        AND r.status = 'checked_in'
    LOOP
        UPDATE public.reservations 
        SET 
            status = 'completed',
            completed_at = now(),
            updated_at = now()
        WHERE id = completion_record.reservation_id;
        
        UPDATE public.reservation_completion_schedule 
        SET processed = true 
        WHERE id = completion_record.id;
        
        processed_count := processed_count + 1;
    END LOOP;
    
    RETURN processed_count;
END;
$$;

-- 1.10 스케줄 상태 확인 함수
CREATE OR REPLACE FUNCTION public.check_schedule_status(check_date date)
RETURNS TABLE(
    has_special_hours boolean, 
    is_closed boolean, 
    special_start_time time without time zone, 
    special_end_time time without time zone, 
    event_types text[]
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        EXISTS(SELECT 1 FROM public.schedule_events WHERE date = check_date) as has_special_hours,
        EXISTS(SELECT 1 FROM public.schedule_events WHERE date = check_date AND type = 'closed') as is_closed,
        (SELECT se.start_time FROM public.schedule_events se WHERE se.date = check_date AND se.type != 'closed' LIMIT 1) as special_start_time,
        (SELECT se.end_time FROM public.schedule_events se WHERE se.date = check_date AND se.type != 'closed' LIMIT 1) as special_end_time,
        ARRAY(SELECT DISTINCT se.type FROM public.schedule_events se WHERE se.date = check_date) as event_types;
END;
$$;

-- 1.11 디버그 함수
CREATE OR REPLACE FUNCTION public.debug_completion_schedule()
RETURNS TABLE(
    reservation_id uuid,
    user_name text,
    device_info text,
    current_status text,
    scheduled_time timestamp with time zone,
    minutes_until_completion numeric,
    will_process_at text
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        rcs.reservation_id,
        u.name as user_name,
        dt.name || ' #' || r.assigned_device_number::text as device_info,
        r.status as current_status,
        rcs.scheduled_at as scheduled_time,
        EXTRACT(EPOCH FROM (rcs.scheduled_at - now())) / 60 as minutes_until_completion,
        CASE 
            WHEN rcs.scheduled_at <= now() THEN 'Ready to process'
            ELSE 'Waiting: ' || EXTRACT(EPOCH FROM (rcs.scheduled_at - now())) / 60 || ' minutes'
        END as will_process_at
    FROM public.reservation_completion_schedule rcs
    JOIN public.reservations r ON rcs.reservation_id = r.id
    JOIN public.users u ON r.user_id = u.id
    JOIN public.devices d ON r.device_id = d.id
    JOIN public.device_types dt ON d.device_type_id = dt.id
    WHERE rcs.processed = false
    ORDER BY rcs.scheduled_at;
END;
$$;

-- 1.12 만료된 검증 정리 함수
CREATE OR REPLACE FUNCTION public.cleanup_expired_verifications()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
    -- 이 함수는 필요시 구현
    RETURN;
END;
$$;

-- 1.13 만료된 대여 확인 및 업데이트 함수
CREATE OR REPLACE FUNCTION public.check_and_update_expired_rentals()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
    -- 만료된 예약을 자동으로 완료 처리
    UPDATE public.reservations 
    SET 
        status = 'completed',
        completed_at = now(),
        updated_at = now()
    WHERE status = 'checked_in'
    AND check_in_at + (hours || ' hours')::interval <= now();
END;
$$;

-- =======================
-- 2. 외래키 제약조건 추가
-- =======================

-- 2.1 admin_logs 외래키
ALTER TABLE public.admin_logs 
ADD CONSTRAINT IF NOT EXISTS admin_logs_admin_id_fkey 
FOREIGN KEY (admin_id) REFERENCES public.users(id);

-- 2.2 admins 외래키
ALTER TABLE public.admins 
ADD CONSTRAINT IF NOT EXISTS admins_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.users(id);

-- 2.3 content_pages 외래키
ALTER TABLE public.content_pages 
ADD CONSTRAINT IF NOT EXISTS content_pages_created_by_fkey 
FOREIGN KEY (created_by) REFERENCES public.users(id);

ALTER TABLE public.content_pages 
ADD CONSTRAINT IF NOT EXISTS content_pages_updated_by_fkey 
FOREIGN KEY (updated_by) REFERENCES public.users(id);

-- 2.4 device_types 외래키
ALTER TABLE public.device_types 
ADD CONSTRAINT IF NOT EXISTS device_types_category_id_fkey 
FOREIGN KEY (category_id) REFERENCES public.device_categories(id);

-- 2.5 devices 외래키
ALTER TABLE public.devices 
ADD CONSTRAINT IF NOT EXISTS devices_device_type_id_fkey 
FOREIGN KEY (device_type_id) REFERENCES public.device_types(id);

-- 2.6 notifications 외래키
ALTER TABLE public.notifications 
ADD CONSTRAINT IF NOT EXISTS notifications_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.users(id);

-- 2.7 play_modes 외래키
ALTER TABLE public.play_modes 
ADD CONSTRAINT IF NOT EXISTS play_modes_device_type_id_fkey 
FOREIGN KEY (device_type_id) REFERENCES public.device_types(id);

-- 2.8 rental_machines 외래키
ALTER TABLE public.rental_machines 
ADD CONSTRAINT IF NOT EXISTS rental_machines_machine_id_fkey 
FOREIGN KEY (machine_id) REFERENCES public.machines(id);

-- 2.9 rental_settings 외래키
ALTER TABLE public.rental_settings 
ADD CONSTRAINT IF NOT EXISTS rental_settings_device_type_id_fkey 
FOREIGN KEY (device_type_id) REFERENCES public.device_types(id);

-- 2.10 rental_time_slots 외래키
ALTER TABLE public.rental_time_slots 
ADD CONSTRAINT IF NOT EXISTS rental_time_slots_device_type_id_fkey 
FOREIGN KEY (device_type_id) REFERENCES public.device_types(id);

-- 2.11 reservation_completion_schedule 외래키
ALTER TABLE public.reservation_completion_schedule 
ADD CONSTRAINT IF NOT EXISTS reservation_completion_schedule_reservation_id_fkey 
FOREIGN KEY (reservation_id) REFERENCES public.reservations(id);

-- 2.12 reservations 외래키들
ALTER TABLE public.reservations 
ADD CONSTRAINT IF NOT EXISTS reservations_approved_by_fkey 
FOREIGN KEY (approved_by) REFERENCES public.users(id);

ALTER TABLE public.reservations 
ADD CONSTRAINT IF NOT EXISTS reservations_cancelled_by_fkey 
FOREIGN KEY (cancelled_by) REFERENCES public.users(id);

ALTER TABLE public.reservations 
ADD CONSTRAINT IF NOT EXISTS reservations_check_in_by_fkey 
FOREIGN KEY (check_in_by) REFERENCES public.users(id);

ALTER TABLE public.reservations 
ADD CONSTRAINT IF NOT EXISTS reservations_device_id_fkey 
FOREIGN KEY (device_id) REFERENCES public.devices(id);

ALTER TABLE public.reservations 
ADD CONSTRAINT IF NOT EXISTS reservations_payment_confirmed_by_fkey 
FOREIGN KEY (payment_confirmed_by) REFERENCES public.users(id);

ALTER TABLE public.reservations 
ADD CONSTRAINT IF NOT EXISTS reservations_rental_machine_id_fkey 
FOREIGN KEY (rental_machine_id) REFERENCES public.rental_machines(id);

ALTER TABLE public.reservations 
ADD CONSTRAINT IF NOT EXISTS reservations_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.users(id);

-- 2.13 settings 외래키
ALTER TABLE public.settings 
ADD CONSTRAINT IF NOT EXISTS settings_updated_by_fkey 
FOREIGN KEY (updated_by) REFERENCES public.users(id);

-- 2.14 time_slots 외래키
ALTER TABLE public.time_slots 
ADD CONSTRAINT IF NOT EXISTS time_slots_rental_machine_id_fkey 
FOREIGN KEY (rental_machine_id) REFERENCES public.rental_machines(id);

-- =======================
-- 3. 트리거 생성
-- =======================

-- 3.1 updated_at 트리거들
CREATE TRIGGER IF NOT EXISTS update_admins_updated_at
    BEFORE UPDATE ON public.admins
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER IF NOT EXISTS trigger_update_bank_qr_codes_updated_at
    BEFORE UPDATE ON public.bank_qr_codes
    FOR EACH ROW
    EXECUTE FUNCTION public.update_bank_qr_codes_updated_at();

CREATE TRIGGER IF NOT EXISTS update_banned_words_updated_at
    BEFORE UPDATE ON public.banned_words
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER IF NOT EXISTS update_content_pages_updated_at
    BEFORE UPDATE ON public.content_pages
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER IF NOT EXISTS update_guide_content_updated_at
    BEFORE UPDATE ON public.guide_content
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER IF NOT EXISTS update_machines_updated_at
    BEFORE UPDATE ON public.machines
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER IF NOT EXISTS trigger_ensure_single_primary_account
    BEFORE INSERT OR UPDATE ON public.payment_accounts
    FOR EACH ROW
    EXECUTE FUNCTION public.ensure_single_primary_account();

CREATE TRIGGER IF NOT EXISTS trigger_update_payment_accounts_timestamp
    BEFORE UPDATE ON public.payment_accounts
    FOR EACH ROW
    EXECUTE FUNCTION public.update_payment_accounts_updated_at();

CREATE TRIGGER IF NOT EXISTS push_templates_updated_at
    BEFORE UPDATE ON public.push_message_templates
    FOR EACH ROW
    EXECUTE FUNCTION public.update_push_templates_updated_at();

CREATE TRIGGER IF NOT EXISTS update_rental_machines_updated_at
    BEFORE UPDATE ON public.rental_machines
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER IF NOT EXISTS update_rental_settings_updated_at
    BEFORE UPDATE ON public.rental_settings
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER IF NOT EXISTS update_rental_time_slots_updated_at
    BEFORE UPDATE ON public.rental_time_slots
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at();

-- 3.2 예약 관련 트리거들
CREATE TRIGGER IF NOT EXISTS set_reservation_number_trigger
    BEFORE INSERT ON public.reservations
    FOR EACH ROW
    EXECUTE FUNCTION public.set_reservation_number();

CREATE TRIGGER IF NOT EXISTS schedule_completion_on_checkin
    AFTER INSERT OR UPDATE ON public.reservations
    FOR EACH ROW
    EXECUTE FUNCTION public.schedule_reservation_completion();

CREATE TRIGGER IF NOT EXISTS update_reservations_updated_at
    BEFORE UPDATE ON public.reservations
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- 3.3 기타 트리거들
CREATE TRIGGER IF NOT EXISTS update_schedule_events_updated_at
    BEFORE UPDATE ON public.schedule_events
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER IF NOT EXISTS update_settings_updated_at
    BEFORE UPDATE ON public.settings
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER IF NOT EXISTS update_special_schedules_updated_at
    BEFORE UPDATE ON public.special_schedules
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER IF NOT EXISTS update_terms_updated_at_trigger
    BEFORE UPDATE ON public.terms
    FOR EACH ROW
    EXECUTE FUNCTION public.update_terms_updated_at();

CREATE TRIGGER IF NOT EXISTS update_users_updated_at
    BEFORE UPDATE ON public.users
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- 마이그레이션 완료 메시지
SELECT 'Functions and triggers migration completed successfully' as status;