const withPWA = require('next-pwa')({
    dest: 'public',
    disable: process.env.NODE_ENV === 'development',
    register: true,
    skipWaiting: true,
    importScripts: ['/sw-custom.js'],
})

/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,

    // ==========================================
    // DEVELOPMENT CONFIG
    // ==========================================
    experimental: {
        allowedDevOrigins: [
            'localhost:3000',
            'sync.medtechbiyomedikal.com.tr',
            'medtechbiyomedikal.com.tr'
        ],
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
            // API routes - no caching
            {
                source: '/api/:path*',
                headers: [
                    {
                        key: 'Cache-Control',
                        value: 'no-store, no-cache, must-revalidate, proxy-revalidate'
                    },
                    {
                        key: 'Pragma',
                        value: 'no-cache'
                    },
                    {
                        key: 'Expires',
                        value: '0'
                    }
                ],
            },
            // Dashboard pages - no caching for dynamic content
            {
                source: '/dashboard/:path*',
                headers: [
                    {
                        key: 'Cache-Control',
                        value: 'no-store, no-cache, must-revalidate'
                    }
                ],
            },
            // Static assets - long cache (images, fonts, etc.)
            {
                source: '/_next/static/:path*',
                headers: [
                    {
                        key: 'Cache-Control',
                        value: 'public, max-age=31536000, immutable'
                    }
                ],
            },
            // All other routes - security headers only
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
                    }
                ],
            },
        ]
    },
}

module.exports = withPWA(nextConfig)
