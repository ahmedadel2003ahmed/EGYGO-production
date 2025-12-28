/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    NEXT_PUBLIC_BASE_URL: process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000',
  },
  images: {
    domains: ['localhost'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '3000',
      }
    ],
  },
  // Optional: Proxy API requests in development to avoid CORS
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'https://egygo-backend-production.up.railway.app/api/:path*',
      },
    ];
  },
};

export default nextConfig;
