import { NextRequest } from 'next/server';
import { createServerClient as createClient } from '@/lib/supabase';
import { createAdminClient } from '@/lib/supabase';
import { getCurrentUser } from '@/lib/auth';
import { 
  apiHandler, 
  parseRequestBody, 
  validateRequiredFields,
  validateDateFormat,
  validateTimeFormat,
  parseSearchParams,
  parsePaginationParams
} from '@/lib/api/handler';
import { 
  AppError, 
  ErrorCodes 
} from '@/lib/utils/error-handler';
import { logger } from '@/lib/utils/logger';

// 예약 생성
export const POST = apiHandler(async (req: NextRequest) => {
  const supabase = await createClient();
  const user = await getCurrentUser();
  
  if (!user) {
    throw new AppError(ErrorCodes.UNAUTHORIZED, '로그인이 필요합니다', 401);
  }

  const body = await parseRequestBody(req);
  logger.info('예약 요청 데이터:', body);
  
  const { 
    date,
    startTime,
    start_time,
    endTime,
    end_time,
    deviceId,
    device_id,
    playerCount,
    player_count,
    hourlyRate,
    totalAmount,
    total_amount,
    userNotes,
    user_notes,
    creditType,
    credit_type
  } = body;
  
  // 필드 이름 통일 (snake_case 우선)
  const reservationData = {
    date: validateDateFormat(date),
    startTime: validateTimeFormat(start_time || startTime),
    endTime: validateTimeFormat(end_time || endTime),
    deviceId: device_id || deviceId,
    playerCount: player_count || playerCount || 1,
    totalAmount: total_amount || totalAmount,
    userNotes: user_notes || userNotes,
    creditType: credit_type || creditType || 'freeplay',
    hourlyRate: hourlyRate || total_amount || totalAmount || 0
  };
  
  // 필수 필드 검증
  validateRequiredFields(reservationData, ['date', 'startTime', 'endTime', 'deviceId']);

  const supabaseAdmin = createAdminClient();

  // 2. 관리자 여부 확인
  const { data: adminData } = await supabaseAdmin
    .from('admins')
    .select('user_id')
    .eq('user_id', user.id)
    .single();

  const isAdmin = !!adminData;

  // 3. 일반 사용자의 경우 활성 예약 개수 제한 확인 (관리자는 제외)
  if (!isAdmin) {
    const { data: activeReservations, count } = await supabaseAdmin
      .from('reservations')
      .select('id', { count: 'exact' })
      .eq('user_id', user.id)
      .in('status', ['pending', 'approved']);

    if (countError) {
      logger.error('활성 예약 조회 에러:', countError);
      throw new AppError(ErrorCodes.DATABASE_ERROR, '예약 상태 확인 중 오류가 발생했습니다', 500);
    }

    const activeCount = activeReservations?.length || 0;
    const MAX_ACTIVE_RESERVATIONS = 3;

    if (activeCount >= MAX_ACTIVE_RESERVATIONS) {
      throw new AppError(
        ErrorCodes.RESERVATION_CONFLICT,
        `현재 ${activeCount}개의 활성 예약이 있습니다. 최대 ${MAX_ACTIVE_RESERVATIONS}개까지만 예약 가능합니다.`,
        400,
        { activeCount, maxCount: MAX_ACTIVE_RESERVATIONS }
      );
    }
  }

  // 4. 선택한 기기가 devices에 있는지 확인
  const supabaseAdmin = createAdminClient();
  const { data$1 } = await supabaseAdmin.from('devices')
    .select('*')
    .eq('id', reservationData.deviceId)
    .single();

  if (deviceError || !device) {
    logger.error('기기 조회 에러:', deviceError);
    throw new AppError(ErrorCodes.DEVICE_NOT_FOUND, '유효하지 않은 기기입니다', 400);
  }

  // 5. 해당 시간대에 이미 예약이 있는지 확인
  const supabaseAdmin = createAdminClient();
  const { data$1 } = await supabaseAdmin.from('reservations')
    .select('id, start_time, end_time')
    .eq('device_id', reservationData.deviceId)
    .eq('date', reservationData.date)
    .in('status', ['pending', 'approved', 'checked_in']);

  if (checkError) {
    logger.error('예약 확인 에러:', checkError);
    throw new AppError(ErrorCodes.DATABASE_ERROR, '예약 확인 중 오류가 발생했습니다', 500);
  }

  // 시간 중복 체크
  if (existingReservations && existingReservations.length > 0) {
    const hasOverlap = existingReservations.some(reservation => {
      const existingStart = reservation.start_time;
      const existingEnd = reservation.end_time;
      
      return (reservationData.startTime < existingEnd && reservationData.endTime > existingStart);
    });
    
    if (hasOverlap) {
      throw new AppError(ErrorCodes.TIME_SLOT_UNAVAILABLE, '해당 시간대에 이미 예약이 있습니다', 400);
    }
  }

  // 6. 예약 번호 생성 (YYMMDD-순서)
  const reservationDate = new Date(reservationData.date);
  const dateStr = reservationDate.toLocaleDateString('ko-KR', { 
    year: '2-digit', 
    month: '2-digit', 
    day: '2-digit',
    timeZone: 'Asia/Seoul'
  }).replace(/\. /g, '').replace('.', '');
  
  const { count } = await supabaseAdmin
    .from('reservations')
    .select('*', { count: 'exact', head: true })
    .eq('date', reservationData.date);
  
  const sequence = (count || 0) + 1;
  const reservationNumber = `${dateStr}-${String(sequence).padStart(3, '0')}`;

  // 7. 예약 생성
  const supabaseAdmin = createAdminClient();
  const { data$1 } = await supabaseAdmin.from('reservations')
    .insert({
      user_id: user.id,
      device_id: reservationData.deviceId,
      reservation_number: reservationNumber,
      date: reservationData.date,
      start_time: reservationData.startTime,
      end_time: reservationData.endTime,
      player_count: reservationData.playerCount,
      hourly_rate: reservationData.hourlyRate,
      total_amount: reservationData.totalAmount,
      status: 'pending',
      payment_method: 'cash',
      payment_status: 'pending',
      user_notes: reservationData.userNotes || null,
      credit_type: reservationData.creditType,
      created_at: new Date().toISOString()
    })
    .select(`
      *,
      devices!inner(
        device_number,
        status,
        device_types(
          name,
          category_id,
          device_categories(
            name
          )
        )
      )
    `)
    .single();

  if (reservationError) {
    logger.error('Reservation error:', reservationError);
    throw new AppError(
      ErrorCodes.DATABASE_ERROR,
      '예약 생성에 실패했습니다',
      500,
      { details: reservationError.message || reservationError }
    );
  }

  // 8. 실시간 업데이트를 위한 브로드캐스트
  try {
    await supabase
      .channel('reservations')
      .send({
        type: 'broadcast',
        event: 'new_reservation',
        payload: { 
          date: reservationData.date,
          deviceId: reservationData.deviceId,
          reservationId: reservation.id,
          startTime: reservationData.startTime,
          endTime: reservationData.endTime
        }
      });
  } catch (broadcastError) {
    logger.error('Broadcast error:', broadcastError);
    // 브로드캐스트 실패는 무시하고 계속 진행
  }

  return {
    reservation,
    message: '예약이 접수되었습니다. 관리자 승인을 기다려주세요.'
  };
}, { requireAuth: true });

// 내 예약 목록 조회
export const GET = apiHandler(async (req: NextRequest) => {
  const user = await getCurrentUser();
  
  if (!user) {
    throw new AppError(ErrorCodes.UNAUTHORIZED, '로그인이 필요합니다', 401);
  }

  const supabaseAdmin = createAdminClient();
  const { data$1 } = await supabaseAdmin.from('users')
      .insert({
        id: userId,
        email: session.user.email,
        name: session.user.name || session.user.email?.split('@')[0] || 'User',
        role: 'user',
        created_at: new Date().toISOString()
      })
      .select('id')
      .single();

    if (createError || !newUser) {
      logger.error('사용자 생성 에러:', createError);
      throw new AppError(ErrorCodes.DATABASE_ERROR, '사용자 정보를 생성할 수 없습니다', 400);
    }
    
    userData = newUser;
  }

  // 쿼리 파라미터 파싱
  const searchParams = parseSearchParams(req);
  const status = searchParams.get('status');
  const { page, pageSize, offset } = parsePaginationParams(req);

  // 예약 목록 조회 쿼리
  let query = supabaseAdmin
    .from('reservations')
    .select(`
      *,
      devices!inner(
        device_number,
        status,
        device_types(
          name,
          model_name,
          version_name,
          category_id,
          device_categories(
            name
          )
        )
      ),
      users!reservations_user_id_fkey(
        name,
        email,
        phone
      )
    `, { count: 'exact' })
    .eq('user_id', user.id)
    .range(offset, offset + pageSize - 1);

  // 상태 필터링
  if (status && status !== 'all') {
    query = query.eq('status', status);
  }

  const { data: reservations, error, count } = await query;

  if (error) {
    logger.error('Get reservations error:', error);
    throw new AppError(ErrorCodes.DATABASE_ERROR, '예약 목록을 불러올 수 없습니다', 500);
  }

  return {
    reservations: reservations || [],
    total: count || 0,
    page,
    pageSize,
    totalPages: Math.ceil((count || 0) / pageSize)
  };
}, { requireAuth: true });