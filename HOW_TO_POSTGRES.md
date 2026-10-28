# PostgreSQL Kurulum Talimatları

Veritabanı yapısı PostgreSQL olarak güncellenmiştir. Başlatmadan önce lütfen aşağıdaki adımları takip ediniz:

1. **.env dosyasını güncelleyin:**
   Proje ana dizinindeki `.env` dosyasını açın ve `DATABASE_URL` satırını PostgreSQL bağlantı bilginizle değiştirin/ekleyin.

   Örnek:
   ```env
   DATABASE_URL="postgresql://kullanici_adi:sifre@localhost:5432/veritabani_adi?schema=public"
   ```

2. **Veritabanını Hazırlayın:**
   PostgreSQL sunucunuzda (örn: pgAdmin üzerinden) boş bir veritabanı oluşturun (örn: `biomedicapp`).

3. **Kurulumu Başlatın:**
   `KURULUM.bat` dosyasını çalıştırın. Bu işlem veritabanı tablolarını oluşturacak ve örnek verileri yükleyecektir.

4. **Uygulamayı Başlatın:**
   `BASLAT.bat` veya `TEK_TIK_BASLAT.bat` dosyaları ile uygulamayı başlatabilirsiniz.

**Not:** SQLite (`dev.db`) artık kullanılmamaktadır.
