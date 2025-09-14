"use client"

type Device = {
  id: string
  name?: string
  device_number?: number
  status?: string
}

export type DeviceSelectorProps = {
  devices?: Device[]
  value?: string | number
  onChange?: (value: string | number) => void
  className?: string
}

export function DeviceSelector({ devices = [], value, onChange, className }: DeviceSelectorProps) {
  // Minimal placeholder to satisfy imports and basic selection needs.
  return (
    <div className={className}>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        기기 선택
      </label>
      <select
        value={value === undefined ? '' : String(value)}
        onChange={(e) => onChange?.(e.target.value)}
        className="w-full px-3 py-2 rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
      >
        <option value="" disabled>
          기기를 선택하세요
        </option>
        {devices.map((d) => (
          <option key={d.id} value={d.device_number ?? d.id}>
            {d.name || `#${d.device_number}`}
          </option>
        ))}
      </select>
    </div>
  )
}

export default DeviceSelector

