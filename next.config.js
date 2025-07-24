/** @type {import('next').NextConfig} */
const nextConfig = {
  // Optimize performance
  poweredByHeader: false,
  compress: true,
  output: 'standalone',
  
  // Strict build mode - stop on errors
  eslint: {
    ignoreDuringBuilds: false,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  
  // PWA and deployment optimizations
  experimental: {
    // optimizeCss: true, // Disabled due to build issues
    // optimizeServerReact: true, // Disabled due to build issues
  },
  
  // Images optimization
  images: {
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
  
  // Security headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: process.env.NODE_ENV === 'development' 
              ? 'camera=(), microphone=*, geolocation=()'  // Más permisivo en desarrollo
              : 'camera=(), microphone=(self), geolocation=()',  // Restrictivo en producción
          },
        ],
      },
      {
        source: '/sw.js',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=0, must-revalidate',
          },
          {
            key: 'Service-Worker-Allowed',
            value: '/',
          },
        ],
      },
      {
        source: '/manifest.json',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ]
  },
};

module.exports = nextConfig;