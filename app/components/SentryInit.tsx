"use client"
import Script from 'next/script'
import React from 'react'

declare global {
  interface Window {
    Sentry?: any
  }
}

export default function SentryInit() {
  const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN
  const release = process.env.NEXT_PUBLIC_BUILD_COMMIT || process.env.NEXT_PUBLIC_APP_VERSION || 'unknown'
  const environment = process.env.NODE_ENV || 'development'

  if (!dsn) return null

  return (
    <>
      <Script
        id="sentry-sdk"
        src="https://browser.sentry-cdn.com/7.120.0/bundle.tracing.replay.min.js"
        strategy="afterInteractive"
        crossOrigin="anonymous"
      />
      <Script id="sentry-init" strategy="afterInteractive">
        {`
          if (window.Sentry && !window.__SENTRY_INITIALIZED__) {
            window.__SENTRY_INITIALIZED__ = true;
            window.Sentry.init({
              dsn: ${JSON.stringify(dsn)},
              environment: ${JSON.stringify(environment)},
              release: ${JSON.stringify(release)},
              tracesSampleRate: 0.1,
              replaysSessionSampleRate: 0.0,
              replaysOnErrorSampleRate: 0.1
            });
          }
        `}
      </Script>
    </>
  )
}

