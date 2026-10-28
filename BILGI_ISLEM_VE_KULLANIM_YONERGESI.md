# MediSync — 500 Yataklı Hastane Bilgi İşlem (IT) Kurulum, Taşıma ve Kullanım Yönergesi

Bu kılavuz, **MediSync Biyomedikal Cihaz ve Klinik Mühendislik Yönetim Sistemi**'nin hastane sunucularına kurulması, başka bir sunucuya taşınması, yerel ağ (LAN) üzerinden tüm hastane birimlerine açılması, yedeklenmesi, sistem ayarlarının yapılandırılması ve günlük operasyonel kullanımı için **Bilgi İşlem (IT) Uzmanları** ve **Biyomedikal Mühendisleri** için hazırlanmıştır.

---

## İÇİNDEKİLER

1. [Sistem Mimarisi ve 500 Yataklı Hastane Sunucu Gereksinimleri](#1-sistem-mimarisi-ve-500-yatakli-hastane-sunucu-gereksinimleri)
2. [Programı Başka Bir Bilgisayara / Sunucuya Taşıma ve Kurulum](#2-programi-baska-bir-bilgisayara--sunucuya-tasima-ve-kurulum)
3. [Yeni Müşteri / Hastane İlk Kurulum Sihirbazı](#3-yeni-musteri--hastane-ilk-kurulum-sihirbazi)
4. [Yerel Ağ (LAN), Sabit IP ve Güvenlik Duvarı (Firewall) Ayarları](#4-yerel-ag-lan-sabit-ip-ve-guvenlik-duvari-firewall-ayarlari)
5. [Windows Açılışında Otomatik Başlatma (7/24 Kesintisiz Çalışma)](#5-windows-acilisinda-otomatik-baslatma-724-kesintisiz-calisma)
6. [Veritabanı Yedekleme ve Geri Yükleme Prosedürleri](#6-veritabani-yedekleme-ve-geri-yukleme-prosedurleri)
7. [Sistem Ayarları ve Özelleştirme Rehberi](#7-sistem-ayarlari-ve-ozellestirme-rehberi)
8. [Termal Barkod / QR Etiket Yazıcısı (50x30mm) Kurulum ve Baskı Ayarları](#8-termal-barkod--qr-etiket-yazicisi-50x30mm-kurulum-ve-baski-ayarlari)
9. [Lisans Yönetimi ve Yeni Lisans Anahtarı Üretimi](#9-lisans-yonetimi-ve-yeni-lisans-anahtari-uretimi)
10. [Modül Bazlı Kullanım Kılavuzu (Biyomedikal & Klinik Birimler)](#10-modul-bazli-kullanim-kilavuzu-biyomedikal--klinik-birimler)
11. [Bilgi İşlem (IT) Sorun Giderme (Troubleshooting) Rehberi](#11-bilgi-islem-it-sorun-giderme-troubleshooting-rehberi)

---

## 1. Sistem Mimarisi ve 500 Yataklı Hastane Sunucu Gereksinimleri

MediSync; yüksek eşzamanlılık (100+ eşzamanlı klinik/teknik kullanıcı), on binlerce tıbbi cihaz ve yüz binlerce bakım/kalibrasyon kaydını milisaniyeler içinde işleyebilmek üzere tasarlanmıştır.

### Teknik Altyapı
- **Uygulama Katmanı:** Next.js 16 (Production Derlemesi) + Node.js LTS (v20 veya v22)
- **Veritabanı Katmanı:** PostgreSQL (v15 / v16 / v17) — Birleşik (Composite) İndeksler ve Tekil Bağlantı Havuzu (Singleton Connection Pool) ile optimize edilmiştir.
- **Önbellek (Cache) Katmanı:** Bellek-içi (In-Memory) TTL önbellekleme ve otomatik önbellek temizleme (Cache Invalidation).
- **Dosya Depolama:** Sözleşme PDF'leri, eğitim belgeleri ve yüklenen dosyalar doğrudan uygulama dizinindeki `uploads/` ve `public/uploads/` klasörlerinde saklanır.
- **Yedekleme Depolama:** Otomatik ve manuel JSON/SQL yedekleri `backups/` klasöründe tutulur.

### 500 Yataklı Hastane İçin Önerilen Sunucu Donanımı (Sanal Makine / Fiziksel Sunucu)
| Bileşen | Minimum Gereksinim | Önerilen (500+ Yataklı Hastane) |
| :--- | :--- | :--- |
| **İşletim Sistemi** | Windows Server 2019 / Windows 10 Pro (64-bit) | Windows Server 2022 / Windows 11 Pro (64-bit) |
| **İşlemci (CPU)** | 2 vCPU | 4 vCPU |
| **Bellek (RAM)** | 4 GB RAM | 8 GB RAM |
| **Disk Alanı** | 20 GB SSD | 50 GB NVMe / SSD (Yedekler ve PDF ekleri dahil) |
| **Ağ (Network)** | 100 Mbps LAN (Sabit Yerel IP) | 1 Gbps LAN (Sabit Yerel IP) |

---

## 2. Programı Başka Bir Bilgisayara / Sunucuya Taşıma ve Kurulum

MediSync klasörü **taşınabilir (portable)** yapıda optimize edilmiştir. Gereksiz önbellek ve geçici dosyalar temizlenmiş olup doğrudan USB bellek, harici disk veya ağ paylaşımı üzerinden yeni sunucuya kopyalanabilir.

### Adım 1: Yeni Sunucuda Ön Gereksinimlerin Kurulması
Yeni sunucuda sadece aşağıdaki iki temel yazılımın kurulu olması yeterlidir:
1. **Node.js (LTS Sürümü):** [https://nodejs.org](https://nodejs.org) adresinden **LTS** sürümünü indirip varsayılan ayarlarla kurun.
2. **PostgreSQL Veritabanı:** [https://www.postgresql.org/download/windows/](https://www.postgresql.org/download/windows/) adresinden PostgreSQL (v15 veya üzeri) kurun.
   - Kurulum sırasında belirlediğiniz `postgres` kullanıcı şifresini not alın (Varsayılan port: `5432`).
   - pgAdmin veya komut satırı ile `medisync_db` adında boş bir veritabanı oluşturun:
     ```sql
     CREATE DATABASE medisync_db ENCODING 'UTF8';
     ```

### Adım 2: Klasörün Kopyalanması ve `.env` Yapılandırması
1. `medisync` klasörünü yeni sunucuda örneğin `C:\medisync` dizinine kopyalayın.
2. Klasör içindeki `.env` dosyasını Not Defteri (Notepad) ile açın ve şu iki satırı yeni sunucuya göre düzenleyin:
   ```env
   DATABASE_URL="postgresql://postgres:SIFRENIZ@localhost:5432/medisync_db?schema=public"
   NEXTAUTH_URL="http://SUNUCU_SABIT_IP_ADRESI:3000"
   NEXTAUTH_SECRET="medisync-production-secret-key-2026-secure"
   ```
   > **ÖNEMLİ NOT:** Hastanedeki diğer bilgisayarların (Servisler, Yoğun Bakım, Biyomedikal Atölyesi) giriş yaparken sorun yaşamaması için `NEXTAUTH_URL` adresine sunucunun yerel ağdaki sabit IP adresini (Örn: `http://192.168.1.100:3000`) yazın.

### Adım 3: Kurulum ve Başlatma
1. Klasör içindeki **`KURULUM.bat`** dosyasına çift tıklayın.
   - Bu betik Node.js kontrolünü yapar, bağımlılıkları doğrular, Prisma veritabanı tablolarını ve performans indekslerini PostgreSQL'e otomatik olarak yazar.
2. Eğer eski sunucudaki verileri (cihazlar, bakımlar, kullanıcılar) yeni sunucuya aktarmak istiyorsanız:
   - Eski sunucudaki `backups/` klasöründe bulunan en güncel `.json` yedek dosyasını yeni sunucudaki `backups/` klasörüne kopyalayın.
   - **`GERI_YUKLE.bat`** dosyasına çift tıklayıp yedek dosyasının adını girin.
3. **`BASLAT.bat`** dosyasına çift tıklayarak sunucuyu Production (Yüksek Performans) modunda başlatın.

---

## 3. Yeni Müşteri / Hastane İlk Kurulum Sihirbazı

Programı yeni bir hastaneye sıfırdan kuruyorsanız ve içinde yalnızca standart tıbbi cihaz kategorileri, standart hastane lokasyonları ve o hastaneye özel Yönetici (Admin) hesabı olmasını istiyorsanız:

1. **`TEMIZ_YENI_HASTANE_KURULUMU.bat`** dosyasına çift tıklayın.
2. Ekrana gelen Türkçe sihirbaz sırasıyla şu bilgileri soracaktır:
   - **1. Hastane / Kurum Tam Adı** *(Örn: Özel Parkhayat Hastanesi)*
   - **2. Kurum Kodu** *(Örn: PARKHAYAT)*
   - **3. Baş Biyomedikal / Sistem Yöneticisi E-posta** *(Örn: biyomedikal@hastane.com)*
   - **4. Yönetici Adı Soyadı** *(Örn: Biyomedikal Sorumlusu)*
   - **5. Yönetici Şifresi** *(Örn: Admin2026!)*
3. Sihirbaz tamamlandığında:
   - Tüm klinik modüller ve otomatik yedekleme aktif edilir.
   - 10 adet standart tıbbi cihaz kategorisi (*Yaşam Destek, Cerrahi, Görüntüleme, Monitörizasyon, Kardiyoloji, Laboratuvar, Sterilizasyon vb.*) ve 11 adet standart hastane bölümü (*Acil Servis, Ameliyathane, Yoğun Bakım, Radyoloji, Biyomedikal Atölyesi vb.*) otomatik yüklenir.
   - Çoklu hastane (Multi-Tenant) izolasyonu sayesinde her hastane kullanıcısı yalnızca kendi hastanesinin verilerini görür.

---

## 4. Yerel Ağ (LAN), Sabit IP ve Güvenlik Duvarı (Firewall) Ayarları

Hastanedeki tüm klinik servislerin, hemşire bankolarının (QR kod ile arıza bildirimi için) ve biyomedikal teknisyenlerinin sisteme erişebilmesi için:

1. **Sunucuya Sabit IP Verin:** Bilgi İşlem tarafından sunucuya DHCP üzerinden IP резервasyonu (MAC adresine sabit IP) veya Windows Ağ Bağdaştırıcısı üzerinden statik IP (Örn: `192.168.1.100`) tanımlanmalıdır.
2. **Güvenlik Duvarı Portunu Açın:**
   - Klasör içindeki **`GUVENLIK_DUVARI_AYARLA.bat`** dosyasına **Sağ Tıklayıp "Yönetici olarak çalıştır"** seçeneğini seçin.
   - Bu işlem Windows Güvenlik Duvarı'nda **TCP 3000** portuna gelen yerel ağ bağlantılarına izin verir ve ekranda hastane içinden erişilecek tam adresi (`http://192.168.x.x:3000`) gösterir.
3. **DNS Kaydı (Opsiyonel - Bilgi İşlem İçin):**
   - Hastane içi Active Directory / DNS sunucunuzda `biyomedikal.hastane.local` veya `medisync.hastane.local` için bir `A` kaydı oluşturup sunucu IP'sine yönlendirirseniz, kullanıcılar IP yazmak yerine doğrudan isimle erişebilir (포트 80 yönlendirmesi için IIS Reverse Proxy veya Nginx kullanılabilir).

---

## 5. Windows Açılışında Otomatik Başlatma (7/24 Kesintisiz Çalışma)

Elektrik kesintisi, Windows güncellemesi veya sunucunun yeniden başlatılması sonrasında kimsenin müdahalesine gerek kalmadan MediSync'in otomatik çalışması için:

1. **`OTOMATIK_BASLAT_KUR.bat`** dosyasına **Sağ Tıklayıp "Yönetici olarak çalıştır"** deyin.
2. Bu araç Windows Görev Zamanlayıcısı'na (`Task Scheduler`) `MediSync_Server_AutoStart` adında yüksek yetkili bir görev ekler ve oturum açıldığında `start_prod.bat` üzerinden Production sunucusunu arka planda başlatır.
3. Otomatik başlatmayı devre dışı bırakmak isterseniz **`OTOMATIK_BASLAT_KALDIR.bat`** dosyasını yönetici olarak çalıştırmanız yeterlidir.

---

## 6. Veritabanı Yedekleme ve Geri Yükleme Prosedürleri

MediSync'te veri güvenliği için **3 katmanlı yedekleme** mekanizması bulunur:

### Yöntem A: Web Arayüzünden Tek Tıkla Yedekleme ve İndirme
1. Sol menüden **Ayarlar > Yedekleme & DB** sekmesine gidin.
2. **"Şimdi Yedek Al"** butonuna tıkladığınızda tüm veritabanı tabloları `backups/` klasörüne tarih-saat damgalı JSON olarak yedeklenir.
3. **"Bilgisayara İndir (.json)"** butonu ile yedeği kendi bilgisayarınıza indirebilirsiniz.
4. Otomatik yedekleme zamanlamasını (Günlük / Haftalık / Aylık) ve saklama süresini (Örn: 30 gün) aynı ekrandan ayarlayabilirsiniz.

### Yöntem B: Sunucu Üzerinden Tek Tıkla Yedekleme (`YEDEKLE.bat`)
- Klasördeki **`YEDEKLE.bat`** dosyasına çift tıkladığınızda konsol üzerinden tam veritabanı yedeği alınır ve `backups/backup-YYYY-MM-DDTHH-mm-ss.json` dosyası oluşturulur.
- Bilgi İşlem birimi, Windows Yedekleme veya NAS senkronizasyon yazılımına `C:\medisync\backups` ve `C:\medisync\uploads` klasörlerini dahil ederek yedekleri harici depolamaya aktarabilir.

### Yöntem C: Yedekten Geri Yükleme (`GERI_YUKLE.bat`)
- Klasördeki **`GERI_YUKLE.bat`** dosyasına çift tıklayın.
- Ekranda mevcut tüm yedek dosyaları en yeniden en eskiye doğru listelenir.
- Geri yüklemek istediğiniz dosya adını yazıp Enter'a bastığınızda tüm veriler ilişkileri korunarak veritabanına geri yüklenir.

---

## 7. Sistem Ayarları ve Özelleştirme Rehberi

Yönetici (`ADMIN`) yetkisiyle giriş yaptıktan sonra **Ayarlar (`/dashboard/settings`)** sayfasından tüm hastane parametrelerini yönetebilirsiniz:

1. **Genel & Künye Sekmesi:**
   - **Hastane / Kurum Bilgileri:** Hastane adı, kurum kodu, adres, telefon, e-posta ve vergi numarası (Raporlarda, zimmet tutanaklarında ve QR etiketlerde otomatik kullanılır).
   - **Künye Numarası Formatı:** Yeni cihaz eklendiğinde üretilecek otomatik künye şablonunu belirler:
     - `{YYYY}`: Yıl (Örn: 2026)
     - `{SEQ}`: 4 Haneli Otomatik Sıra No (Örn: 0001)
     - `{HOSP}`: Hastane Kodu
     - `{CAT}`: Cihaz Kategori Kodu
     - *Örnek Şablon:* `KUNYE-{YYYY}-{SEQ}` → `KUNYE-2026-0042`
   - **Biyomedikal Acil Çağrı & İletişim:** QR kod okutulduğunda açılan **Hızlı Arıza Bildir (`/report-fault`)** sayfasında klinik personelin tek tıkla arayabileceği Biyomedikal Dahili / Cep Numarası, E-posta ve Mesai Saatleri buradan değiştirilir.
2. **Biyomedikal & Etiket Sekmesi:**
   - **Termal QR Künye Etiketi Tasarımı:** 50x30mm standart rulo etiket veya 40x20mm kompakt etiket boyutu seçimi, etiket başlığı, QR kod altında künye numarası gösterimi, seri no ve bölüm adı gösterimi **canlı önizleme** ile ayarlanır.
   - **Kalibrasyon ve Sözleşme Alarm Eşikleri:** Kalibrasyon bitimine kaç gün kala (Örn: 30 gün) sarı/kırmızı uyarı verileceği, varsayılan kalibrasyon periyodu (6 / 12 / 24 ay), varsayılan bakım periyodu ve sözleşme yenileme uyarı gün sayısı belirlenir.
3. **Bölümler & Kategoriler Sekmesi:**
   - Hastane içindeki tüm **Bölüm / Servis / Lokasyonları** (Bina, Kat, Oda bilgisiyle) ve **Tıbbi Cihaz Kategorilerini** (Risk/Grup sınıflandırmasıyla) istediğiniz zaman ekleyebilir, düzenleyebilir ve silebilirsiniz.
4. **Tedarikçi & Servisler Sekmesi:**
   - Cihazların satın alındığı veya bakım/kalibrasyon hizmeti alınan yetkili firmaları, iletişim kişilerini, telefon ve adres bilgilerini ekleyip düzenleyebilirsiniz.
5. **Görünüm Sekmesi:**
   - Tema (Açık / Koyu / Sistem), vurgu rengi, yan menü genişliği (*Kompakt / Standart / Geniş*), yazı boyutu (*Küçük / Normal / Büyük*) ve tablo yoğunluğu tüm panele anında uygulanır.
6. **Bildirimler Sekmesi:**
   - E-posta (SMTP sunucu, port, kullanıcı adı, şifre ve **Canlı Test E-postası Gönder** butonu), tarayıcı anlık bildirimleri ve kritik arıza / kalibrasyon uyarı tercihleri yönetilir.
7. **Modüller Sekmesi:**
   - Hastanenin kullanmadığı modülleri (*Bakım, Kalibrasyon, Sözleşmeler, ÜTS, SKS Uyumluluk, Raporlar, Eğitim, Satın Alma, HEK/Hurda*) tek tıkla açıp kapatabilirsiniz. Kapatılan modül sol menüden otomatik gizlenir.
8. **Güvenlik, Sunucu (.env) ve Sistem Durumu Sekmeleri:**
   - Oturum zaman aşımı süresi, şifre politikaları, iki faktörlü doğrulama (2FA), `.env` bağlantı durumu ve PostgreSQL veritabanı gecikme (ping) süreleri izlenir.

---

## 8. Termal Barkod / QR Etiket Yazıcısı (50x30mm) Kurulum ve Baskı Ayarları

MediSync, tıbbi cihazların üzerine yapıştırılan dayanıklı (Silvermat / PP Termal) **50mm x 30mm** rulo etiket yazıcıları (Zebra, Argox, TSC, Godex, Xprinter vb.) ile tam uyumludur.

1. **Yazıcı Sürücü Ayarı:**
   - Windows **Yazıcılar ve Tarayıcılar** ayarlarından termal barkod yazıcınızın **Yazdırma Tercihleri (Printing Preferences)** ekranını açın.
   - **Kağıt Boyutu (Paper Size / Stock):** Genişlik `50 mm` (5.0 cm), Yükseklik `30 mm` (3.0 cm) olarak tanımlayın.
   - **Kenar Boşluğu (Margins):** `Yok (None / 0 mm)` seçin.
2. **Tekli Etiket Yazdırma:**
   - **Cihazlar** listesinde herhangi bir cihazın yanındaki **QR Kod** ikonuna tıklayın.
   - Açılan pencerede cihazın QR kodu ve hemen altında kalın fontla **Künye Numarası (`KUNYE-...`)** yer alır. **"Etiketi Yazdır (50x30mm)"** butonuna tıklayarak doğrudan yazdırın.
3. **Toplu QR Künye Yazdırma:**
   - Sol menüden **QR Künye Basımı (`/dashboard/qr-codes`)** sayfasına gidin.
   - Bölüm veya kategoriye göre filtreleme yapıp birden fazla cihazı seçerek tek seferde toplu rulo etiket çıktısı alabilirsiniz.

---

## 9. Lisans Yönetimi ve Yeni Lisans Anahtarı Üretimi

MediSync kurumsal lisans doğrulama altyapısına sahiptir:
- Mevcut lisans durumunu görmek veya yeni lisans anahtarı girmek için sol menüden **Lisans Yönetimi (`/dashboard/license`)** sayfasına gidin.
- **Yeni Lisans Anahtarı Üretmek İçin:**
  - Proje klasöründeki **`KEYGEN.bat`** dosyasına çift tıklayın. Menüden lisans süresini (30 Gün, 1 Yıl, Sınırsız veya Özel Gün) seçin ve varsa hedef bilgisayarın Cihaz Kodu'nu (Donanım Kimliği / HWID) girin (boş bırakılırsa tüm cihazlarda geçerli olur).
  - Üretilen `MEDISYNC-...` formatındaki kriptografik lisans anahtarını kopyalayıp web arayüzündeki **Lisans Yönetimi** veya **Ayarlar > Güvenlik** ekranına yapıştırarak etkinleştirin.

---

## 10. Modül Bazlı Kullanım Kılavuzu (Biyomedikal & Klinik Birimler)

### 10.1. Cihaz Envanteri ve Excel İçe/Dışa Aktarım (`/dashboard/devices`)
- **Yeni Cihaz Ekleme:** Cihaz adı, marka, model, seri no, ÜTS barkodu, kategori, bulunduğu bölüm, garanti bitiş tarihi ve kalibrasyon periyodu girilir. Künye numarası boş bırakılırsa sistem şablona göre otomatik üretir.
- **Excel'den Toplu Cihaz Aktarımı:** Binlerce cihazı tek tek girmek yerine **"Excel İçe Aktar"** butonu ile örnek Excel şablonunu indirip doldurarak tüm hastane envanterini saniyeler içinde sisteme yükleyebilirsiniz.
- **Zimmet Tutanakları:** Cihaz detay sayfasından resmi ıslak imzaya hazır **Cihaz Zimmet Tutanağı** yazdırılabilir.

### 10.2. Klinik Personel İçin QR Kod İle Hızlı Arıza Bildirimi (`/scan/[id]` ve `/report-fault`)
- Hemşire veya doktor, arızalanan cihazın üzerindeki QR etiketi telefon kamerasıyla okuttuğunda:
  1. Cihazın künye kartı, son bakım/kalibrasyon durumu ve **Türkçe Güvenli Kullanım Talimatı** açılır.
  2. **"Arıza Bildir"** butonuna bastığında cihaz otomatik seçilir; personel sadece adını, bölümünü ve arıza açıklamasını (Örn: *"Batarya şarj olmuyor"*) yazıp gönderir.
  3. **Otomatik Senkronizasyon:** Arıza bildirildiği anda cihazın durumu otomatik olarak **`Bakımda / Arızalı (IN_MAINTENANCE)`** statüsüne geçer, Biyomedikal ekranına yüksek öncelikli **İş Emri (WorkOrder)** düşer ve sesli/görsel bildirim üretilir.

### 10.3. Arıza & Periyodik Bakım Yönetimi (`/dashboard/maintenance`)
- Kliniklerden gelen arıza bildirimleri ve planlı periyodik bakımlar tek ekranda yönetilir.
- Bakım veya iş emri durumu **`Tamamlandı (COMPLETED)`** olarak güncellendiğinde:
  - Cihazın durumu otomatik olarak tekrar **`Aktif (ACTIVE)`** statüsüne döner.
  - Cihazın **`Son Bakım Tarihi`** otomatik güncellenir.
- Her işlem için **Bakım Servis Formu** PDF/yazıcı çıktısı alınabilir.

### 10.4. Kalibrasyon Takibi (`/dashboard/calibration`)
- Tıbbi cihazların kalibrasyon tarihleri, sertifika numaraları, ölçüm sonuçları (*Kullanıma Uygundur / Sınırlı Kullanıma Uygundur / Uygun Değildir*), kalibrasyon maliyetleri ve PDF sertifikaları kaydedilir.
- Süresi yaklaşan veya geçen kalibrasyonlar hem üst bildirim çubuğunda hem de Ana Panel'de otomatik uyarı verir.

### 10.5. Bakım Sözleşmeleri (`/dashboard/contracts`)
- Dış firmalarla yapılan Yedek Parça Dahil / Hariç bakım sözleşmeleri, kapsadığı cihazlar, başlangıç-bitiş tarihleri, sözleşme bedeli ve PDF sözleşme dosyaları takip edilir.

### 10.6. Maliyet & TCO Analitiği ve SKS Kalite Raporları (`/dashboard/reports` & `/dashboard/compliance`)
- **Maliyet & TCO (`/dashboard/reports/costs`):** Cihaz bazlı, bölüm (servis) bazlı ve aylık toplam bakım + yedek parça + kalibrasyon maliyetleri grafiklerle analiz edilir. Satın alma maliyetine göre onarım maliyeti yüksek olan (HEK adayları) cihazlar tespit edilir.
- **Sağlıkta Kalite Standartları (SKS) & Denetim:** Sağlık Bakanlığı SKS denetimlerinde istenen tüm envanter, kalibrasyon başarı oranı, arıza müdahale süreleri (MTTR / MTBF) ve eğitim kayıtları tek tıkla raporlanır.

### 10.7. Personel ve Cihaz Kullanıcı Eğitimleri (`/dashboard/staff` & `/dashboard/training`)
- Hastane personelinin tıbbi cihaz kullanıcı eğitimleri, eğitmen bilgileri, katılımcı listeleri ve ıslak imzalı eğitim katılım tutanakları arşivlenir.

---

## 11. Bilgi İşlem (IT) Sorun Giderme (Troubleshooting) Rehberi

| Karşılaşılan Durum | Olası Neden | Çözüm Adımı |
| :--- | :--- | :--- |
| **Diğer bilgisayarlardan `http://IP:3000` açılmıyor** | Windows Güvenlik Duvarı 3000 portunu engelliyor. | `GUVENLIK_DUVARI_AYARLA.bat` dosyasına sağ tıklayıp **"Yönetici olarak çalıştır"** deyin. |
| **Giriş yaparken sayfa tekrar `/login` ekranına dönüyor** | `.env` dosyasındaki `NEXTAUTH_URL` ile girilen IP adresi uyuşmuyor. | `.env` içindeki `NEXTAUTH_URL` değerini sunucunun yerel IP adresi (`http://192.168.x.x:3000`) yapıp sunucuyu yeniden başlatın. |
| **Sunucu başlarken `Port 3000 is already in use` hatası** | Arka planda açık kalmış eski bir Node.js işlemi var. | `BASLAT.bat` çalıştırıldığında 3000 portunu otomatik temizler; veya Görev Yöneticisi'nden `node.exe` işlemini sonlandırıp `BASLAT.bat` çalıştırın. |
| **Veritabanı bağlantı hatası (`Can't reach database server`)** | PostgreSQL servisi durmuş veya `.env` şifresi hatalı. | Windows Hizmetler (`services.msc`) ekranından `postgresql-x64-...` servisinin **Çalışıyor (Running)** olduğundan emin olun. |
| **QR Etiket yazdırırken 2 etiket birden çıkıyor** | Tarayıcı yazdırma ekranında "Üstbilgi ve Altbilgiler" açık veya ölçek %100'den büyük. | Yazdırma penceresinde **Daha fazla ayar > Kenar boşlukları: Yok** seçin ve **Üstbilgi ve altbilgiler** kutucuğunun işaretini kaldırın. |

---
*MediSync Biyomedikal Yönetim Sistemi — Kurumsal Dağıtım Sürümü*
