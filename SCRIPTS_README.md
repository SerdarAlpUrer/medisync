# MediSync - Batch Dosyaları Rehberi

Bu belge, MediSync'i başlatmak ve yönetmek için kullanılan Windows batch (.bat) dosyalarını açıklar.

---

## 🚀 Kullanıcılar İçin (Günlük Kullanım)

### `BASLAT.bat`
**Amacı:** MediSync sunucusunu başlatır.

**Ne Yapar:**
- Node.js ve bağımlılıkların kurulu olduğunu kontrol eder
- Prisma Client'ı kontrol eder (yoksa oluşturur)
- Development sunucusunu başlatır
- Tarayıcıda `http://localhost:3000` adresini açar

**Ne Zaman Kullanılır:** Günlük normal kullanım için.

---

## 🔧 Kurulum Dosyaları

### `KURULUM.bat`
**Amacı:** İlk kurulum ve tam yeniden kurulum yapar.

**Ne Yapar:**
1. Node.js ve NPM kontrolü
2. NPM cache temizleme
3. Bağımlılıkları yükleme (`npm install`)
4. Prisma Client oluşturma
5. Veritabanı migration
6. Seed verilerini yükleme

**Ne Zaman Kullanılır:** 
- İlk kez kurulum yaparken
- Sorun çıktığında tam yeniden kurulum için

---

### `TEK_TIK_BASLAT.bat`
**Amacı:** Tek tıkla hem kurulum hem başlatma yapar.

**Ne Yapar:**
- Kurulum yapılmamışsa otomatik yapar
- Ağ IP adreslerini gösterir (mobil erişim için)
- 5 saniye sonra tarayıcıyı otomatik açar
- Sunucuyu başlatır

**Ne Zaman Kullanılır:** Yeni bilgisayarda tek tıkla başlatmak için.

---

## 🛠️ Geliştirici/Admin Araçları

### `KEYGEN.bat`
**Amacı:** Lisans anahtarı oluşturur.

**Seçenekler:**
- 30 günlük deneme lisansı
- 1 yıllık lisans
- Sınırsız lisans
- Özel süre girme

**Ne Zaman Kullanılır:** Yeni lisans kodu gerektiğinde.

---

### `SETUP_OLUSTUR.bat`
**Amacı:** Windows kurulum paketi (.exe) oluşturur.

**Gereksinimler:** Inno Setup kurulu olmalı

**Ne Yapar:** `output/MediSync_Setup_v1.0.0.exe` dosyası oluşturur.

**Ne Zaman Kullanılır:** Dağıtım için setup dosyası üretmek istediğinizde.

---

### `TEST_KURULUM.bat`
**Amacı:** Kurulum durumunu kontrol eder (diagnostic).

**Ne Kontrol Eder:**
- node_modules klasörü
- package.json
- Prisma Client
- Veritabanı dosyası

**Ne Zaman Kullanılır:** Kurulumda sorun olduğunda teşhis için.

---

## 📋 Özet Tablo

| Dosya | Kısa Açıklama | Hedef Kullanıcı |
|-------|---------------|-----------------|
| `BASLAT.bat` | Sunucuyu başlatır | Tüm kullanıcılar |
| `KURULUM.bat` | Tam kurulum yapar | İlk kurulum |
| `TEK_TIK_BASLAT.bat` | Kurulum + başlatma | Yeni kullanıcılar |
| `KEYGEN.bat` | Lisans oluşturur | Admin |
| `SETUP_OLUSTUR.bat` | Setup paketi yapar | Geliştirici |
| `TEST_KURULUM.bat` | Kurulum kontrolü | Sorun giderme |

---

## 💡 Önerilen Kullanım Akışı

1. **İlk Kurulum:** `KURULUM.bat` çalıştırın
2. **Günlük Kullanım:** `BASLAT.bat` çalıştırın
3. **Sorun Çıkarsa:** `TEST_KURULUM.bat` ile kontrol edin
