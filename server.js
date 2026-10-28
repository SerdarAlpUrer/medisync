const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const os = require('os');
const next = require('next');
const selfsigned = require('selfsigned');

process.env.NODE_ENV = process.env.NODE_ENV || 'production';
const dev = process.env.NODE_ENV === 'development';
const HTTP_PORT = parseInt(process.env.PORT || '3000', 10);
const HTTPS_PORT = parseInt(process.env.HTTPS_PORT || '3443', 10);
const HOST = process.env.HOST || '0.0.0.0';

// Ensure certificate directory and generate self-signed cert if missing
async function getOrCreateCertificates() {
    const certDir = path.join(process.cwd(), 'certificates');
    const keyPath = path.join(certDir, 'server.key');
    const certPath = path.join(certDir, 'server.crt');

    if (fs.existsSync(keyPath) && fs.existsSync(certPath)) {
        try {
            const key = fs.readFileSync(keyPath, 'utf8');
            const cert = fs.readFileSync(certPath, 'utf8');
            if (key.length > 50 && cert.length > 50) {
                return { key, cert };
            }
        } catch (e) {
            console.warn('Mevcut SSL sertifikası okunamadı, yeniden oluşturuluyor...');
        }
    }

    if (!fs.existsSync(certDir)) {
        fs.mkdirSync(certDir, { recursive: true });
    }

    console.log('🔒 HTTPS için yerel ağ ve mobil cihaz uyumlu SSL sertifikası oluşturuluyor...');

    // Collect all local IPv4 addresses for SAN (Subject Alternative Names)
    const interfaces = os.networkInterfaces();
    const altNames = [
        { type: 2, value: 'localhost' },
        { type: 2, value: 'medisync.local' },
        { type: 7, ip: '127.0.0.1' }
    ];

    for (const name of Object.keys(interfaces)) {
        for (const net of interfaces[name] || []) {
            if (net.family === 'IPv4' && !altNames.some(a => a.ip === net.address)) {
                altNames.push({ type: 7, ip: net.address });
            }
        }
    }

    const attrs = [
        { name: 'commonName', value: 'medisync.local' }
    ];

    const pems = await selfsigned.generate(attrs, {
        days: 3650, // 10 years validity
        keySize: 2048,
        extensions: [
            {
                name: 'subjectAltName',
                altNames: altNames
            }
        ]
    });

    fs.writeFileSync(keyPath, pems.private, 'utf8');
    fs.writeFileSync(certPath, pems.cert, 'utf8');
    console.log(`✅ SSL sertifikası hazırlandı: ${certPath}`);

    return { key: pems.private, cert: pems.cert };
}

async function main() {
    console.log('🚀 MediSync sunucusu başlatılıyor...');

    const app = next({ dev, dir: process.cwd(), hostname: HOST });
    const handle = app.getRequestHandler();

    await app.prepare();

    // 1. Start HTTP Server
    const httpServer = http.createServer((req, res) => {
        handle(req, res);
    });

    httpServer.listen(HTTP_PORT, HOST, () => {
        console.log(`🌐 HTTP Sunucu: http://localhost:${HTTP_PORT}`);
    });

    // 2. Start HTTPS Server
    try {
        const sslOptions = await getOrCreateCertificates();
        const httpsServer = https.createServer(sslOptions, (req, res) => {
            if (!req.headers['x-forwarded-proto']) {
                req.headers['x-forwarded-proto'] = 'https';
            }
            if (!req.headers['x-forwarded-port']) {
                req.headers['x-forwarded-port'] = String(HTTPS_PORT);
            }
            handle(req, res);
        });

        httpsServer.listen(HTTPS_PORT, HOST, () => {
            const interfaces = os.networkInterfaces();
            const ips = [];
            for (const name of Object.keys(interfaces)) {
                for (const net of interfaces[name] || []) {
                    if (net.family === 'IPv4' && net.address !== '127.0.0.1') {
                        ips.push(net.address);
                    }
                }
            }

            console.log('\n=============================================================');
            console.log('🔒 MediSync Güvenli HTTPS Sunucusu Aktif! (Kamera Erişimi)');
            console.log(`   Yerel (Bu PC)        : https://localhost:${HTTPS_PORT}`);
            ips.forEach(ip => {
                console.log(`   Mobil / Ağ (Kamera)  : https://${ip}:${HTTPS_PORT}`);
            });
            console.log('=============================================================\n');
        });
    } catch (err) {
        console.error('⚠️ HTTPS sunucusu başlatılamadı:', err.message);
        console.log('ℹ️ HTTP sunucusu üzerinden çalışmaya devam ediliyor.');
    }
}

main().catch(err => {
    console.error('Kritik sunucu hatası:', err);
    process.exit(1);
});
