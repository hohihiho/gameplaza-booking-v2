/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ['@supabase/supabase-js'],
  images: {
    domains: ['localhost', 'rupeyejnfurlcpgneekg.supabase.co'],
  },
}

module.exports = nextConfig