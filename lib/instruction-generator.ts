/**
 * Cihaz türüne göre otomatik kullanım talimatı oluştur
 */
export function generateUsageInstructions(
  deviceName: string,
  deviceCategory: string,
  deviceGroup?: string
): string {
  const categoryLower = deviceCategory.toLowerCase()
  const groupLower = deviceGroup?.toLowerCase() || ''

  // Görüntüleme Cihazları
  if (groupLower.includes('görüntüleme') || categoryLower.includes('mri') || categoryLower.includes('ct') || 
      categoryLower.includes('röntgen') || categoryLower.includes('ultrason')) {
    return `## ${deviceName} Kullanım Talimatı

### Genel Bilgiler
Bu cihaz tıbbi görüntüleme amaçlı kullanılmaktadır. Kullanımdan önce mutlaka yetkili personel tarafından eğitim alınmış olunması gerekmektedir.

### Kullanım Öncesi Kontrol
1. Cihazın elektrik bağlantısını kontrol edin
2. Cihazın açılış prosedürünü takip edin
3. Sistem uyarı mesajlarını kontrol edin
4. Hasta verilerinin doğru girildiğinden emin olun

### Kullanım Adımları
1. Cihazı açın ve başlangıç kontrollerini yapın
2. Hasta bilgilerini sisteme girin
3. Görüntüleme parametrelerini ayarlayın
4. Hastayı doğru pozisyonda konumlandırın
5. Görüntüleme işlemini başlatın
6. İşlem sonrası görüntüleri kontrol edin ve kaydedin

### Güvenlik Önlemleri
- Radyasyon güvenliği kurallarına uyun
- Hastayı gereksiz radyasyona maruz bırakmayın
- Acil durumlarda acil durdurma butonunu kullanın
- Cihazın çevresinde metal objeler bulundurmayın (MRI için)

### Kullanım Sonrası
1. Cihazı kapatın veya standby moduna alın
2. Hasta bilgilerini kaydedin
3. Cihazı temizleyin ve dezenfekte edin
4. Herhangi bir arıza veya anormal durumda yetkililere bildirin

### Arıza Bildirimi
Cihazda herhangi bir arıza veya anormal durum fark edildiğinde derhal biyomedikal birimine bildirin.`
  }

  // Yaşam Destek Cihazları
  if (groupLower.includes('yaşam destek') || categoryLower.includes('ventilatör') || 
      categoryLower.includes('defibrilatör') || categoryLower.includes('anestezi') ||
      categoryLower.includes('infüzyon pompası')) {
    return `## ${deviceName} Kullanım Talimatı

### Genel Bilgiler
Bu cihaz hasta yaşam desteği sağlamak için kritik öneme sahiptir. Sadece yetkili ve eğitimli personel tarafından kullanılmalıdır.

### Kullanım Öncesi Kontrol
1. Cihazın güç kaynağını kontrol edin
2. Alarm sistemlerinin aktif olduğundan emin olun
3. Yedek güç kaynağının (batarya) şarj durumunu kontrol edin
4. Tüm sensörlerin ve probların doğru bağlandığını kontrol edin
5. Acil durdurma mekanizmasının çalıştığını test edin

### Kullanım Adımları
1. Cihazı açın ve kalibrasyon işlemlerini tamamlayın
2. Hasta bilgilerini sisteme girin
3. Hasta parametrelerini (yaş, kilo, durum vb.) ayarlayın
4. Cihaz parametrelerini hekime danışarak ayarlayın
5. Hastayı cihaza bağlayın
6. Başlangıç değerlerini kontrol edin ve kaydedin
7. İşlem boyunca hastayı ve cihazı sürekli izleyin

### Kritik Güvenlik Kuralları
- Cihaz hiçbir zaman hasta ile yalnız bırakılmamalıdır
- Alarm seslerini asla kapatmayın veya görmezden gelmeyin
- Arıza durumunda derhal manuel müdahale için hazır olun
- Yedek cihaz ve malzeme her zaman hazır bulundurulmalıdır
- Acil durum prosedürlerini bilin ve uygulayın

### Alarm Yönetimi
- Tüm alarmları ciddiye alın
- Alarm durumunda önce hastanın durumunu kontrol edin
- Gerekli düzeltmeleri yapın
- Çözülemezse derhal hekime ve biyomedikal birime bildirin

### Kullanım Sonrası
1. Hasta ile bağlantıyı güvenli şekilde kesin
2. Cihazı kapatın ve temizlik/dezenfeksiyon prosedürünü uygulayın
3. Kullanım kaydını tutun
4. Tek kullanımlık malzemeleri uygun şekilde bertaraf edin
5. Cihazı şarj edin veya bakıma hazırlayın`
  }

  // İzleme Cihazları
  if (groupLower.includes('izleme') || categoryLower.includes('monitör') || 
      categoryLower.includes('ekg') || categoryLower.includes('pulse oksimetre')) {
    return `## ${deviceName} Kullanım Talimatı

### Genel Bilgiler
Bu cihaz hasta vital bulgularını izlemek için kullanılmaktadır. Doğru kullanım hayati öneme sahiptir.

### Kullanım Öncesi Kontrol
1. Cihazın güç durumunu kontrol edin
2. Sensörlerin ve kabloların bütünlüğünü kontrol edin
3. Ekranın düzgün çalıştığını kontrol edin
4. Alarm ayarlarının uygun olduğunu kontrol edin

### Kullanım Adımları
1. Cihazı açın ve başlangıç testlerini yapın
2. Hasta bilgilerini sisteme girin
3. Hasta parametreleri için uygun alarm limitlerini ayarlayın
4. Sensörleri/probları hastaya bağlayın
5. Sinyallerin alındığını ve doğru görüntülendiğini kontrol edin
6. İzleme süresince düzenli olarak kontrol edin

### Güvenlik Önlemleri
- Elektrot/prob bağlantılarının doğru olduğundan emin olun
- Kabloların hasta hareketlerini engellemediğinden emin olun
- Alarm limitlerini uygun şekilde ayarlayın
- Cihazın elektrik güvenliğini kontrol edin

### Alarm Yönetimi
- Alarm durumunda hastayı kontrol edin
- Gerekiyorsa müdahale edin
- Alarm kayıtlarını tutun
- Devam eden alarmlarda hekime bildirin

### Kullanım Sonrası
1. Hastadan bağlantıları çıkarın
2. Cihazı kapatın
3. Kullanılan malzemeleri dezenfekte edin veya atın
4. Kullanım kaydını tutun`
  }

  // Laboratuvar Cihazları
  if (groupLower.includes('laboratuvar') || categoryLower.includes('analiz') || 
      categoryLower.includes('mikroskop') || categoryLower.includes('santrifüj')) {
    return `## ${deviceName} Kullanım Talimatı

### Genel Bilgiler
Bu cihaz laboratuvar analizleri için kullanılmaktadır. Kalite kontrol prosedürlerine uygun kullanılmalıdır.

### Kullanım Öncesi Kontrol
1. Cihazın temiz ve dezenfekte olduğundan emin olun
2. Kalibrasyon durumunu kontrol edin
3. Gerekli reaktiflerin ve malzemelerin hazır olduğunu kontrol edin
4. Çalışma ortamının uygun koşullarda olduğunu kontrol edin

### Kullanım Adımları
1. Cihazı açın ve sistem kontrollerini yapın
2. Kalite kontrol örneklerini çalıştırın
3. Örnekleri hazırlayın ve cihaza yerleştirin
4. Analiz parametrelerini seçin
5. İşlemi başlatın
6. Sonuçları kontrol edin ve doğrulayın
7. Sonuçları sisteme kaydedin

### Kalite Kontrol
- Her çalışma öncesi kalite kontrol örnekleri kullanın
- Sonuçları kabul kriterleriyle karşılaştırın
- Uygun olmayan sonuçlarda cihazı kullanmayın ve biyomedikal birime bildirin

### Güvenlik Önlemleri
- Kişisel koruyucu ekipman kullanın
- Biyolojik örneklerle çalışırken dikkatli olun
- Kimyasal reaktiflerle çalışırken güvenlik kurallarına uyun
- Cihazın bakımını düzenli yaptırın

### Kullanım Sonrası
1. Cihazı temizleyin ve dezenfekte edin
2. Örnekleri uygun şekilde bertaraf edin
3. Kullanım kaydını tutun
4. Herhangi bir sorun durumunda rapor edin`
  }

  // Genel Talimat (varsayılan)
  return `## ${deviceName} Kullanım Talimatı

### Genel Bilgiler
Bu cihaz tıbbi amaçlı kullanılmaktadır. Kullanımdan önce mutlaka yetkili personel tarafından eğitim alınmış olunması gerekmektedir.

### Kullanım Öncesi Kontrol
1. Cihazın güç bağlantısını kontrol edin
2. Cihazın görsel kontrollerini yapın
3. Alarm sistemlerinin aktif olduğundan emin olun
4. Gerekli malzemelerin hazır olduğunu kontrol edin

### Kullanım Adımları
1. Cihazı açın ve başlangıç kontrollerini yapın
2. Hasta/işlem bilgilerini sisteme girin
3. Cihaz parametrelerini ayarlayın
4. İşlemi gerçekleştirin
5. Sonuçları kontrol edin ve kaydedin

### Güvenlik Önlemleri
- Cihazı üretici talimatlarına göre kullanın
- Acil durum prosedürlerini bilin
- Herhangi bir arıza durumunda derhal bildirin
- Düzenli bakım ve kontrolleri yaptırın

### Kullanım Sonrası
1. Cihazı kapatın veya standby moduna alın
2. Cihazı temizleyin ve dezenfekte edin
3. Kullanım kaydını tutun
4. Herhangi bir sorun durumunda rapor edin

### Arıza Bildirimi
Cihazda herhangi bir arıza veya anormal durum fark edildiğinde derhal biyomedikal birimine bildirin.`
}

/**
 * Bakım prosedürü oluştur
 */
export function generateMaintenanceProcedure(
  deviceName: string,
  deviceCategory: string,
  deviceGroup?: string
): string {
  const categoryLower = deviceCategory.toLowerCase()
  const groupLower = deviceGroup?.toLowerCase() || ''

  // Görüntüleme Cihazları Bakımı
  if (groupLower.includes('görüntüleme')) {
    return `## ${deviceName} Bakım Prosedürü

### Periyodik Bakım (Aylık)
1. Cihazın dış yüzeylerini temizleyin
2. Soğutma sistemlerini kontrol edin
3. Güç kaynağı ve bağlantıları kontrol edin
4. Sistem loglarını kontrol edin
5. Test görüntüleri çekin ve değerlendirin

### Periyodik Bakım (Yıllık)
1. Detaylı temizlik ve dezenfeksiyon
2. Elektriksel güvenlik testleri
3. Kalibrasyon kontrolleri
4. Yazılım güncellemeleri kontrolü
5. Yedek parça stok kontrolü

### Günlük Kontroller
- Cihazın açılış testlerini kontrol edin
- Görsel kontrolleri yapın
- Alarm sistemlerini test edin`
  }

  // Yaşam Destek Cihazları Bakımı
  if (groupLower.includes('yaşam destek')) {
    return `## ${deviceName} Bakım Prosedürü

### Günlük Bakım
1. Dış yüzey temizliği
2. Alarm fonksiyon testi
3. Batarya durumu kontrolü
4. Sensör ve prob kontrolü
5. Acil durdurma testi

### Haftalık Bakım
1. Detaylı temizlik
2. Kalibrasyon kontrolü
3. Yedek parça kontrolü
4. Kullanım kayıtları gözden geçirme

### Aylık Bakım
1. Elektriksel güvenlik testleri
2. Performans testleri
3. Yazılım güncellemeleri
4. Yedek cihaz hazırlığı kontrolü`
  }

  // Genel Bakım Prosedürü
  return `## ${deviceName} Bakım Prosedürü

### Günlük Kontroller
1. Görsel kontrol
2. Temel fonksiyon testleri
3. Alarm sistemleri kontrolü

### Haftalık Bakım
1. Temizlik ve dezenfeksiyon
2. Kalibrasyon kontrolü
3. Kullanım kayıtları gözden geçirme

### Aylık Bakım
1. Detaylı temizlik
2. Elektriksel güvenlik testleri
3. Performans testleri
4. Yedek parça kontrolü

### Yıllık Bakım
1. Komple servis bakımı
2. Kalibrasyon
3. Yedek parça değişimleri (gerekirse)
4. Sistem güncellemeleri`
}

/**
 * Güvenlik uyarıları oluştur
 */
export function generateSafetyWarnings(
  deviceCategory: string,
  deviceGroup?: string
): string[] {
  const categoryLower = deviceCategory.toLowerCase()
  const groupLower = deviceGroup?.toLowerCase() || ''
  const warnings: string[] = []

  if (groupLower.includes('görüntüleme')) {
    warnings.push('Radyasyon güvenliği kurallarına mutlaka uyun')
    warnings.push('Hastayı gereksiz radyasyona maruz bırakmayın')
    if (categoryLower.includes('mri')) {
      warnings.push('MR odasına metal objeler sokmayın')
      warnings.push('Pacemaker ve metal implant hastaları için özel önlemler alın')
    }
  }

  if (groupLower.includes('yaşam destek')) {
    warnings.push('Bu cihaz kritik yaşam desteği sağlar, asla hasta ile yalnız bırakmayın')
    warnings.push('Alarm seslerini asla kapatmayın')
    warnings.push('Acil durum prosedürlerini bilin ve uygulayın')
    warnings.push('Yedek cihaz her zaman hazır bulundurulmalıdır')
  }

  if (groupLower.includes('laboratuvar')) {
    warnings.push('Biyolojik örneklerle çalışırken kişisel koruyucu ekipman kullanın')
    warnings.push('Kimyasal reaktiflerle çalışırken güvenlik kurallarına uyun')
  }

  warnings.push('Cihazı üretici talimatlarına göre kullanın')
  warnings.push('Herhangi bir arıza durumunda derhal biyomedikal birime bildirin')

  return warnings
}
