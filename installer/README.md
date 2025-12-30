# MediSync Installer Kurulum Rehberi

Bu klasör, MediSync uygulamasının tam kurulum paketini (offline installer) oluşturmak için gerekli dosyaları içerir. Kurulum paketini oluşturmadan önce aşağıdaki adımları tamamlamanız gerekmektedir.

## 1. Gerekli Çalışma Zamanı (Runtime) Dosyaları

Uygulamanın hedef bilgisayarda herhangi bir ön gereksinim olmadan çalışabilmesi için **Node.js** ve **PostgreSQL**'in taşınabilir (portable) versiyonlarını indirip bu klasöre koymanız gerekir.

Lütfen aşağıdaki klasör yapısını oluşturun:

```
installer/
└── runtime/
    ├── nodejs/   <-- Node.js dosyaları burada olmalı (node.exe burada)
    └── pgsql/    <-- PostgreSQL dosyaları burada olmalı (bin, data vb.)
```

### Node.js Kurulumu
1. [Node.js İndirme Sayfası](https://nodejs.org/en/download/prebuilt-binaries)'na gidin.
2. Windows Binary (.zip) seçeneğini indirin (örn: node-v20.x.x-win-x64.zip).
3. Zip içeriğini `installer/runtime/nodejs` klasörüne çıkartın.
   - Kontrol: `installer/runtime/nodejs/node.exe` mevcut olmalı.

### PostgreSQL Kurulumu
1. [PostgreSQL Portable](https://github.com/gullerya/postgresql-portable/releases) veya [EnterpriseDB Binaries](https://www.enterprisedb.com/download-postgresql-binaries) adresinden Windows binaries (zip) indirin.
2. Zip içeriğini `installer/runtime/pgsql` klasörüne çıkartın.
3. Zip'in içindeki ana klasörü değil, `pgsql` klasörünün **içindeki** dosyaları buraya koyun.
   - Kontrol: `installer/runtime/pgsql/bin/pg_ctl.exe` mevcut olmalı.

## 2. Kurulum Paketini Oluşturma (Build)

1. [Inno Setup](https://jrsoftware.org/isdl.php) programını indirin ve kurun.
2. `medisync-setup.iss` dosyasını çift tıklayarak açın.
3. Üst menüden **Build > Compile** seçeneğine tıklayın.
4. İşlem tamamlandığında `installer-output` klasöründe `MediSync-Setup-v1.0.exe` dosyası oluşacaktır.

## 3. Kurulum ve Test

Oluşturulan `.exe` dosyasını temiz bir bilgisayarda (veya sanal makinede) çalıştırın.
- Kurulum bittikten sonra "MediSync'i Başlat" seçeneği seçiliyse `start-medisync.bat` çalışacaktır.
- İlk çalıştırmada `init-database.bat` otomatik devreye girip veritabanını kuracaktır.
- Uygulama otomatik olarak `npm run build` komutunu çalıştırıp (eğer yapılmamışsa) servis verecektir.
