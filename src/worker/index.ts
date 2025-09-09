/**
 * Cloudflare Workers 메인 진입점
 * 게임플라자 예약 시스템 API
 */

/// <reference types="@cloudflare/workers-types" />

import { corsHeaders } from './utils/cors'
import type { Env } from './types/env'

// 메인 fetch 핸들러 - 단순한 테스트 버전
export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url)
    
    try {
      // OPTIONS 요청 처리
      if (request.method === 'OPTIONS') {
        return new Response(null, { headers: corsHeaders })
      }
      
      // 헬스 체크
      if (url.pathname === '/api/health') {
        try {
          // D1 연결 테스트
          const db = env.DB // Development와 Production 모두 DB 바인딩 사용
          const result = await db.prepare('SELECT 1 as test').first()
          
          return Response.json({
            status: 'healthy',
            environment: env.ENVIRONMENT || 'development',
            database: result ? 'connected' : 'disconnected',
            timestamp: new Date().toISOString()
          }, { headers: corsHeaders })
        } catch (error) {
          return Response.json(
            { 
              status: 'error', 
              error: error instanceof Error ? error.message : 'Unknown error',
              timestamp: new Date().toISOString()
            }, 
            { status: 500, headers: corsHeaders }
          )
        }
      }
      
      // 예약 목록 조회 (테스트용)
      if (url.pathname === '/api/v2/reservations' && request.method === 'GET') {
        try {
          const db = env.DB // Development와 Production 모두 DB 바인딩 사용
          
          const reservations = await db
            .prepare(`
              SELECT 
                r.id, r.user_id, r.device_id, r.start_time, r.end_time, 
                r.status, r.created_at, r.updated_at,
                d.name as device_name,
                dt.name as device_type_name
              FROM reservations r 
              LEFT JOIN devices d ON r.device_id = d.id
              LEFT JOIN device_types dt ON d.device_type_id = dt.id
              ORDER BY r.created_at DESC
              LIMIT 10
            `)
            .all()
          
          return Response.json({
            data: reservations.results,
            success: true,
            total: reservations.results.length
          }, { headers: corsHeaders })
        } catch (error) {
          console.error('Get reservations error:', error)
          return Response.json(
            { error: 'Failed to fetch reservations', success: false },
            { status: 500, headers: corsHeaders }
          )
        }
      }
      
      // 기기 목록 조회 (테스트용)
      if (url.pathname === '/api/v2/devices' && request.method === 'GET') {
        try {
          const db = env.DB // Development와 Production 모두 DB 바인딩 사용
          
          const devices = await db
            .prepare(`
              SELECT 
                d.id, d.name, d.status, d.location,
                dt.name as device_type_name, dt.hourly_rate
              FROM devices d 
              LEFT JOIN device_types dt ON d.device_type_id = dt.id
              ORDER BY d.name
            `)
            .all()
          
          return Response.json({
            data: devices.results,
            success: true,
            total: devices.results.length
          }, { headers: corsHeaders })
        } catch (error) {
          console.error('Get devices error:', error)
          return Response.json(
            { error: 'Failed to fetch devices', success: false },
            { status: 500, headers: corsHeaders }
          )
        }
      }
      
      // 기기 개수 집계 API
      if (url.pathname === '/api/public/device-count' && request.method === 'GET') {
        try {
          const db = env.DB // Development와 Production 모두 DB 바인딩 사용
          
          const result = await db
            .prepare(`
              SELECT 
                COUNT(*) as total,
                COUNT(CASE WHEN status = 'available' THEN 1 END) as available
              FROM devices
            `)
            .first()
          
          const total = result?.total || 0
          const available = result?.available || 0
          const availablePercentage = total > 0 ? Math.round((available / total) * 100) : 0
          
          return Response.json({
            total,
            available,
            availablePercentage
          }, { headers: corsHeaders })
        } catch (error) {
          console.error('Device count error:', error)
          return Response.json(
            { 
              error: '기기 상태 조회에 실패했습니다',
              total: 0,
              available: 0,
              availablePercentage: 0
            },
            { status: 500, headers: corsHeaders }
          )
        }
      }
      
      // 오늘 일정 조회 API
      if (url.pathname === '/api/public/schedule/today' && request.method === 'GET') {
        try {
          const db = env.DB // Development와 Production 모두 DB 바인딩 사용
          
          // 한국시간 기준 오늘 날짜 계산
          const kstNow = new Date(new Date().getTime() + (9 * 60 * 60 * 1000))
          const today = new Date(kstNow.getFullYear(), kstNow.getMonth(), kstNow.getDate())
          const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
          
          // 특별 영업시간 조회
          let scheduleEvents: any[] = []
          try {
            const scheduleResult = await db
              .prepare(`
                SELECT title, start_time, end_time, type
                FROM schedule_events 
                WHERE date = ? AND type IN ('early_open', 'overnight', 'early_close')
              `)
              .bind(dateStr)
              .all()
            
            scheduleEvents = scheduleResult.results || []
          } catch (error: any) {
            // schedule_events 테이블이 없을 수도 있음
            console.log('Schedule events table not found or error:', error.message)
          }
          
          // 오늘의 영업시간 계산
          const dayOfWeek = today.getDay()
          const isWeekend = dayOfWeek === 0 || dayOfWeek === 6
          const isFriday = dayOfWeek === 5
          const isSaturday = dayOfWeek === 6
          
          // 기본 영업시간
          const defaultSchedule = {
            floor1Start: isWeekend ? '11:00' : '12:00',
            floor1End: '22:00',
            floor2Start: isWeekend ? '11:00' : '12:00',
            floor2End: (isFriday || isSaturday) ? '05:00' : '24:00',
            floor1EventType: null,
            floor2EventType: (isFriday || isSaturday) ? 'overnight' : null
          }
          
          // 특별 일정이 있으면 반영
          if (scheduleEvents.length > 0) {
            const floor1Events = scheduleEvents.filter((e: any) => e.title?.includes('1층'))
            const floor2Events = scheduleEvents.filter((e: any) => e.title?.includes('2층') || !e.title?.includes('층'))
            
            const floor1Event = floor1Events.find((e: any) => e.type === 'early_open') || 
                               floor1Events.find((e: any) => e.type === 'early_close' || e.type === 'overnight')
            
            const floor2EventOpen = floor2Events.find((e: any) => e.type === 'early_open')
            const floor2EventClose = floor2Events.find((e: any) => e.type === 'early_close' || e.type === 'overnight')
            
            const floor1Start = floor1Event?.type === 'early_open' 
              ? floor1Event?.start_time?.substring(0, 5) || defaultSchedule.floor1Start
              : defaultSchedule.floor1Start
            const floor1End = floor1Event?.type === 'early_close' || floor1Event?.type === 'overnight'
              ? floor1Event?.end_time?.substring(0, 5) || defaultSchedule.floor1End
              : defaultSchedule.floor1End
            
            const floor2Start = floor2EventOpen
              ? floor2EventOpen?.start_time?.substring(0, 5) || defaultSchedule.floor2Start
              : defaultSchedule.floor2Start
            const floor2End = floor2EventClose
              ? floor2EventClose?.end_time?.substring(0, 5) || defaultSchedule.floor2End
              : defaultSchedule.floor2End
            
            const result = {
              floor1Start,
              floor1End,
              floor2Start,
              floor2End,
              floor1EventType: floor1Event?.type || null,
              floor2EventType: floor2EventOpen?.type || floor2EventClose?.type || null,
              date: dateStr,
              dayOfWeek: ['일', '월', '화', '수', '목', '금', '토'][dayOfWeek],
              isWeekend
            }
            
            return Response.json(result, { headers: corsHeaders })
          }
          
          const result = {
            ...defaultSchedule,
            date: dateStr,
            dayOfWeek: ['일', '월', '화', '수', '목', '금', '토'][dayOfWeek],
            isWeekend
          }
          
          return Response.json(result, { headers: corsHeaders })
          
        } catch (error) {
          console.error('Schedule API error:', error)
          return Response.json(
            { error: '서버 오류가 발생했습니다' },
            { status: 500, headers: corsHeaders }
          )
        }
      }
      
      // 비즈니스 정보 조회 API
      if (url.pathname === '/api/business-info' && request.method === 'GET') {
        try {
          const db = env.DB // Development와 Production 모두 DB 바인딩 사용
          
          // 비즈니스 기본 정보 조회
          const businessInfo = await db.prepare(`
            SELECT * FROM business_info WHERE id = 1
          `).first()

          if (!businessInfo) {
            return Response.json(
              { error: '비즈니스 정보를 찾을 수 없습니다.' },
              { status: 404, headers: corsHeaders }
            )
          }

          // 소셜 링크 조회
          const socialLinksResult = await db.prepare(`
            SELECT * FROM social_links 
            WHERE business_info_id = ? AND is_active = 1 
            ORDER BY sort_order ASC
          `).bind(businessInfo.id).all()
          const socialLinks = socialLinksResult.results || []

          // 영업시간 조회
          const operatingHoursResult = await db.prepare(`
            SELECT * FROM operating_hours 
            WHERE business_info_id = ? 
            ORDER BY day_of_week ASC
          `).bind(businessInfo.id).all()
          const operatingHours = operatingHoursResult.results || []

          // transportation_info JSON 파싱
          let transportationInfo = {}
          if (businessInfo.transportation_info) {
            try {
              transportationInfo = JSON.parse(businessInfo.transportation_info)
            } catch (error) {
              console.error('Failed to parse transportation_info:', error)
            }
          }

          const response = {
            id: businessInfo.id,
            name: businessInfo.name,
            description: businessInfo.description,
            address: businessInfo.address,
            phone: businessInfo.phone,
            email: businessInfo.email,
            website: businessInfo.website,
            kakaoChat: businessInfo.kakao_chat_url,
            maps: {
              naver: businessInfo.naver_map_url,
              kakao: businessInfo.kakao_map_url,
              google: businessInfo.google_map_url
            },
            transportation: transportationInfo,
            parking: businessInfo.parking_info,
            socialLinks: socialLinks.map((link: any) => ({
              id: link.id,
              platform: link.platform,
              name: link.name,
              url: link.url,
              description: link.description,
              icon: link.icon_name,
              bgColor: link.bg_color,
              hoverColor: link.hover_color,
              textColor: link.text_color,
              sortOrder: link.sort_order
            })),
            operatingHours: operatingHours.map((hours: any) => ({
              id: hours.id,
              dayOfWeek: hours.day_of_week,
              openTime: hours.open_time,
              closeTime: hours.close_time,
              isClosed: Boolean(hours.is_closed),
              specialNote: hours.special_note
            })),
            updatedAt: businessInfo.updated_at
          }

          return Response.json(response, {
            headers: {
              ...corsHeaders,
              'Cache-Control': 'public, max-age=3600, stale-while-revalidate=7200',
            }
          })

        } catch (error) {
          console.error('비즈니스 정보 조회 오류:', error)
          return Response.json(
            { error: '비즈니스 정보 조회 중 오류가 발생했습니다.' },
            { status: 500, headers: corsHeaders }
          )
        }
      }

      // 비즈니스 정보 조회 API
      if (url.pathname === '/api/business-info' && request.method === 'GET') {
        try {
          const db = env.DB // Development와 Production 모두 DB 바인딩 사용
          
          // 비즈니스 기본 정보 조회
          let businessInfo: any = null
          try {
            const result = await db.prepare(`
              SELECT * FROM business_info WHERE id = 1
            `).first()
            businessInfo = result
          } catch (error) {
            console.log('business_info table not found, using fallback')
          }
          
          if (!businessInfo) {
            // 폴백 데이터
            businessInfo = {
              id: 1,
              name: '광주 게임플라자',
              description: '리듬게임 전문 아케이드 게임센터',
              address: '광주광역시 동구 충장로안길 6',
              phone: '',
              email: '',
              website: '',
              business_hours: null,
              map_naver: 'https://map.naver.com/v5/search/게임플라자 광주광역시 동구 충장로안길 6',
              map_kakao: 'https://place.map.kakao.com/1155241361',
              map_google: 'https://www.google.com/maps/search/게임플라자 광주광역시 동구 충장로안길 6',
              transportation_info: JSON.stringify({
                subway: '금남로4가역 3번 출구 도보 3분',
                subway_detail: '광주 도시철도 1호선',
                bus: '금남로4가 정류장 하차',
                bus_detail: '금남58, 금남59, 수완12, 첨단95, 좌석02 등',
                parking: '인근 유료주차장 이용',
                parking_detail: null
              })
            }
          }
          
          // transportation_info JSON 파싱
          if (businessInfo.transportation_info && typeof businessInfo.transportation_info === 'string') {
            try {
              businessInfo.transportation_info = JSON.parse(businessInfo.transportation_info)
            } catch (e) {
              businessInfo.transportation_info = {}
            }
          }
          
          // 소셜 링크 조회
          let socialLinks: any[] = []
          try {
            const result = await db.prepare(`
              SELECT * FROM social_links 
              WHERE business_info_id = ? AND is_active = 1 
              ORDER BY sort_order ASC
            `).bind(businessInfo.id).all()
            socialLinks = result.results || []
          } catch (error) {
            console.log('social_links table not found, using fallback')
            socialLinks = [
              {
                platform: 'twitter',
                url: 'https://twitter.com/gameplaza94',
                icon: 'Twitter',
                label: 'X(트위터)',
                description: '최신 소식과 이벤트'
              },
              {
                platform: 'youtube',
                url: 'https://www.youtube.com/@GAMEPLAZA_C',
                icon: 'Youtube',
                label: '유튜브',
                description: '실시간 방송'
              },
              {
                platform: 'kakao',
                url: 'https://open.kakao.com/o/gItV8omc',
                icon: 'MessageCircle',
                label: '카카오톡',
                description: '커뮤니티 오픈챗'
              },
              {
                platform: 'discord',
                url: 'https://discord.gg/vTx3y9wvVb',
                icon: 'Headphones',
                label: '디스코드',
                description: '친목 교류'
              }
            ]
          }
          
          return Response.json({
            business: businessInfo,
            socialLinks,
            operatingHours: []
          }, { headers: corsHeaders })
          
        } catch (error) {
          console.error('Business info API error:', error)
          return Response.json(
            { error: '서버 오류가 발생했습니다' },
            { status: 500, headers: corsHeaders }
          )
        }
      }
      
      // 공지사항 조회 API (공개용)
      if (url.pathname === '/api/announcements' && request.method === 'GET') {
        try {
          const db = env.DB // Development와 Production 모두 DB 바인딩 사용
          
          // URL 파라미터 파싱
          const page = parseInt(url.searchParams.get('page') || '1')
          const limit = Math.min(parseInt(url.searchParams.get('limit') || '10'), 50)
          const offset = (page - 1) * limit
          
          // 발행된 공지사항 중 만료되지 않은 것만 조회
          const announcements = await db
            .prepare(`
              SELECT 
                id, title, content, type, is_important, 
                published_at, expires_at, view_count, sort_order
              FROM announcements 
              WHERE is_published = 1 
              AND (expires_at IS NULL OR expires_at > datetime('now'))
              ORDER BY 
                is_important DESC, 
                sort_order DESC, 
                published_at DESC
              LIMIT ? OFFSET ?
            `)
            .bind(limit, offset)
            .all()
          
          // 총 개수 조회
          const totalCount = await db
            .prepare(`
              SELECT COUNT(*) as count 
              FROM announcements 
              WHERE is_published = 1 
              AND (expires_at IS NULL OR expires_at > datetime('now'))
            `)
            .first()
          
          return Response.json({
            data: announcements.results || [],
            pagination: {
              page,
              limit,
              total: totalCount?.count || 0,
              totalPages: Math.ceil((totalCount?.count || 0) / limit)
            },
            success: true
          }, { headers: corsHeaders })
        } catch (error) {
          console.error('Announcements fetch error:', error)
          return Response.json(
            { error: 'Failed to fetch announcements', success: false, data: [] },
            { status: 500, headers: corsHeaders }
          )
        }
      }

      // 약관 조회 API
      if (url.pathname === '/api/terms' && request.method === 'GET') {
        try {
          const db = env.DB // Development와 Production 모두 DB 바인딩 사용
          const url_obj = new URL(request.url)
          const type = url_obj.searchParams.get('type')
          
          let data: any[] = []
          
          // content_pages 테이블에서 약관 조회 시도
          try {
            let query = `
              SELECT * FROM content_pages 
              WHERE is_published = 1
              AND slug IN ('terms_of_service', 'privacy_policy')
              ORDER BY updated_at DESC
            `
            let params: string[] = []
            
            // 특정 타입이 요청된 경우 필터링
            if (type && ['terms_of_service', 'privacy_policy'].includes(type)) {
              query = `
                SELECT * FROM content_pages 
                WHERE is_published = 1 AND slug = ?
                ORDER BY updated_at DESC
                LIMIT 1
              `
              params = [type]
            }
            
            const result = await db.prepare(query).bind(...params).all()
            data = result.results || []
          } catch (dbError: any) {
            console.log('content_pages table not found, using fallback data')
            
            // 테이블이 없으면 기본 약관 데이터 반환
            const fallbackData = {
              terms_of_service: {
                id: 1,
                slug: 'terms_of_service',
                title: '이용약관',
                content: '게임플라자 이용약관 내용입니다.\n\n서비스 이용 시 준수해야 할 사항들이 포함되어 있습니다.',
                is_published: 1,
                created_at: '2024-01-01T00:00:00Z',
                updated_at: '2024-01-01T00:00:00Z'
              },
              privacy_policy: {
                id: 2,
                slug: 'privacy_policy',
                title: '개인정보처리방침',
                content: '게임플라자 개인정보처리방침입니다.\n\n개인정보 수집 및 이용에 대한 내용이 포함되어 있습니다.',
                is_published: 1,
                created_at: '2024-01-01T00:00:00Z',
                updated_at: '2024-01-01T00:00:00Z'
              }
            }
            
            if (type && fallbackData[type as keyof typeof fallbackData]) {
              data = [fallbackData[type as keyof typeof fallbackData]]
            } else {
              data = Object.values(fallbackData)
            }
          }
          
          // 타입별로 단일 객체 반환
          if (type) {
            const terms = data[0] || null
            const formattedTerms = terms ? {
              id: terms.id,
              type: terms.slug,
              title: terms.title,
              content: terms.content,
              is_active: terms.is_published,
              created_at: terms.created_at,
              updated_at: terms.updated_at
            } : null
            return Response.json({ data: formattedTerms }, { 
              headers: {
                ...corsHeaders,
                'Cache-Control': 'public, max-age=1800, stale-while-revalidate=3600',
              }
            })
          }
          
          // 전체 약관 반환 시 타입별로 그룹화
          const termsOfService = data.find((t: any) => t.slug === 'terms_of_service')
          const privacyPolicy = data.find((t: any) => t.slug === 'privacy_policy')
          
          const termsMap = {
            terms_of_service: termsOfService ? {
              id: termsOfService.id,
              type: termsOfService.slug,
              title: termsOfService.title,
              content: termsOfService.content,
              is_active: termsOfService.is_published,
              created_at: termsOfService.created_at,
              updated_at: termsOfService.updated_at
            } : null,
            privacy_policy: privacyPolicy ? {
              id: privacyPolicy.id,
              type: privacyPolicy.slug,
              title: privacyPolicy.title,
              content: privacyPolicy.content,
              is_active: privacyPolicy.is_published,
              created_at: privacyPolicy.created_at,
              updated_at: privacyPolicy.updated_at
            } : null
          }
          
          return Response.json({ data: termsMap }, { 
            headers: {
              ...corsHeaders,
              'Cache-Control': 'public, max-age=1800, stale-while-revalidate=3600',
            }
          })
          
        } catch (error) {
          console.error('Terms API error:', error)
          return Response.json(
            { error: '서버 오류가 발생했습니다.' },
            { status: 500, headers: corsHeaders }
          )
        }
      }
      
      // Better Auth 데이터베이스 쿼리 API
      if (url.pathname === '/api/db/query' && request.method === 'POST') {
        try {
          const body = await request.json()
          const { sql, params } = body
          
          if (!sql) {
            return Response.json(
              { error: 'SQL query is required' }, 
              { status: 400, headers: corsHeaders }
            )
          }
          
          const db = env.DB // Development와 Production 모두 DB 바인딩 사용
          
          let result
          if (params && params.length > 0) {
            result = await db.prepare(sql).bind(...params).all()
          } else {
            result = await db.prepare(sql).all()
          }
          
          return Response.json({
            success: true,
            results: result.results,
            meta: result.meta
          }, { headers: corsHeaders })
          
        } catch (error) {
          console.error('Database query error:', error)
          return Response.json(
            { error: '데이터베이스 쿼리 중 오류가 발생했습니다', success: false },
            { status: 500, headers: corsHeaders }
          )
        }
      }
      
      // 사용자 이메일로 조회 API
      if (url.pathname === '/api/auth/user-by-email' && request.method === 'GET') {
        try {
          const db = env.DB // Development와 Production 모두 DB 바인딩 사용
          const email = url.searchParams.get('email')
          
          if (!email) {
            return Response.json(
              { error: 'Email parameter is required' }, 
              { status: 400, headers: corsHeaders }
            )
          }
          
          const user = await db
            .prepare('SELECT id, email, name, role FROM users WHERE email = ?')
            .bind(email)
            .first()
          
          if (!user) {
            return Response.json(
              { error: 'User not found' }, 
              { status: 404, headers: corsHeaders }
            )
          }
          
          return Response.json({ 
            data: user 
          }, { headers: corsHeaders })
          
        } catch (error) {
          console.error('User lookup error:', error)
          return Response.json(
            { error: '사용자 조회 중 오류가 발생했습니다' },
            { status: 500, headers: corsHeaders }
          )
        }
      }
      
      // 관리자 CMS - 공지사항 API
      if (url.pathname.startsWith('/api/admin/cms/announcements')) {
        // GET /api/admin/cms/announcements - 목록 조회
        if (url.pathname === '/api/admin/cms/announcements' && request.method === 'GET') {
          try {
            const db = env.DB // Development와 Production 모두 DB 바인딩 사용
            
            // 필터링 파라미터
            const page = parseInt(url.searchParams.get('page') || '1')
            const limit = Math.min(parseInt(url.searchParams.get('limit') || '10'), 50)
            const offset = (page - 1) * limit
            const type = url.searchParams.get('type')
            const status = url.searchParams.get('status') // 'published', 'draft', 'all'
            
            let query = `
              SELECT 
                id, title, content, type, is_important, is_published,
                created_at, updated_at, created_by, published_at, expires_at,
                view_count, sort_order
              FROM announcements 
              WHERE 1=1
            `
            
            const params = []
            
            // 타입 필터
            if (type && type !== 'all') {
              query += ` AND type = ?`
              params.push(type)
            }
            
            // 발행 상태 필터
            if (status === 'published') {
              query += ` AND is_published = 1`
            } else if (status === 'draft') {
              query += ` AND is_published = 0`
            }
            
            query += ` ORDER BY is_important DESC, sort_order DESC, created_at DESC`
            query += ` LIMIT ? OFFSET ?`
            params.push(limit, offset)
            
            const announcements = await db.prepare(query).bind(...params).all()
            
            // 총 개수 조회
            let countQuery = 'SELECT COUNT(*) as count FROM announcements WHERE 1=1'
            const countParams = []
            
            if (type && type !== 'all') {
              countQuery += ` AND type = ?`
              countParams.push(type)
            }
            
            if (status === 'published') {
              countQuery += ` AND is_published = 1`
            } else if (status === 'draft') {
              countQuery += ` AND is_published = 0`
            }
            
            const totalCount = await db.prepare(countQuery).bind(...countParams).first()
            
            return Response.json({
              data: announcements.results || [],
              pagination: {
                page,
                limit,
                total: totalCount?.count || 0,
                totalPages: Math.ceil((totalCount?.count || 0) / limit)
              },
              success: true
            }, { headers: corsHeaders })
          } catch (error) {
            console.error('Admin announcements fetch error:', error)
            return Response.json(
              { error: 'Failed to fetch announcements', success: false },
              { status: 500, headers: corsHeaders }
            )
          }
        }
        
        // POST /api/admin/cms/announcements - 새 공지사항 생성
        if (url.pathname === '/api/admin/cms/announcements' && request.method === 'POST') {
          try {
            const db = env.DB // Development와 Production 모두 DB 바인딩 사용
            const body = await request.json()
            
            const { 
              title, content, type = 'general', 
              is_important = false, is_published = false,
              expires_at, sort_order = 0 
            } = body
            
            if (!title || !content) {
              return Response.json(
                { error: 'Title and content are required', success: false },
                { status: 400, headers: corsHeaders }
              )
            }
            
            const result = await db
              .prepare(`
                INSERT INTO announcements (
                  title, content, type, is_important, is_published,
                  created_by, published_at, expires_at, sort_order
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
              `)
              .bind(
                title, content, type, is_important ? 1 : 0, is_published ? 1 : 0,
                'admin@gameplaza.kr',
                is_published ? new Date().toISOString() : null,
                expires_at, sort_order
              )
              .run()
            
            return Response.json({
              data: { id: result.meta?.last_row_id },
              success: true
            }, { headers: corsHeaders })
          } catch (error) {
            console.error('Admin announcement create error:', error)
            return Response.json(
              { error: 'Failed to create announcement', success: false },
              { status: 500, headers: corsHeaders }
            )
          }
        }
        
        // PUT /api/admin/cms/announcements/:id - 공지사항 수정
        if (request.method === 'PUT') {
          const pathParts = url.pathname.split('/')
          const id = pathParts[pathParts.length - 1]
          
          try {
            const db = env.DB // Development와 Production 모두 DB 바인딩 사용
            const body = await request.json()
            
            const { 
              title, content, type, 
              is_important, is_published,
              expires_at, sort_order 
            } = body
            
            // 기존 공지사항 확인
            const existing = await db
              .prepare('SELECT * FROM announcements WHERE id = ?')
              .bind(id)
              .first()
            
            if (!existing) {
              return Response.json(
                { error: 'Announcement not found', success: false },
                { status: 404, headers: corsHeaders }
              )
            }
            
            // 발행 상태가 변경되면 published_at 업데이트
            let publishedAt = existing.published_at
            if (is_published && !existing.is_published) {
              publishedAt = new Date().toISOString()
            } else if (!is_published && existing.is_published) {
              publishedAt = null
            }
            
            await db
              .prepare(`
                UPDATE announcements SET
                  title = ?, content = ?, type = ?, 
                  is_important = ?, is_published = ?,
                  expires_at = ?, sort_order = ?, published_at = ?
                WHERE id = ?
              `)
              .bind(
                title, content, type,
                is_important ? 1 : 0, is_published ? 1 : 0,
                expires_at, sort_order, publishedAt, id
              )
              .run()
            
            return Response.json({
              data: { id: parseInt(id) },
              success: true
            }, { headers: corsHeaders })
          } catch (error) {
            console.error('Admin announcement update error:', error)
            return Response.json(
              { error: 'Failed to update announcement', success: false },
              { status: 500, headers: corsHeaders }
            )
          }
        }
        
        // DELETE /api/admin/cms/announcements/:id - 공지사항 삭제
        if (request.method === 'DELETE') {
          const pathParts = url.pathname.split('/')
          const id = pathParts[pathParts.length - 1]
          
          try {
            const db = env.DB // Development와 Production 모두 DB 바인딩 사용
            
            const result = await db
              .prepare('DELETE FROM announcements WHERE id = ?')
              .bind(id)
              .run()
            
            if (result.meta?.changes === 0) {
              return Response.json(
                { error: 'Announcement not found', success: false },
                { status: 404, headers: corsHeaders }
              )
            }
            
            return Response.json({
              data: { deleted: true },
              success: true
            }, { headers: corsHeaders })
          } catch (error) {
            console.error('Admin announcement delete error:', error)
            return Response.json(
              { error: 'Failed to delete announcement', success: false },
              { status: 500, headers: corsHeaders }
            )
          }
        }
      }

      // 관리자 CMS - 비즈니스 정보 API
      if (url.pathname === '/api/admin/cms/business-info') {
        if (request.method === 'GET') {
          try {
            const db = env.DB // Development와 Production 모두 DB 바인딩 사용
            
            // 비즈니스 기본 정보 조회
            const businessInfo = await db.prepare(`
              SELECT * FROM business_info WHERE id = 1
            `).first()

            if (!businessInfo) {
              return Response.json(
                { error: '비즈니스 정보를 찾을 수 없습니다.' },
                { status: 404, headers: corsHeaders }
              )
            }

            // 소셜 링크 조회
            const socialLinks = await db.prepare(`
              SELECT * FROM social_links 
              WHERE business_info_id = ? 
              ORDER BY sort_order ASC
            `).bind(1).all()

            // 영업시간 조회  
            const operatingHours = await db.prepare(`
              SELECT * FROM operating_hours 
              WHERE business_info_id = ? 
              ORDER BY day_of_week ASC
            `).bind(1).all()

            // transportation_info JSON 파싱
            let transportationInfo = {}
            if (businessInfo.transportation_info) {
              try {
                transportationInfo = JSON.parse(businessInfo.transportation_info as string)
              } catch (error) {
                console.error('Failed to parse transportation_info:', error)
              }
            }

            const response = {
              id: businessInfo.id,
              name: businessInfo.name,
              description: businessInfo.description,
              address: businessInfo.address,
              phone: businessInfo.phone,
              email: businessInfo.email,
              website: businessInfo.website,
              kakaoChat: businessInfo.kakao_chat_url,
              maps: {
                naver: businessInfo.naver_map_url || businessInfo.map_naver,
                kakao: businessInfo.kakao_map_url || businessInfo.map_kakao,
                google: businessInfo.google_map_url || businessInfo.map_google
              },
              transportation: transportationInfo,
              parking: businessInfo.parking_info,
              socialLinks: (socialLinks.results || []).map((link: any) => ({
                id: link.id,
                platform: link.platform,
                name: link.name || link.label,
                url: link.url,
                description: link.description,
                icon: link.icon_name || link.icon,
                bgColor: link.bg_color,
                hoverColor: link.hover_color,
                textColor: link.text_color,
                sortOrder: link.sort_order,
                isActive: Boolean(link.is_active)
              })),
              operatingHours: (operatingHours.results || []).map((hours: any) => ({
                id: hours.id,
                dayOfWeek: hours.day_of_week,
                openTime: hours.open_time,
                closeTime: hours.close_time,
                isClosed: Boolean(hours.is_closed),
                specialNote: hours.special_note
              })),
              createdAt: businessInfo.created_at,
              updatedAt: businessInfo.updated_at
            }

            return Response.json(response, { headers: corsHeaders })

          } catch (error) {
            console.error('Admin CMS 비즈니스 정보 조회 오류:', error)
            return Response.json(
              { error: '비즈니스 정보 조회 중 오류가 발생했습니다.' },
              { status: 500, headers: corsHeaders }
            )
          }
        }
        
        if (request.method === 'PUT') {
          try {
            const body = await request.json()
            const {
              name,
              description,
              address,
              phone,
              email,
              website,
              kakaoChat,
              maps,
              transportation,
              parking,
              socialLinks,
              operatingHours
            } = body

            const db = env.DB // Development와 Production 모두 DB 바인딩 사용

            // 트랜잭션으로 업데이트
            const statements = []

            // 비즈니스 기본 정보 업데이트
            statements.push(db.prepare(`
              UPDATE business_info 
              SET 
                name = ?,
                description = ?,
                address = ?,
                phone = ?,
                email = ?,
                website = ?,
                transportation_info = ?,
                updated_at = CURRENT_TIMESTAMP
              WHERE id = 1
            `).bind(
              name,
              description,
              address,
              phone || '',
              email || '',
              website || '',
              JSON.stringify(transportation)
            ))

            // 소셜 링크 업데이트
            if (socialLinks && Array.isArray(socialLinks)) {
              // 기존 소셜 링크 삭제
              statements.push(db.prepare('DELETE FROM social_links WHERE business_info_id = 1'))

              // 새 소셜 링크 삽입
              socialLinks.forEach((link: any, index: number) => {
                statements.push(db.prepare(`
                  INSERT INTO social_links (
                    business_info_id, platform, url, icon, label, description, sort_order
                  ) VALUES (?, ?, ?, ?, ?, ?, ?)
                `).bind(
                  1,
                  link.platform,
                  link.url,
                  link.icon || link.platform,
                  link.name || link.label,
                  link.description || '',
                  link.sortOrder || index
                ))
              })
            }

            // 영업시간 업데이트
            if (operatingHours && Array.isArray(operatingHours)) {
              // 기존 영업시간 삭제
              statements.push(db.prepare('DELETE FROM operating_hours WHERE business_info_id = 1'))

              // 새 영업시간 삽입
              operatingHours.forEach((hours: any) => {
                statements.push(db.prepare(`
                  INSERT INTO operating_hours (
                    business_info_id, day_of_week, open_time, close_time, is_closed, special_hours
                  ) VALUES (?, ?, ?, ?, ?, ?)
                `).bind(
                  1,
                  hours.dayOfWeek,
                  hours.openTime,
                  hours.closeTime,
                  hours.isClosed ? 1 : 0,
                  hours.specialNote || null
                ))
              })
            }

            // 모든 쿼리 실행
            await db.batch(statements)

            return Response.json({
              message: '비즈니스 정보가 성공적으로 업데이트되었습니다.',
              data: {
                id: 1,
                updatedAt: new Date().toISOString()
              }
            }, { headers: corsHeaders })

          } catch (error) {
            console.error('Admin CMS 비즈니스 정보 업데이트 오류:', error)
            return Response.json(
              { error: '비즈니스 정보 업데이트 중 오류가 발생했습니다.' },
              { status: 500, headers: corsHeaders }
            )
          }
        }
      }
      
      // 루트 경로
      if (url.pathname === '/') {
        return Response.json({
          message: 'Gameplaza Workers API',
          version: '1.0.0',
          endpoints: ['/api/health']
        }, { headers: corsHeaders })
      }
      
      // 404 처리
      return Response.json(
        { error: 'Not Found', path: url.pathname }, 
        { status: 404, headers: corsHeaders }
      )
      
    } catch (error) {
      console.error('Worker error:', error)
      return Response.json(
        { error: 'Internal Server Error' },
        { status: 500, headers: corsHeaders }
      )
    }
  }
}