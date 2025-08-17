-- 운영 DB에 RLS 정책을 추가하는 스크립트

-- =======================
-- 1. RLS 활성화
-- =======================

ALTER TABLE public.admin_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bank_qr_codes ENABLE ROW LEVEL SECURITY;
-- banned_words는 RLS 비활성화 상태 유지
ALTER TABLE public.content_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.device_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.device_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.guide_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.holidays ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.machine_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.machines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.play_modes ENABLE ROW LEVEL SECURITY;
-- push_message_templates, push_subscriptions는 RLS 비활성화 상태 유지
ALTER TABLE public.rental_machines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rental_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rental_time_slots ENABLE ROW LEVEL SECURITY;
-- reservation_completion_schedule는 RLS 비활성화 상태 유지
ALTER TABLE public.reservation_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schedule ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schedule_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.special_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.terms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.time_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- =======================
-- 2. RLS 정책 생성
-- =======================

-- 2.1 admin_logs 정책
DROP POLICY IF EXISTS "Admins can view all logs" ON public.admin_logs;
CREATE POLICY "Admins can view all logs" ON public.admin_logs
    FOR SELECT USING (is_admin());

-- 2.2 bank_qr_codes 정책
DROP POLICY IF EXISTS "bank_qr_codes_select" ON public.bank_qr_codes;
CREATE POLICY "bank_qr_codes_select" ON public.bank_qr_codes
    FOR SELECT USING ((auth.role() = 'authenticated'::text) AND (is_active = true));

DROP POLICY IF EXISTS "bank_qr_codes_all_super_admin" ON public.bank_qr_codes;
CREATE POLICY "bank_qr_codes_all_super_admin" ON public.bank_qr_codes
    FOR ALL USING ((auth.role() = 'authenticated'::text) AND (EXISTS ( SELECT 1
   FROM users
  WHERE ((users.id = auth.uid()) AND ((users.role)::text = 'super_admin'::text)))));

-- 2.3 content_pages 정책
DROP POLICY IF EXISTS "Anyone can view published content" ON public.content_pages;
CREATE POLICY "Anyone can view published content" ON public.content_pages
    FOR SELECT USING (is_published = true);

DROP POLICY IF EXISTS "Admins can manage all content" ON public.content_pages;
CREATE POLICY "Admins can manage all content" ON public.content_pages
    FOR ALL USING (is_admin());

-- 2.4 device_categories 정책
DROP POLICY IF EXISTS "Anyone can view categories" ON public.device_categories;
CREATE POLICY "Anyone can view categories" ON public.device_categories
    FOR SELECT USING (true);

-- 2.5 device_types 정책
DROP POLICY IF EXISTS "Anyone can view device types" ON public.device_types;
CREATE POLICY "Anyone can view device types" ON public.device_types
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Service role can update device types" ON public.device_types;
CREATE POLICY "Service role can update device types" ON public.device_types
    FOR UPDATE USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Service role can delete device types" ON public.device_types;
CREATE POLICY "Service role can delete device types" ON public.device_types
    FOR DELETE USING (true);

-- 2.6 devices 정책
DROP POLICY IF EXISTS "Anyone can view devices" ON public.devices;
CREATE POLICY "Anyone can view devices" ON public.devices
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Service role can update devices" ON public.devices;
CREATE POLICY "Service role can update devices" ON public.devices
    FOR UPDATE USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Service role can delete devices" ON public.devices;
CREATE POLICY "Service role can delete devices" ON public.devices
    FOR DELETE USING (true);

-- 2.7 guide_content 정책
DROP POLICY IF EXISTS "guide_content_select" ON public.guide_content;
CREATE POLICY "guide_content_select" ON public.guide_content
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "guide_content_update" ON public.guide_content;
CREATE POLICY "guide_content_update" ON public.guide_content
    FOR UPDATE USING (auth.uid() IS NOT NULL);

-- 2.8 holidays 정책
DROP POLICY IF EXISTS "holidays_read_all" ON public.holidays;
CREATE POLICY "holidays_read_all" ON public.holidays
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "holidays_manage_admin" ON public.holidays;
CREATE POLICY "holidays_manage_admin" ON public.holidays
    FOR ALL USING (EXISTS ( SELECT 1
   FROM admins
  WHERE (admins.user_id = auth.uid())));

-- 2.9 machine_rules 정책
DROP POLICY IF EXISTS "Anyone can view active machine rules" ON public.machine_rules;
CREATE POLICY "Anyone can view active machine rules" ON public.machine_rules
    FOR SELECT USING (is_active = true);

-- 2.10 machines 정책
DROP POLICY IF EXISTS "Admins can manage all machines" ON public.machines;
CREATE POLICY "Admins can manage all machines" ON public.machines
    FOR ALL USING (is_admin());

-- 2.11 notifications 정책
DROP POLICY IF EXISTS "Users can view own notifications" ON public.notifications;
CREATE POLICY "Users can view own notifications" ON public.notifications
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own notifications" ON public.notifications;
CREATE POLICY "Users can update own notifications" ON public.notifications
    FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can manage all notifications" ON public.notifications;
CREATE POLICY "Admins can manage all notifications" ON public.notifications
    FOR ALL USING (is_admin());

-- 2.12 payment_accounts 정책
DROP POLICY IF EXISTS "Super admins can view payment accounts" ON public.payment_accounts;
CREATE POLICY "Super admins can view payment accounts" ON public.payment_accounts
    FOR SELECT USING (EXISTS ( SELECT 1
   FROM admins
  WHERE ((admins.user_id = auth.uid()) AND (admins.is_super_admin = true))));

DROP POLICY IF EXISTS "Super admins can update payment accounts" ON public.payment_accounts;
CREATE POLICY "Super admins can update payment accounts" ON public.payment_accounts
    FOR UPDATE USING (EXISTS ( SELECT 1
   FROM admins
  WHERE ((admins.user_id = auth.uid()) AND (admins.is_super_admin = true))));

DROP POLICY IF EXISTS "Super admins can delete payment accounts" ON public.payment_accounts;
CREATE POLICY "Super admins can delete payment accounts" ON public.payment_accounts
    FOR DELETE USING (EXISTS ( SELECT 1
   FROM admins
  WHERE ((admins.user_id = auth.uid()) AND (admins.is_super_admin = true))));

-- 2.13 play_modes 정책
DROP POLICY IF EXISTS "Anyone can view play modes" ON public.play_modes;
CREATE POLICY "Anyone can view play modes" ON public.play_modes
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Anyone can update play modes" ON public.play_modes;
CREATE POLICY "Anyone can update play modes" ON public.play_modes
    FOR UPDATE USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Anyone can delete play modes" ON public.play_modes;
CREATE POLICY "Anyone can delete play modes" ON public.play_modes
    FOR DELETE USING (true);

DROP POLICY IF EXISTS "Service role can update play modes" ON public.play_modes;
CREATE POLICY "Service role can update play modes" ON public.play_modes
    FOR UPDATE USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Service role can delete play modes" ON public.play_modes;
CREATE POLICY "Service role can delete play modes" ON public.play_modes
    FOR DELETE USING (true);

-- 2.14 rental_machines 정책
DROP POLICY IF EXISTS "Anyone can view active rental machines" ON public.rental_machines;
CREATE POLICY "Anyone can view active rental machines" ON public.rental_machines
    FOR SELECT USING (is_active = true);

DROP POLICY IF EXISTS "Admins can manage all rental machines" ON public.rental_machines;
CREATE POLICY "Admins can manage all rental machines" ON public.rental_machines
    FOR ALL USING (is_admin());

-- 2.15 rental_settings 정책
DROP POLICY IF EXISTS "rental_settings_public_read" ON public.rental_settings;
CREATE POLICY "rental_settings_public_read" ON public.rental_settings
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "rental_settings_admin_all" ON public.rental_settings;
CREATE POLICY "rental_settings_admin_all" ON public.rental_settings
    FOR ALL USING (true);

DROP POLICY IF EXISTS "Service role can update rental settings" ON public.rental_settings;
CREATE POLICY "Service role can update rental settings" ON public.rental_settings
    FOR UPDATE USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Service role can delete rental settings" ON public.rental_settings;
CREATE POLICY "Service role can delete rental settings" ON public.rental_settings
    FOR DELETE USING (true);

-- 2.16 rental_time_slots 정책
DROP POLICY IF EXISTS "rental_time_slots_public_read" ON public.rental_time_slots;
CREATE POLICY "rental_time_slots_public_read" ON public.rental_time_slots
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "rental_time_slots_admin_all" ON public.rental_time_slots;
CREATE POLICY "rental_time_slots_admin_all" ON public.rental_time_slots
    FOR ALL USING (true);

-- 2.17 reservation_rules 정책
DROP POLICY IF EXISTS "Anyone can view active rules" ON public.reservation_rules;
CREATE POLICY "Anyone can view active rules" ON public.reservation_rules
    FOR SELECT USING (is_active = true);

DROP POLICY IF EXISTS "Service role can manage all rules" ON public.reservation_rules;
CREATE POLICY "Service role can manage all rules" ON public.reservation_rules
    FOR ALL USING (auth.role() = 'service_role'::text) WITH CHECK (auth.role() = 'service_role'::text);

-- 2.18 reservations 정책
DROP POLICY IF EXISTS "Users can view own reservations" ON public.reservations;
CREATE POLICY "Users can view own reservations" ON public.reservations
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view own reservations by email" ON public.reservations;
CREATE POLICY "Users can view own reservations by email" ON public.reservations
    FOR SELECT USING (EXISTS ( SELECT 1
   FROM users u
  WHERE ((u.id = reservations.user_id) AND ((u.email)::text = (auth.jwt() ->> 'email'::text)))));

DROP POLICY IF EXISTS "Users can update own pending reservations" ON public.reservations;
CREATE POLICY "Users can update own pending reservations" ON public.reservations
    FOR UPDATE USING ((auth.uid() = user_id) AND ((status)::text = 'pending'::text));

DROP POLICY IF EXISTS "Admins can do everything" ON public.reservations;
CREATE POLICY "Admins can do everything" ON public.reservations
    FOR ALL USING (EXISTS ( SELECT 1
   FROM users
  WHERE ((users.id = auth.uid()) AND ((users.role)::text = 'admin'::text))));

DROP POLICY IF EXISTS "Admins can manage all reservations" ON public.reservations;
CREATE POLICY "Admins can manage all reservations" ON public.reservations
    FOR ALL USING (is_admin());

-- 2.19 schedule 정책
DROP POLICY IF EXISTS "schedule_read_all" ON public.schedule;
CREATE POLICY "schedule_read_all" ON public.schedule
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "schedule_manage_admin" ON public.schedule;
CREATE POLICY "schedule_manage_admin" ON public.schedule
    FOR ALL USING (EXISTS ( SELECT 1
   FROM admins
  WHERE (admins.user_id = auth.uid())));

-- 2.20 schedule_events 정책
DROP POLICY IF EXISTS "Everyone can view schedule events" ON public.schedule_events;
CREATE POLICY "Everyone can view schedule events" ON public.schedule_events
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admin can manage schedule events" ON public.schedule_events;
CREATE POLICY "Admin can manage schedule events" ON public.schedule_events
    FOR ALL USING (EXISTS ( SELECT 1
   FROM admins
  WHERE (admins.user_id = auth.uid())));

-- 2.21 settings 정책
DROP POLICY IF EXISTS "Anyone can view settings" ON public.settings;
CREATE POLICY "Anyone can view settings" ON public.settings
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can manage all settings" ON public.settings;
CREATE POLICY "Admins can manage all settings" ON public.settings
    FOR ALL USING (is_admin());

-- 2.22 special_schedules 정책
DROP POLICY IF EXISTS "Admins can manage all schedules" ON public.special_schedules;
CREATE POLICY "Admins can manage all schedules" ON public.special_schedules
    FOR ALL USING (is_admin());

-- 2.23 terms 정책
DROP POLICY IF EXISTS "Anyone can view active terms" ON public.terms;
CREATE POLICY "Anyone can view active terms" ON public.terms
    FOR SELECT USING (is_active = true);

DROP POLICY IF EXISTS "Authenticated users can manage terms" ON public.terms;
CREATE POLICY "Authenticated users can manage terms" ON public.terms
    FOR ALL USING (auth.uid() IS NOT NULL);

-- 2.24 time_slots 정책
DROP POLICY IF EXISTS "Anyone can view available time slots" ON public.time_slots;
CREATE POLICY "Anyone can view available time slots" ON public.time_slots
    FOR SELECT USING (is_available = true);

DROP POLICY IF EXISTS "Admins can manage all time slots" ON public.time_slots;
CREATE POLICY "Admins can manage all time slots" ON public.time_slots
    FOR ALL USING (is_admin());

-- 2.25 users 정책
DROP POLICY IF EXISTS "Users can view own data" ON public.users;
CREATE POLICY "Users can view own data" ON public.users
    FOR SELECT USING ((auth.jwt() ->> 'email'::text) = (email)::text);

DROP POLICY IF EXISTS "Users can update own data" ON public.users;
CREATE POLICY "Users can update own data" ON public.users
    FOR UPDATE USING ((auth.jwt() ->> 'email'::text) = (email)::text) WITH CHECK ((auth.jwt() ->> 'email'::text) = (email)::text);

DROP POLICY IF EXISTS "Admins can view all users" ON public.users;
CREATE POLICY "Admins can view all users" ON public.users
    FOR SELECT USING (EXISTS ( SELECT 1
   FROM admins
  WHERE ((admins.user_id)::text = (auth.uid())::text)));

DROP POLICY IF EXISTS "Admins can update all users" ON public.users;
CREATE POLICY "Admins can update all users" ON public.users
    FOR UPDATE USING (EXISTS ( SELECT 1
   FROM admins
  WHERE ((admins.user_id)::text = (auth.uid())::text)));

DROP POLICY IF EXISTS "Admins can manage all users" ON public.users;
CREATE POLICY "Admins can manage all users" ON public.users
    FOR ALL USING (is_admin());

-- 마이그레이션 완료 메시지
SELECT 'RLS policies migration completed successfully' as status;