/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    appDir: true,
    serverComponentsExternalPackages: ['@supabase/supabase-js']
  },
  images: {
    domains: ['localhost', 'rupeyejnfurlcpgneekg.supabase.co'],
  },
}

module.exports = nextConfig