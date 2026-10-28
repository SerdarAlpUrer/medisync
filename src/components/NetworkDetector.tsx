
'use client';

import { useEffect } from 'react';

export default function NetworkDetector() {
    useEffect(() => {
        const detectIp = async () => {
            try {
                // Only detect if we are on localhost or if the IP isn't already known
                if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
                    const response = await fetch('/api/network-info');
                    if (response.ok) {
                        const data = await response.json();
                        if (data.primaryIp && data.primaryIp !== 'localhost') {
                            (window as any).__SERVER_IP__ = data.primaryIp;
                            sessionStorage.setItem('detected_server_ip', data.primaryIp);
                            console.log('Detected Server IP for QR codes:', data.primaryIp);
                        }
                    }
                }
            } catch (error) {
                console.error('Failed to detect network IP:', error);
            }
        };

        detectIp();
    }, []);

    return null;
}
