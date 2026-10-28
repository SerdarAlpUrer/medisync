# MediSync v1.5.0 - Hastane Yerel (On-Premise) Kurulum ve İşletim Kılavuzu

Bu belge, **MediSync Profesyonel Biyomedikal Cihaz ve Ekipman Yönetim Sistemi**'nin hastane yerel sunucusuna veya biyomedikal merkezi bilgisayarına başarıyla kurulması, yerel ağda (LAN) kullanıma açılması, termal etiket yazıcıları ile entegrasyonu ve güvenli işletimi için hazırlanmış ticari kurulum rehberidir.

---

## 1. Sistem Mimarisi ve Donanım Gereksinimleri

MediSync, hastane verilerinin dışarı çıkmasını istemeyen kurumlar için **tamamen çevrimdışı (offline) ve yerel ağda (LAN)** çalışacak mimaride tasarlanmıştır.

### Minimum Sunucu / Ana Bilgisayar Gereksinimleri
- **İşletim Sistemi:** Windows 10 Pro / Enterprise (64-bit), Windows 11 Pro veya Windows Server 2016 / 2019 / 2022 / 2025
- **İşlemci (CPU):** Intel Core i3 / AMD Ryzen 3 veya üstü (4 çekirdek önerilir)
- **Bellek (RAM):** 8 GB RAM (16 GB önerilir)
- **Depolama:** 256 GB SSD (Veritabanı ve yedekler için en az 20 GB boş alan)
- **Ağ:** 1 Gbps Yerel Ağ Bağlantısı (Ethernet kablosu ile bağlı olması şiddetle önerilir)

### İstemci (Kullanıcı) Cihazları
- Hastane ağındaki tüm PC'ler, dizüstü bilgisayarlar ve tabletler (Google Chrome, Microsoft Edge, Safari veya Firefox güncel sürümleri).
- Herhangi bir ek istemci programı yüklemeye gerek yoktur; tarayıcıdan doğrudan çalışır.

---

## 2. Kurulum Öncesi Hazırlıklar

### Adım 1: Node.js LTS Kurulumu
1. [https://nodejs.org](https://nodejs.org) adresinden güncel **LTS (Uzun Vadeli Destek)** sürümünü indirin.
2. Kurulum sihirbazını varsayılan ayarlarla tamamlayın.
3. Komut satırında `node -v` yazarak kurulumu doğrulayın (v18.0 veya üzeri olmalıdır).

### Adım 2: PostgreSQL Veritabanı Kurulumu
1. [https://www.postgresql.org/download/windows/](https://www.postgresql.org/download/windows/) adresinden PostgreSQL (v14, v15, v16 veya v17) indirin.
2. Kurulum sırasında:
   - **Port:** `5432` (varsayılan)
   - **Kullanıcı:** `postgres`
   - **Şifre:** Kurum standardına uygun güçlü bir şifre belirleyin (örn: `postgres` veya kurum özel şifresi).
3. pgAdmin veya SQL Shell ile `medisync` adında bir veritabanı oluşturun:
   ```sql
   CREATE DATABASE medisync;
   ```

### Adım 3: Ortam Değişkenleri (.env Kontrolü)
Proje kök dizinindeki `.env` dosyasını açın ve veritabanı şifrenizi girin:
```env
DATABASE_URL="postgresql://postgres:SIFRENIZ@localhost:5432/medisync?schema=public"
NEXTAUTH_SECRET="FmeF1Bm6ZHqJWsKcnJFun+XF+S2IR5Us1uK8FmOOPzI="
NEXTAUTH_URL="http://localhost:3000"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```
*(Alternatif olarak kurulum sihirbazı `http://localhost:3000/setup` üzerinden bu bilgiler arayüzden de kaydedilebilir).*

---

## 3. Kurulum ve İlk Çalıştırma

### 1-Tıkla Otomatik Kurulum
1. MediSync klasöründe bulunan **`KURULUM.bat`** dosyasına çift tıklayın.
2. Betik sırasıyla:
   - Node.js ve npm sürümlerini doğrular,
   - Proje paketlerini yükler,
   - Prisma ORM veritabanı tablolarını (`medisync`) otomatik olarak oluşturur,
   - Standart tıbbi cihaz kategorilerini ve lokasyonları içeri aktarır.

### Sistemi Başlatma
- Masaüstündeki MediSync kısayoluna veya klasör içindeki **`BASLAT.bat`** dosyasına çift tıklayın.
- Sunucu derlenmiş ve optimize edilmiş üretim (production) modunda başlar.
- Tarayıcınızda otomatik olarak **`http://localhost:3000`** açılacaktır.

---

## 4. Hastane Yerel Ağına (LAN) Açma

Hastanedeki doktorların, servis hemşirelerinin, ameliyathane personelinin ve biyomedikal teknisyenlerinin kendi bilgisayarlarından sisteme erişebilmesi için:

### 1. Güvenlik Duvarı İzni Verme
- MediSync klasöründeki **`GUVENLIK_DUVARI_AYARLA.bat`** dosyasına **SAĞ TIKLAYIP "Yönetici olarak çalıştır"** seçeneğini seçin.
- Bu işlem Windows Güvenlik Duvarında 3000 numaralı porta gelen yerel bağlantılara izin verir ve sunucunun yerel IP adresini ekrana yazdırır.

### 2. Sunucuya Statik IP Atama (Önemli!)
Hastane Bilgi İşlem (IT) biriminden bu ana bilgisayar için yerel ağda **Sabit IP (Statik IP)** tanımlamasını talep edin (Örneğin: `192.168.1.150` veya `10.0.0.50`).

### 3. Kullanıcıların Bağlanması
Hastanedeki diğer tüm bilgisayar veya tabletlerin tarayıcısından:
```text
http://192.168.1.150:3000
```
yazarak MediSync'e bağlanabilirler.

---

## 5. Sunucu Otomatik Başlatma Hizmeti (Windows Service)

Hastane sunucusu elektrik kesintisi, bakım veya Windows güncellemeleri sonrasında yeniden başladığında MediSync'in otomatik olarak çalışması için:

1. **`OTOMATIK_BASLAT_KUR.bat`** dosyasına **SAĞ TIKLAYIP "Yönetici olarak çalıştır"** deyin.
2. Windows Görev Zamanlayıcısına yüksek yetkili `MediSync_Server_AutoStart` görevi kaydedilir.
3. Sunucu açıldığında MediSync arka planda kendiliğinden başlayacaktır.
4. Hizmeti iptal etmek isterseniz **`OTOMATIK_BASLAT_KALDIR.bat`** dosyasını çalıştırmanız yeterlidir.

---

## 6. Termal Barkod ve QR Kod Yazıcı Yapılandırması

MediSync, Türkiye'deki tüm medikal standartlara uygun **50x30 mm** ve **80x50 mm** termal etiketleri destekler.

### Desteklenen Yazıcı Markaları
- Zebra (ZD220, ZD230, GK420t vb.)
- Argox (OS-214 Plus, CP-2140 vb.)
- Honeywell / Datamax
- Xprinter, TSC ve standart Windows etiket sürücüsü olan tüm cihazlar.

### Yazıcı Sürücü Ayarları:
1. Windows **Aygıtlar ve Yazıcılar** > Barkod Yazıcınız > **Yazdırma Tercihleri**'ne gidin.
2. **Kağıt Boyutu:** `Genişlik: 50 mm`, `Yükseklik: 30 mm` seçin.
3. **Kenar Boşlukları (Margins):** `0 mm` (Sıfır) olarak ayarlayın.
4. **Koyuluk (Darkness):** QR kodların barkod okuyucular tarafından anında okunabilmesi için 15 - 20 arası önerilir.

### MediSync İçerisinden Yazdırma:
1. **Cihaz Yönetimi** sayfasında cihazın yanındaki **QR Kod** simgesine tıklayın.
2. Açılan modalda QR kodun hemen altında cihazın **KÜNYE NUMARASI**, cihaz adı ve seri numarası yer alır.
3. Format olarak **"Termal (50x30 mm)"** seçin.
4. **"Etiketi Yazdır"** butonuna basarak doğrudan barkod yazıcınıza gönderin veya **"Görseli İndir"** diyerek yüksek çözünürlüklü PNG etiketini arşivleyin.

---

## 7. Kullanıcı Rolleri ve Yetki Matrisi

| Rol | Dashboard | Cihaz Ekle/Düzenle | Arıza & Bakım | Kalibrasyon | Raporlar | Ayarlar & Kullanıcılar |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **Süpervizör (Admin)** | Tam | Tam | Tam | Tam | Tam | Tam |
| **Hastane Yöneticisi** | Tam | Tam | Tam | Tam | Tam | Kendi Kurumu |
| **Biyomedikal Teknisyen** | Tam | Tam | Tam | Tam | Görüntüleme | Yok |
| **İzleyici / Servis Personeli**| Salt Okunur | Yok | Arıza Bildirimi | Görüntüleme | Yok | Yok |

---

## 8. Veritabanı Yedekleme ve Acil Durum Kurtarma

### Manuel Yedekleme (1-Tıkla)
- **`YEDEKLE.bat`** dosyasını çalıştırın.
- Veritabanındaki tüm cihazlar, bakım kayıtları, kalibrasyon sertifikaları, sözleşmeler ve ayarlar `backups/` klasörüne zaman damgalı JSON formatında yedeklenir.
- Bu klasörü haftalık olarak harici bir USB belleğe kopyalamanız önerilir.

### Otomatik Günlük Yedekleme
MediSync içerisinde yerleşik yedekleme motoru mevcuttur:
- **Sistem Ayarları > Veri ve Yedekleme** bölümünden Otomatik Yedekleme sıklığını (Günlük / Haftalık) ve saklama süresini (örn. 30 gün) belirleyebilirsiniz. Sistem her gece otomatik olarak yedek alır ve 30 günden eski yedekleri otomatik temizler.

### Geri Yükleme (Restore)
- Beklenmedik bir donanım arızasında yeni bilgisayara MediSync kurduktan sonra **`GERI_YUKLE.bat`** dosyasını çalıştırın ve geri yüklemek istediğiniz yedek dosyasını seçin. Tüm veritabanı eksiksiz eski haline gelecektir.

---

## 9. Sıkça Sorulan Sorular ve Sorun Giderme (Troubleshooting)

### S: "Diğer bilgisayarlardan sunucu IP'sine girildiğinde sayfa açılmıyor."
- **Çözüm 1:** Sunucuda `GUVENLIK_DUVARI_AYARLA.bat` dosyasının yönetici olarak çalıştırıldığından emin olun.
- **Çözüm 2:** İstemci bilgisayar ile sunucunun aynı yerel ağda (aynı IP bloğunda, örn: 192.168.1.X) olduğunu doğrulayın. Hastane ağında VLAN ayrımı varsa bilgi işlemden 3000 portu yönlendirmesi isteyin.

### S: "Sunucu kapandı, nasıl tekrar başlatırım?"
- Masaüstündeki **MediSync Başlat** veya klasördeki **`BASLAT.bat`** dosyasına tıklayın. 5 saniye içinde sistem hazır hale gelir.

### S: "Halka açık alandan arıza bildirimi nasıl yapılır?"
- Hastanedeki servis çalışanları veya hemşireler, cihaz üzerindeki QR kodu telefonları veya tabletleri ile okuttuklarında doğrudan arıza bildirim ekranına yönlendirilirler (`/report-fault`). Giriş yapmalarına gerek kalmadan anlık arıza kaydı açabilirler; açılan kayıt biyomedikal teknisyenlerinin paneline anında düşer.

---
**MediSync Destek ve İletişim:**
Soru, talep veya teknik destek için Biyomedikal Bilgi İşlem Destek Masası ile irtibata geçebilirsiniz.
