# MediSync Version 1 - Kurulum Kılavuzu

## 🚀 Hızlı Kurulum (Setup ile)

### Adım 1: Setup Dosyasını Çalıştırın
1. `MediSync_Setup_v1.0.0.exe` dosyasını çift tıklayarak açın
2. Kurulum sihirbazındaki adımları takip edin
3. Kurulum tamamlandığında otomatik olarak bağımlılıklar yüklenecektir

### Adım 2: PostgreSQL Kurulumu
Eğer PostgreSQL kurulu değilse:
1. https://www.postgresql.org/download/ adresine gidin
2. Windows için PostgreSQL indirin
3. Kurulum sırasında şifre belirleyin (örn: "postgres")
4. Port: 5432 (varsayılan)

### Adım 3: Veritabanı Yapılandırması
Kurulum sonrası tarayıcınızda:
1. http://localhost:3000/setup adresine gidin
2. Kurulum sihirbazında veritabanı bilgilerini girin:
   - Sunucu: `localhost`
   - Port: `5432`
   - Veritabanı: `medisync`
   - Kullanıcı: `postgres`
   - Şifre: PostgreSQL kurulumunda belirlediğiniz şifre
3. "Bağlantıyı Test Et" butonuna tıklayın
4. Başarılı ise devam edin ve yapılandırmayı kaydedin

> **Alternatif:** Manuel olarak `.env` dosyasını da düzenleyebilirsiniz:
> ```env
> DATABASE_URL="postgresql://postgres:SIFRENIZ@localhost:5432/medisync"
> ```

### Adım 4: Uygulamayı Başlatın
- Masaüstündeki **MediSync** kısayoluna tıklayın
- veya `C:\MediSync\BASLAT.bat` dosyasını çalıştırın

---

## 🛠️ Geliştirici Kurulumu (Kaynak Koddan)

### Gereksinimler
- Node.js 18+ 
- PostgreSQL 14+
- npm veya yarn

### Kurulum Adımları

1. **Bağımlılıkları Yükle**
   ```bash
   npm install
   ```

2. **Prisma Client Oluştur**
   ```bash
   npm run db:generate
   ```

3. **Veritabanını Hazırla**
   ```bash
   npm run db:push
   ```

4. **Başlangıç Verilerini Yükle** (Opsiyonel)
   ```bash
   npm run db:seed
   ```

5. **Uygulamayı Başlat**
   ```bash
   npm run dev
   ```

---

## 📦 Setup Dosyası Oluşturma

Setup dosyası oluşturmak için:

1. **Inno Setup Kurun**
   - https://jrsoftware.org/isdl.php adresinden indirin
   - Kurulumu tamamlayın

2. **Setup Oluştur**
   - `SETUP_OLUSTUR.bat` dosyasını çalıştırın
   - veya Inno Setup ile `setup/medisync-setup.iss` dosyasını açıp derleyin

3. **Dağıtım**
   - Oluşan `output/MediSync_Setup_v1.0.0.exe` dosyasını dağıtın

---

## 📋 Dosya Yapısı

```
MediSync/
├── BASLAT.bat           # Uygulamayı başlat
├── KURULUM.bat          # Bağımlılıkları yükle
├── TEK_TIK_BASLAT.bat   # Tek tıkla başlat
├── SETUP_OLUSTUR.bat    # Setup dosyası oluştur
├── setup/
│   └── medisync-setup.iss  # Inno Setup script
├── output/              # Oluşturulan setup dosyaları
├── app/                 # Next.js uygulama
├── lib/                 # Yardımcı fonksiyonlar
├── prisma/              # Veritabanı şeması
└── ...
```

---

## ❓ Sorun Giderme

### Node.js Bulunamadı
- https://nodejs.org adresinden Node.js LTS indirin
- Kurulumdan sonra bilgisayarı yeniden başlatın

### PostgreSQL Bağlantı Hatası
- PostgreSQL servisinin çalıştığından emin olun
- Ayarlar > Yapılandırma sekmesinden bağlantıyı test edin
- veya `.env` dosyasındaki DATABASE_URL'i kontrol edin

### Port 3000 Kullanımda
- Başka bir uygulama bu portu kullanıyor olabilir
- `.env` dosyasına `PORT=3001` ekleyin

---

**MediSync Version 1** - Profesyonel Tıbbi Cihaz Yönetim Sistemi
