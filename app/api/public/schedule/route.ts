import { NextResponse } from 'next/server';

// Public monthly schedule + reservations summary
// If CF_DB_API_BASE is set, proxy to the Cloudflare Worker (D1-backed).
// Otherwise, return safe empty datasets to keep the UI functional.
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const year = searchParams.get('year');
    const month = searchParams.get('month');

    if (!year || !month) {
      return NextResponse.json({ error: '년월 정보가 필요합니다' }, { status: 400 });
    }

    // If external Worker API configured, fetch from there
    const base = process.env.CF_DB_API_BASE || process.env.EXTERNAL_API_BASE;
    if (base) {
      try {
        const url = `${base.replace(/\/$/, '')}/public/schedule?year=${encodeURIComponent(year)}&month=${encodeURIComponent(month)}`;
        const res = await fetch(url, { headers: { 'accept': 'application/json' } });
        if (res.ok) {
          const data = await res.json();
          return NextResponse.json(data);
        }
        console.error('Worker proxy failed:', res.status, await safeText(res));
      } catch (e) {
        console.error('Worker proxy error:', e);
      }
    }

    // Return empty arrays until DB filtering is implemented for D1
    return NextResponse.json({
      scheduleEvents: [],
      reservations: [],
      devices: []
    });
  } catch (error) {
    console.error('API 오류:', error);
    return NextResponse.json({ error: '서버 오류가 발생했습니다' }, { status: 500 });
  }
}

async function safeText(res: Response) {
  try { return await res.text(); } catch { return ''; }
}
