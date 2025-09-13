import { NextResponse } from 'next/server'
import {
  d1ListDeviceCategories,
  d1ListDeviceTypes,
  d1ListDevicesByType,
  d1ListPlayModesByType,
  d1ListActiveReservationsForToday,
  d1ListActiveMachineRules
} from '@/lib/db/d1'

export async function GET() {
  try {
    // Load base entities
    const [categories, deviceTypes, activeReservations, rules] = await Promise.all([
      d1ListDeviceCategories(),
      d1ListDeviceTypes(),
      d1ListActiveReservationsForToday(),
      d1ListActiveMachineRules()
    ])

    // Index reservations by device_id for quick lookup
    const resvByDevice = new Map<string, any>()
    for (const r of activeReservations as any[]) {
      if (r?.device_id) resvByDevice.set(String(r.device_id), r)
    }

    // Build category map
    const catMap = new Map<string, any>()
    for (const c of categories as any[]) {
      catMap.set(String(c.id), {
        id: String(c.id),
        name: c.name,
        display_order: Number(c.display_order ?? 0),
        deviceTypes: [] as any[]
      })
    }

    // For each device type, attach devices and play modes
    for (const t of deviceTypes as any[]) {
      const devices = await d1ListDevicesByType(Number(t.id))
      const playModes = await d1ListPlayModesByType(Number(t.id))

      const formatted = {
        id: String(t.id),
        name: t.name,
        company: '',
        description: t.description ?? '',
        model_name: t.model_name ?? null,
        version_name: t.version_name ?? null,
        is_rentable: !!(t.is_rentable ?? 0),
        total_count: Array.isArray(devices) ? devices.length : 0,
        devices: (devices as any[]).map(d => {
          const r = resvByDevice.get(String(d.id))
          return {
            id: String(d.id),
            device_number: Number(d.device_number ?? 0),
            status: d.status as 'available' | 'in_use' | 'maintenance' | 'reserved' | 'broken',
            reservation_info: r
              ? {
                  start_time: r.start_time,
                  end_time: r.end_time,
                  user_name: 'Unknown',
                  is_checked_in: r.status === 'checked_in'
                }
              : undefined
          }
        }),
        category_id: String(t.category_id ?? ''),
        display_order: Number(t.display_order ?? 0),
        rental_settings: t.rental_settings ?? null,
        play_modes: (playModes as any[]).map(pm => ({
          id: pm.id,
          name: pm.name,
          price: Number(pm.price ?? 0),
          display_order: Number(pm.display_order ?? 0)
        }))
      }

      const catId = String(t.category_id ?? '')
      if (!catMap.has(catId)) {
        // In case device type references a missing category, create a placeholder
        catMap.set(catId, {
          id: catId,
          name: '기타',
          display_order: 9999,
          deviceTypes: [] as any[]
        })
      }
      catMap.get(catId).deviceTypes.push(formatted)
    }

    // Sort device types by display_order inside each category
    const categoriesOut = Array.from(catMap.values())
      .map(c => ({
        ...c,
        deviceTypes: c.deviceTypes.sort((a: any, b: any) => (a.display_order ?? 0) - (b.display_order ?? 0))
      }))
      .sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0))

    return NextResponse.json({
      success: true,
      categories: categoriesOut,
      rules: rules ?? []
    })
  } catch (error) {
    console.error('GET /api/public/machines error:', error)
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 })
  }
}

