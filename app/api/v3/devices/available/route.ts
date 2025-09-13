import { NextResponse } from 'next/server'
import { d1ListAvailableDevices } from '@/lib/db/d1'

export async function GET() {
  const list = await d1ListAvailableDevices()
  return NextResponse.json({ devices: list })
}

