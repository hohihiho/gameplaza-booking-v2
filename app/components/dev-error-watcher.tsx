"use client"
import { useEffect } from 'react'
import toast from 'react-hot-toast'

// Lightweight dev-only error watcher to surface runtime errors quickly
export default function DevErrorWatcher() {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'development' && process.env.NEXT_PUBLIC_TEST_MODE !== 'true') return

    const onError = (event: ErrorEvent) => {
      const msg = event?.error?.stack || event?.message || 'Unknown error'
      toast.error(`Runtime error: ${msg}`)
    }
    const onRejection = (event: PromiseRejectionEvent) => {
      const reason = (event?.reason && (event.reason.stack || event.reason.message)) || String(event?.reason)
      toast.error(`Unhandled rejection: ${reason}`)
    }
    const originalConsoleError = console.error
    const originalConsoleWarn = console.warn

    console.error = (...args: any[]) => {
      originalConsoleError(...args)
      toast.error(`console.error: ${args.map(String).join(' ')}`)
    }
    console.warn = (...args: any[]) => {
      originalConsoleWarn(...args)
      toast(`console.warn: ${args.map(String).join(' ')}`)
    }

    window.addEventListener('error', onError)
    window.addEventListener('unhandledrejection', onRejection)

    return () => {
      window.removeEventListener('error', onError)
      window.removeEventListener('unhandledrejection', onRejection)
      console.error = originalConsoleError
      console.warn = originalConsoleWarn
    }
  }, [])

  return null
}

