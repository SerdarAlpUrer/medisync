# 🚀 HIZLI BAŞLANGIÇ

## Adım 1: Node.js Kurun (Sadece 1 Kez)

1. **İndirin**: https://nodejs.org/ → Yeşil "LTS" butonu
2. **Kurun**: İndirilen dosyayı çalıştırın, tüm ayarları default bırakın
3. **Yeniden Başlatın**: Bilgisayarı restart edin

## Adım 2: Uygulamayı Başlatın

Node.js kurulduktan sonra:

### Windows'ta:
`BASLAT.bat` dosyasına **çift tıklayın**

✅ Otomatik olarak:
- Bağımlılıkları yükler
- Veritabanını hazırlar  
- Demo verileri ekler
- Sunucuyu başlatır

### Manuel Başlatma:
```bash
cd c:\Users\biyomedikal\biomedicapp
npm install
npm run db:generate
npm run db:push
npm run dev
```

## Adım 3: Tarayıcıda Açın

http://localhost:3000

### Demo Giriş Bilgileri:
- **Email**: admin@biomedicapp.com
- **Şifre**: admin123

---

## ⚠️ Sorun Giderme

### "node is not recognized" Hatası
→ Node.js'i kurun ve bilgisayarı yeniden başlatın

### Port 3000 zaten kullanımda
→ `npm run dev -- -p 3001` ile farklı port kullanın

### Veritabanı hatası
→ `prisma/dev.db` dosyasını silin ve `npm run db:push` çalıştırın

---

**Destek için**: README.md dosyasını okuyun
