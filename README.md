# MediSync - Profesyonel Tıbbi Cihaz Takip Sistemi

MediSync Version 1 - Özel hastaneler için profesyonel seviyede tam özellikli tıbbi cihaz ve biyomedikal ekipman yönetim sistemi.

## 🎯 Özellikler

### Temel Özellikler
- ✅ **Cihaz Envanteri Yönetimi** - Tüm tıbbi cihazları merkezi sistemde takip
- ✅ **Bakım ve Onarım Takibi** - Planlı bakım, arıza ve onarım kayıtları
- ✅ **Kalibrasyon Yönetimi** - Kalibrasyon planları ve sertifika takibi
- ✅ **Raporlama ve Analitik** - Detaylı raporlar ve maliyet analizleri
- ✅ **Çoklu Hastane Desteği** - Birden fazla hastane ve şubeyi yönetme
- ✅ **RFID/Barkod Desteği** - Hızlı cihaz tanımlama ve takip

### Gelişmiş Özellikler
- 📱 Mobil uyumlu responsive tasarım
- 🔐 Rol tabanlı erişim kontrolü
- 📊 Gerçek zamanlı dashboard ve istatistikler
- 💰 Maliyet takibi ve bütçe yönetimi
- 🔔 Otomatik hatırlatıcılar (bakım, kalibrasyon, garanti)
- 📄 Excel ve PDF rapor export
- 🏥 Departman ve lokasyon bazlı takip
- 📦 Sarf malzeme yönetimi

## 🛠️ Teknoloji Stack

- **Frontend**: Next.js 14, React, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes (Serverless)
- **Database**: PostgreSQL + Prisma ORM
- **Authentication**: NextAuth.js
- **UI Icons**: Lucide React
- **Charts**: Recharts
- **Export**: XLSX (Excel), jsPDF (PDF)
- **QR/Barcode**: html5-qrcode

## 🚀 Kurulum

### Gereksinimler
- Node.js 18+ veya npm/yarn
- PostgreSQL 14+

### Adım 1: Bağımlılıkları Yükleyin

```bash
npm install
# veya
yarn install
```

### Adım 2: Veritabanı Yapılandırması

`.env` dosyasını düzenleyin:

```env
DATABASE_URL="postgresql://kullanici:sifre@localhost:5432/biomedicapp"
NEXTAUTH_SECRET="your-super-secret-key"
NEXTAUTH_URL="http://localhost:3000"
```

### Adım 3: Veritabanı Migration

```bash
# Prisma client oluştur
npm run db:generate

# Veritabanı migration
npm run db:push

# (Opsiyonel) Demo veri ekle
npm run db:seed
```

### Adım 4: Development Server

```bash
npm run dev
```

Tarayıcınızda `http://localhost:3000` adresini açın.

## 📁 Proje Yapısı

```
biomedicapp/
├── app/
│   ├── api/                 # API Routes
│   │   ├── devices/        # Cihaz API'ları
│   │   ├── maintenance/    # Bakım API'ları
│   │   ├── calibration/    # Kalibrasyon API'ları
│   │   └── reports/        # Rapor API'ları
│   ├── dashboard/          # Dashboard sayfaları
│   │   ├── devices/        # Cihaz yönetimi
│   │   ├── maintenance/    # Bakım yönetimi
│   │   ├── reports/        # Raporlar
│   │   └── settings/       # Ayarlar
│   ├── globals.css         # Global stiller
│   ├── layout.tsx          # Root layout
│   └── page.tsx            # Landing page
├── lib/
│   └── prisma.ts           # Prisma client
├── prisma/
│   ├── schema.prisma       # Veritabanı şeması
│   └── seed.ts             # Demo veri
├── public/                 # Static dosyalar
└── package.json
```

## 💾 Veritabanı Modelleri

### Ana Modeller
- **Hospital** - Hastane/Kurum bilgileri
- **User** - Kullanıcılar ve rol yönetimi
- **Device** - Tıbbi cihaz bilgileri
- **DeviceCategory** - Cihaz kategorileri
- **Location** - Lokasyon/Departman
- **Supplier** - Tedarikçiler

### Takip Modelleri
- **MaintenanceRecord** - Bakım kayıtları
- **CalibrationRecord** - Kalibrasyon kayıtları
- **DeviceMovement** - Cihaz hareketleri
- **Consumable** - Sarf malzemeleri
- **DeviceConsumable** - Cihaz-sarf ilişkisi

## 🎨 UI/UX Özellikleri

- Modern ve profesyonel tasarım
- Responsive design (mobil, tablet, desktop)
- Dark/Light mode desteği
- Gelişmiş filtreleme ve arama
- Pagination desteği
- Status badge'leri ve renk kodlaması
- Smooth animasyonlar
- Print-friendly raporlar

## 📊 Raporlar

### Mevcut Raporlar
- Cihaz Envanteri
- Durum Raporu
- Lokasyon Bazlı Dağılım
- Bakım Geçmişi
- Bakım Maliyetleri
- Kalibrasyon Takvimi
- Maliyet Analizi
- ROI Analizi

## 🔒 Güvenlik

- Rol tabanlı erişim kontrolü (RBAC)
- JWT token authentication
- Secure password hashing (bcrypt)
- API rate limiting (hazırlıkta)
- CSRF koruması
- Input validation (Zod)

## 🔧 Geliştirme

```bash
# Type checking
npm run type-check

# Build production
npm run build

# Start production server
npm run start

# Prisma Studio (DB GUI)
npx prisma studio
```

## 📝 Lisans

Bu proje özel kullanım için geliştirilmiştir.

## 👥 Destek

Sorularınız için lütfen iletişime geçin.

---

**MediSync** - Profesyonel Tıbbi Cihaz Yönetim Sistemi Version 1
