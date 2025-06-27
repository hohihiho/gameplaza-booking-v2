/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ['@supabase/supabase-js'],
  images: {
    domains: ['localhost', 'rupeyejnfurlcpgneekg.supabase.co', 'lh3.googleusercontent.com'],
  },
}

module.exports = nextConfig