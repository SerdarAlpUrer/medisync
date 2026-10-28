# Deployment Guide

BioMedicApp Production Deployment Guide

## Prerequisites

- Node.js 18+ installed
- PostgreSQL 14+ (or SQLite for development)
- Environment variables configured
- Domain name and SSL certificate (for production)

## Environment Setup

### 1. Environment Variables

Create `.env` file in project root:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/biomedicapp"

# NextAuth
NEXTAUTH_SECRET="your-super-secret-key-min-32-chars"
NEXTAUTH_URL="https://yourdomain.com"

# Application
NODE_ENV="production"

# Email (Optional)
EMAIL_ENABLED="true"
SMTP_HOST="smtp.example.com"
SMTP_PORT="587"
SMTP_USER="your-email@example.com"
SMTP_PASSWORD="your-password"

# Rate Limiting
RATE_LIMIT_MAX_REQUESTS="100"
RATE_LIMIT_WINDOW_MS="60000"

# Logging
LOG_LEVEL="info"
```

### 2. Database Setup

#### PostgreSQL (Production)

```bash
# Create database
createdb biomedicapp

# Run migrations
npm run db:migrate

# (Optional) Seed initial data
npm run db:seed
```

#### SQLite (Development)

```bash
# Database will be created automatically
npm run db:push
```

## Build and Deploy

### 1. Install Dependencies

```bash
npm install
```

### 2. Build Application

```bash
npm run build
```

### 3. Start Production Server

```bash
npm start
```

### Using PM2 (Recommended)

```bash
# Install PM2
npm install -g pm2

# Start application
pm2 start npm --name "biomedicapp" -- start

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
pm2 startup
```

### Using Docker

Create `Dockerfile`:

```dockerfile
FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# Production image
FROM base AS runner
WORKDIR /app
ENV NODE_ENV production
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000
ENV PORT 3000
CMD ["node", "server.js"]
```

Build and run:

```bash
docker build -t biomedicapp .
docker run -p 3000:3000 --env-file .env biomedicapp
```

## Reverse Proxy (Nginx)

Example Nginx configuration:

```nginx
server {
    listen 80;
    server_name yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## Security Checklist

- [ ] Change `NEXTAUTH_SECRET` to a strong random string (min 32 chars)
- [ ] Use HTTPS in production
- [ ] Set secure cookies
- [ ] Enable rate limiting
- [ ] Configure CORS properly
- [ ] Set up firewall rules
- [ ] Regular database backups
- [ ] Monitor error logs
- [ ] Keep dependencies updated

## Monitoring

### Health Check Endpoint

Create `app/api/health/route.ts`:

```typescript
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`
    return NextResponse.json({ status: 'ok', timestamp: new Date().toISOString() })
  } catch (error) {
    return NextResponse.json({ status: 'error' }, { status: 500 })
  }
}
```

### Logging

- Application logs: Check PM2 logs or Docker logs
- Error tracking: Integrate Sentry or similar
- Performance: Use APM tools

## Backup Strategy

### Database Backup

```bash
# PostgreSQL
pg_dump biomedicapp > backup_$(date +%Y%m%d).sql

# SQLite
cp prisma/dev.db prisma/backup_$(date +%Y%m%d).db
```

### Automated Backups

Set up cron job for daily backups:

```bash
0 2 * * * /path/to/backup-script.sh
```

## Troubleshooting

### Common Issues

1. **Database Connection Error**
   - Check DATABASE_URL
   - Verify database is running
   - Check firewall rules

2. **Build Errors**
   - Clear `.next` folder
   - Delete `node_modules` and reinstall
   - Check Node.js version

3. **Rate Limiting Issues**
   - Adjust RATE_LIMIT_MAX_REQUESTS
   - Consider Redis for distributed rate limiting

4. **Memory Issues**
   - Increase Node.js memory: `NODE_OPTIONS=--max-old-space-size=4096`
   - Use PM2 with memory limits

## Performance Optimization

1. Enable Next.js Image Optimization
2. Use CDN for static assets
3. Implement Redis caching
4. Database query optimization
5. Enable compression (gzip/brotli)

## Updates and Maintenance

1. Regular dependency updates: `npm audit fix`
2. Database migrations: `npm run db:migrate`
3. Monitor error rates
4. Review and rotate logs
5. Security patches

