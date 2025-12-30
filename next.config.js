const withPWA = require('next-pwa')({
    dest: 'public',
    disable: process.env.NODE_ENV === 'development',
    register: true,
    skipWaiting: true,
})

/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,

    // Enable instrumentation for backup scheduler
    experimental: {
        instrumentationHook: true,
    },

    // ==========================================
    // PERFORMANCE OPTIMIZATIONS
    // ==========================================

    // Enable gzip compression
    compress: true,

    // Optimize images
    images: {
        formats: ['image/avif', 'image/webp'],
        minimumCacheTTL: 60 * 60 * 24 * 30, // 30 days
        deviceSizes: [640, 750, 828, 1080, 1200],
        imageSizes: [16, 32, 48, 64, 96, 128, 256],
    },

    // Reduce bundle size
    swcMinify: true,

    // Optimize production builds
    productionBrowserSourceMaps: false,

    // Optimize module resolution
    modularizeImports: {
        'lucide-react': {
            transform: 'lucide-react/dist/esm/icons/{{member}}',
        },
    },

    // Security Headers
    async headers() {
        return [
            {
                source: '/:path*',
                headers: [
                    {
                        key: 'X-DNS-Prefetch-Control',
                        value: 'on'
                    },
                    {
                        key: 'Strict-Transport-Security',
                        value: 'max-age=63072000; includeSubDomains; preload'
                    },
                    {
                        key: 'X-Frame-Options',
                        value: 'SAMEORIGIN'
                    },
                    {
                        key: 'X-Content-Type-Options',
                        value: 'nosniff'
                    },
                    {
                        key: 'X-XSS-Protection',
                        value: '1; mode=block'
                    },
                    {
                        key: 'Referrer-Policy',
                        value: 'origin-when-cross-origin'
                    },
                    {
                        key: 'Permissions-Policy',
                        value: 'camera=(self), microphone=(), geolocation=()'
                    },
                    {
                        key: 'Content-Security-Policy',
                        value: "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https:; connect-src 'self'; frame-ancestors 'self';"
                    },
                    // Cache static assets
                    {
                        key: 'Cache-Control',
                        value: 'public, max-age=31536000, immutable'
                    }
                ],
            },
        ]
    },
}

module.exports = withPWA(nextConfig)
