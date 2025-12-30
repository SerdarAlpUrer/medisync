/**
 * Networking Utilities
 * Helps determine the base URL for the application, especially for QR code generation
 */

export const getBaseUrl = () => {
    // 1. Check if an environment variable is set (highest priority)
    if (process.env.NEXT_PUBLIC_APP_URL) {
        return process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, '');
    }

    // 2. Check for a detected server IP (set by layout.tsx)
    if (typeof window !== 'undefined' && (window as any).__SERVER_IP__) {
        const port = window.location.port || process.env.NEXT_PUBLIC_APP_PORT || '3000';
        return `http://${(window as any).__SERVER_IP__}:${port}`;
    }

    // 3. Check for a saved detected IP in session storage
    if (typeof window !== 'undefined') {
        const savedIp = sessionStorage.getItem('detected_server_ip');
        if (savedIp) {
            const port = window.location.port || process.env.NEXT_PUBLIC_APP_PORT || '3000';
            return `http://${savedIp}:${port}`;
        }
    }

    // 4. Fallback to current browser origin
    if (typeof window !== 'undefined') {
        const origin = window.location.origin;
        // If we're on localhost but want others to connect, we still need the IP.
        // But for now, returning origin is the safest default if nothing else is found.
        return origin;
    }

    // 5. Hardcoded fallback for server-side rendering
    return 'http://localhost:3000';
};
