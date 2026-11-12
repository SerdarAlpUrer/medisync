/**
 * Networking Utilities
 * Helps determine the base URL for the application, especially for QR code generation
 */

export const getBaseUrl = () => {
    // 1. Check if an environment variable is set (highest priority)
    if (process.env.NEXT_PUBLIC_APP_URL) {
        return process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, '');
    }

    // Determine current protocol dynamically (https if page is loaded over https, else http)
    const protocol = (typeof window !== 'undefined' && window.location.protocol) ? window.location.protocol : 'http:';

    // 2. Check for a detected server IP (set by layout.tsx)
    if (typeof window !== 'undefined' && (window as any).__SERVER_IP__) {
        const port = window.location.port || process.env.NEXT_PUBLIC_APP_PORT || (protocol === 'https:' ? '3443' : '3000');
        const portStr = (port === '80' || port === '443' || !port) ? '' : `:${port}`;
        return `${protocol}//${(window as any).__SERVER_IP__}${portStr}`;
    }

    // 3. Check for a saved detected IP in session storage
    if (typeof window !== 'undefined') {
        const savedIp = sessionStorage.getItem('detected_server_ip');
        if (savedIp) {
            const port = window.location.port || process.env.NEXT_PUBLIC_APP_PORT || (protocol === 'https:' ? '3443' : '3000');
            const portStr = (port === '80' || port === '443' || !port) ? '' : `:${port}`;
            return `${protocol}//${savedIp}${portStr}`;
        }
    }

    // 4. Fallback to current browser origin
    if (typeof window !== 'undefined') {
        return window.location.origin;
    }

    // 5. Hardcoded fallback for server-side rendering
    return 'http://localhost:3000';
};
