# Güvenlik ve Performans Audit Raporu

**Tarih**: 2025-01-XX  
**Versiyon**: RC1.6  
**Değerlendirme Kapsamı**: Güvenlik açıkları, performans sorunları ve iyileştirme önerileri

---

## 🔴 KRİTİK GÜVENLİK AÇIKLARI

### 1. Zayıf Şifre Politikası
**Risk Seviyesi**: YÜKSEK  
**Lokasyon**: `app/api/user/password/route.ts:21`, `app/api/users/route.ts`

**Sorun**:
- Minimum şifre uzunluğu sadece 6 karakter (çok zayıf)
- Şifre karmaşıklığı kontrolü yok (büyük/küçük harf, sayı, özel karakter)
- Şifre geçmişi kontrolü yok
- Şifre sıfırlama mekanizması yok

**Öneri**:
```typescript
// Minimum 12 karakter, karmaşıklık gereksinimleri
const passwordSchema = z.string()
  .min(12, 'Şifre en az 12 karakter olmalıdır')
  .regex(/[A-Z]/, 'En az bir büyük harf gerekli')
  .regex(/[a-z]/, 'En az bir küçük harf gerekli')
  .regex(/[0-9]/, 'En az bir rakam gerekli')
  .regex(/[^A-Za-z0-9]/, 'En az bir özel karakter gerekli')
```

### 2. Account Lockout Mekanizması Eksik
**Risk Seviyesi**: YÜKSEK  
**Lokasyon**: `app/api/auth/[...nextauth]/route.ts:44-53`

**Sorun**:
- `failedLoginAttempts` artırılıyor ama account lockout yok
- Brute force saldırılarına açık
- Rate limiting login endpoint'inde yok

**Öneri**:
```typescript
// 5 başarısız denemeden sonra hesabı kilitle
if (user.failedLoginAttempts >= 5) {
  throw new Error('Hesap geçici olarak kilitlendi. 30 dakika sonra tekrar deneyin.')
}
```

### 3. CSRF Koruması Yok
**Risk Seviyesi**: ORTA-YÜKSEK  
**Lokasyon**: Tüm POST/PUT/DELETE endpoint'leri

**Sorun**:
- CSRF token kontrolü yok
- NextAuth CSRF koruması var ama ekstra kontrol gerekli

**Öneri**: Next.js built-in CSRF protection kullan veya custom middleware ekle

### 4. Session Güvenliği
**Risk Seviyesi**: ORTA  
**Lokasyon**: `app/api/auth/[...nextauth]/route.ts`

**Sorun**:
- Session timeout yok
- Session fixation riski
- Secure cookie flags eksik olabilir

**Öneri**:
```typescript
session: {
  strategy: "jwt",
  maxAge: 8 * 60 * 60, // 8 saat
},
cookies: {
  sessionToken: {
    name: `__Secure-next-auth.session-token`,
    options: {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      secure: process.env.NODE_ENV === 'production'
    }
  }
}
```

### 5. Public Endpoint Güvenliği
**Risk Seviyesi**: YÜKSEK  
**Lokasyon**: `app/api/public/fault-report/route.ts`

**Sorun**:
- Rate limiting yok
- Input validation eksik
- CAPTCHA yok
- Spam koruması yok

**Öneri**: Rate limiting ve CAPTCHA ekle

### 6. Content Security Policy (CSP) Eksik
**Risk Seviyesi**: ORTA  
**Lokasyon**: `next.config.js`

**Sorun**:
- CSP header'ı yok
- XSS koruması yetersiz

**Öneri**: CSP header ekle

### 7. Sensitive Data Logging
**Risk Seviyesi**: ORTA  
**Lokasyon**: `app/api/auth/[...nextauth]/route.ts:32`

**Sorun**:
- Email adresleri loglanıyor (GDPR/KVKK riski)
- IP adresleri loglanıyor

**Öneri**: PII (Personally Identifiable Information) loglamayı kısıtla

### 8. File Upload Güvenliği
**Risk Seviyesi**: YÜKSEK  
**Lokasyon**: `lib/file-upload.ts` (yeni eklendi ama kullanılmıyor)

**Sorun**:
- File upload endpoint'leri güvenli değil
- Virus scanning yok
- File type validation yetersiz
- Path traversal riski

**Öneri**: File upload endpoint'lerini güvenli hale getir

---

## 🟡 ORTA SEVİYE GÜVENLİK SORUNLARI

### 9. CORS Configuration Eksik
**Risk Seviyesi**: ORTA  
**Lokasyon**: `next.config.js`

**Sorun**: CORS policy tanımlı değil

### 10. API Authentication Eksiklikleri
**Risk Seviyesi**: ORTA  
**Lokasyon**: Bazı API endpoint'leri

**Sorun**: Bazı endpoint'lerde authentication kontrolü eksik

### 11. Password Reset Mekanizması Yok
**Risk Seviyesi**: ORTA  
**Lokasyon**: Yok

**Sorun**: Kullanıcılar şifrelerini sıfırlayamıyor

### 12. Audit Log Tamper Protection
**Risk Seviyesi**: DÜŞÜK-ORTA  
**Lokasyon**: `lib/audit.ts`

**Sorun**: Hash verification mekanizması var ama düzenli kontrol yok

---

## ⚡ PERFORMANS SORUNLARI

### 1. Dashboard Query Optimizasyonu
**Risk Seviyesi**: YÜKSEK  
**Lokasyon**: `app/api/dashboard/route.ts:19-43`

**Sorun**:
- 4 ayrı `count()` query'si sıralı çalışıyor
- Her biri ayrı database round-trip
- Toplam 4+ query = yavaş response time

**Mevcut Kod**:
```typescript
const totalDevices = await prisma.device.count({ where: deviceWhere })
const activeDevices = await prisma.device.count({ where: { ...deviceWhere, status: 'ACTIVE' } })
const inMaintenance = await prisma.device.count({ where: { ...deviceWhere, status: 'MAINTENANCE' } })
const needsCalibration = await prisma.device.count({ where: { ...deviceWhere, OR: [...] } })
```

**Öneri**: Tek query ile tüm count'ları al:
```typescript
const [totalDevices, statusCounts, calibrationCount] = await Promise.all([
  prisma.device.count({ where: deviceWhere }),
  prisma.device.groupBy({
    by: ['status'],
    where: deviceWhere,
    _count: true
  }),
  prisma.device.count({ where: { ...deviceWhere, nextCalibrationDate: { lte: sevenDaysFromNow } } })
])
```

### 2. Database Connection Pooling Eksik
**Risk Seviyesi**: YÜKSEK  
**Lokasyon**: `lib/prisma.ts`

**Sorun**:
- Connection pool ayarları yok
- Production'da connection exhaustion riski
- SQLite kullanılıyor (production için uygun değil)

**Öneri**:
```typescript
export const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
  // Connection pool settings for PostgreSQL
  // SQLite doesn't support connection pooling
})
```

### 3. Prisma Query Logging Production'da Açık
**Risk Seviyesi**: ORTA  
**Lokasyon**: `lib/prisma.ts:10`

**Sorun**: Production'da query logging performans etkisi yaratır

**Öneri**: Sadece development'ta aç

### 4. Missing Database Indexes
**Risk Seviyesi**: ORTA-YÜKSEK  
**Lokasyon**: `prisma/schema.prisma`

**Sorun**:
- `Device.locationId` için index yok (sık kullanılan)
- `Device.categoryId` için index yok
- `MaintenanceRecord.deviceId` için index yok
- `CalibrationRecord.deviceId` için index yok
- `Device.nextMaintenanceDate` için index yok (dashboard query'lerinde kullanılıyor)
- `Device.nextCalibrationDate` için index yok

**Öneri**: Sık kullanılan foreign key ve filter alanları için index ekle

### 5. N+1 Query Riski
**Risk Seviyesi**: ORTA  
**Lokasyon**: `app/api/maintenance/route.ts`, `app/api/devices/route.ts`

**Sorun**: Bazı query'lerde nested include'lar N+1 problem yaratabilir

**Mevcut**: `include` kullanılıyor ama optimize edilebilir

### 6. Cache Invalidation Stratejisi Eksik
**Risk Seviyesi**: ORTA  
**Lokasyon**: `lib/cache.ts`

**Sorun**:
- Cache invalidation pattern yok
- Related data değiştiğinde cache temizlenmiyor
- Cache key pattern'leri tutarsız

**Öneri**: Cache invalidation helper'ları ekle

### 7. Bundle Size Optimization
**Risk Seviyesi**: DÜŞÜK-ORTA  
**Lokasyon**: `package.json`

**Sorun**:
- Tree shaking kontrol edilmeli
- Large dependencies (xlsx, jspdf) lazy load edilebilir
- Code splitting eksik

### 8. Image Optimization
**Risk Seviyesi**: DÜŞÜK  
**Lokasyon**: Yok (henüz image upload yok)

**Sorun**: Image optimization yapılandırması yok

---

## 📋 ÖNCELİKLİ DÜZELTMELER

### Acil (Bu Hafta)
1. ✅ Password policy güçlendir (min 12 karakter, karmaşıklık)
2. ✅ Account lockout mekanizması ekle
3. ✅ Dashboard query optimizasyonu
4. ✅ Database indexes ekle
5. ✅ Public endpoint'lere rate limiting ekle

### Kısa Vadeli (Bu Ay)
6. ✅ CSRF protection ekle
7. ✅ Session security iyileştir
8. ✅ CSP header ekle
9. ✅ CORS configuration
10. ✅ Password reset mekanizması
11. ✅ Database connection pooling (PostgreSQL'e geçiş)

### Orta Vadeli (3 Ay)
12. ✅ File upload güvenliği
13. ✅ CAPTCHA entegrasyonu
14. ✅ Audit log monitoring
15. ✅ Performance monitoring
16. ✅ Bundle size optimization

---

## 🔧 DETAYLI ÖNERİLER

### Güvenlik İyileştirmeleri

#### 1. Password Policy
```typescript
// lib/password-policy.ts
export const passwordPolicy = {
  minLength: 12,
  requireUppercase: true,
  requireLowercase: true,
  requireNumbers: true,
  requireSpecialChars: true,
  maxLength: 128,
  preventCommonPasswords: true,
  preventUserInfo: true, // email, name gibi bilgileri içermemeli
}
```

#### 2. Account Lockout
```typescript
// 5 başarısız deneme = 30 dakika lockout
const MAX_FAILED_ATTEMPTS = 5
const LOCKOUT_DURATION = 30 * 60 * 1000 // 30 dakika
```

#### 3. Rate Limiting - Login
```typescript
// Login endpoint için özel rate limiting
export const POST = withRateLimit(handler, {
  maxRequests: 5, // 5 deneme
  windowMs: 15 * 60 * 1000, // 15 dakika
})
```

#### 4. CSRF Protection
```typescript
// next.config.js veya middleware
import { csrf } from '@/lib/csrf'
export default csrf(middleware)
```

#### 5. Content Security Policy
```typescript
// next.config.js
headers: [
  {
    key: 'Content-Security-Policy',
    value: "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline';"
  }
]
```

### Performans İyileştirmeleri

#### 1. Database Indexes
```prisma
model Device {
  // ... existing fields
  
  @@index([locationId])
  @@index([categoryId])
  @@index([hospitalId, status])
  @@index([nextMaintenanceDate])
  @@index([nextCalibrationDate])
  @@index([status, hospitalId])
}

model MaintenanceRecord {
  // ... existing fields
  
  @@index([deviceId])
  @@index([hospitalId, status])
  @@index([scheduledDate])
}

model CalibrationRecord {
  // ... existing fields
  
  @@index([deviceId])
  @@index([scheduledDate])
  @@index([expiryDate])
}
```

#### 2. Query Optimization
```typescript
// Dashboard için optimize edilmiş query
const deviceStats = await prisma.device.groupBy({
  by: ['status'],
  where: deviceWhere,
  _count: true
})

// Tek query ile tüm istatistikler
```

#### 3. Connection Pooling
```typescript
// PostgreSQL için
export const prisma = new PrismaClient({
  datasources: {
    db: {
      url: `${process.env.DATABASE_URL}?connection_limit=10&pool_timeout=20`
    }
  }
})
```

---

## 📊 ÖNCELİK MATRİSİ

| Sorun | Risk | Etki | Öncelik | Süre |
|-------|------|------|---------|------|
| Password Policy | Yüksek | Yüksek | 🔴 Kritik | 2 saat |
| Account Lockout | Yüksek | Yüksek | 🔴 Kritik | 2 saat |
| Dashboard Query | Yüksek | Orta | 🔴 Kritik | 3 saat |
| Database Indexes | Orta | Yüksek | 🟡 Yüksek | 1 saat |
| Public Rate Limit | Yüksek | Orta | 🟡 Yüksek | 1 saat |
| CSRF Protection | Orta | Yüksek | 🟡 Yüksek | 4 saat |
| Session Security | Orta | Orta | 🟡 Yüksek | 2 saat |
| CSP Header | Orta | Orta | 🟢 Orta | 1 saat |
| Connection Pooling | Yüksek | Düşük* | 🟢 Orta | 2 saat |
| File Upload Security | Yüksek | Düşük* | 🟢 Orta | 4 saat |

*Düşük etki çünkü henüz aktif kullanılmıyor

---

## 🎯 HEMEN YAPILMASI GEREKENLER

1. **Password Policy** - 2 saat
2. **Account Lockout** - 2 saat  
3. **Dashboard Query Optimization** - 3 saat
4. **Database Indexes** - 1 saat
5. **Public Endpoint Rate Limiting** - 1 saat

**Toplam**: ~9 saat çalışma

---

## 📚 Referanslar

- [OWASP Top 10 2021](https://owasp.org/www-project-top-ten/)
- [Next.js Security Best Practices](https://nextjs.org/docs/app/building-your-application/configuring/security-headers)
- [Prisma Performance](https://www.prisma.io/docs/guides/performance-and-optimization)
- [NIST Password Guidelines](https://pages.nist.gov/800-63-3/sp800-63b.html)

