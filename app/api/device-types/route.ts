import { NextRequest } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { 
  apiHandler, 
  parseRequestBody, 
  validateRequiredFields,
  parseSearchParams
} from '@/lib/api/handler';
import { 
  AppError, 
  ErrorCodes 
} from '@/lib/utils/error-handler';
import { logger } from '@/lib/utils/logger';

// 기기 타입 목록 조회
export const GET = apiHandler(async (req: NextRequest) => {
  const supabase = await createServerClient();
  const searchParams = parseSearchParams(req);
  const category = searchParams.get('category');

  let query = supabase
    .from('device_types')
    .select(`
      *,
      devices(
        id,
        device_number,
        location,
        status,
        is_active
      )
    `)
    .eq('is_active', true)
    .order('display_order', { ascending: true });

  // 카테고리 필터링
  if (category) {
    query = query.eq('category', category);
  }

  const { data: deviceTypes, error } = await query;

  if (error) {
    logger.error('Device types error:', error);
    throw new AppError(ErrorCodes.DATABASE_ERROR, '기기 목록을 불러올 수 없습니다', 500);
  }

  // 각 기기 타입별로 활성 기기 수 계산
  const deviceTypesWithCount = (deviceTypes || []).map(type => ({
    ...type,
    active_device_count: type.devices.filter((d: any) => d.is_active && d.status === 'available').length,
    total_device_count: type.devices.filter((d: any) => d.is_active).length
  }));

  return { deviceTypes: deviceTypesWithCount };
});

// 관리자용: 기기 타입 생성
export const POST = apiHandler(async (req: NextRequest) => {
  const supabase = await createServerClient();
  
  // 현재 사용자 확인
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new AppError(ErrorCodes.UNAUTHORIZED, '로그인이 필요합니다', 401);
  }

  // 관리자 권한 확인
  const supabase = createClient();
  const { data$1 } = await supabase.from('users')
    .select('is_admin')
    .eq('id', user.id)
    .single();

  if (!profile?.is_admin) {
    throw new AppError(ErrorCodes.FORBIDDEN, '관리자 권한이 필요합니다', 403);
  }

  const body = await parseRequestBody(req);
  const {
    name,
    category,
    description,
    basePrice,
    priceMultiplier2p = 1.5,
    maxPlayers = 1,
    requiresApproval = true,
    imageUrl,
    displayOrder = 0
  } = body;

  // 필수 필드 검증
  validateRequiredFields({ name, category }, ['name', 'category']);

  // 기기 타입 생성
  const supabase = createClient();
  const { data$1 } = await supabase.from('device_types')
    .insert({
      name,
      category,
      description,
      base_price: basePrice,
      price_multiplier_2p: priceMultiplier2p,
      max_players: maxPlayers,
      requires_approval: requiresApproval,
      image_url: imageUrl,
      display_order: displayOrder,
      is_active: true
    })
    .select()
    .single();

  if (error) {
    logger.error('Create device type error:', error);
    throw new AppError(ErrorCodes.DATABASE_ERROR, '기기 타입 생성에 실패했습니다', 500);
  }

  return {
    deviceType,
    message: '기기 타입이 생성되었습니다'
  };
}, { requireAdmin: true });