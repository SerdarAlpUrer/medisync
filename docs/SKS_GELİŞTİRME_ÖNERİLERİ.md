# SKS Geliştirme Önerileri - BioMedicApp 2026

## 📋 Giriş

Bu dokümantasyon, Sağlıkta Kalite Standartları (SKS) denetlemelerinde sorulan sorulara göre yazılıma eklenebilecek özellikleri içermektedir. Her özellik, ilgili SKS standart kodu ve denetim sorusu ile birlikte sunulmaktadır.

---

## 🔍 Mevcut Özellikler (✅)

Yazılımda halihazırda bulunan özellikler:

- ✅ Cihaz Envanteri Yönetimi (DMC10 - İzlenebilirlik)
- ✅ Bakım ve Onarım Takibi (DMC12, DMC14)
- ✅ Kalibrasyon Yönetimi (DMC12)
- ✅ Cihaz Hareket Takibi (DMC10)
- ✅ Audit Log (FDA 21 CFR Part 11 uyumlu)
- ✅ CAPA Yönetimi
- ✅ Olumsuz Olay Raporlama (Adverse Events)
- ✅ Elektronik İmza Sistemi
- ✅ KVKK Veri Sahibi Talepleri

---

## 🚀 Önerilen Yeni Özellikler

### 1. Personel Eğitim ve Yetkilendirme Modülü

**SKS Standardı:** DMC08 - Görev, Yetki ve Sorumluluklar  
**Denetim Sorusu:** "Cihazların yönetimine ilişkin görev, yetki ve sorumluluklar tanımlanmış mı?"

#### Özellikler:
- Personel eğitim kayıtları (eğitim tarihi, süresi, içerik, eğitmen)
- Cihaz bazlı yetkilendirme (hangi personelin hangi cihazları kullanabileceği)
- Sertifikasyon takibi (sertifika numarası, geçerlilik tarihi, yenileme tarihleri)
- Yeterlilik değerlendirme (test sonuçları, pratik sınav sonuçları)
- Eğitim planı ve hatırlatıcılar (yeniden eğitim tarihleri)
- Eğitim belgeleri yükleme (PDF, sertifikalar)

#### Veritabanı Modeli:
```prisma
model TrainingRecord {
  id              String   @id @default(cuid())
  userId          String
  user            User     @relation(...)
  
  trainingType    String   // DEVICE_SPECIFIC, GENERAL_SAFETY, MAINTENANCE
  title           String
  description     String?
  trainingDate    DateTime
  duration        Int      // Dakika
  instructor      String?
  institution     String?
  
  // Sertifikasyon
  certificateNumber String?
  certificateFile   String?
  expiryDate        DateTime?
  
  // Sonuç
  status          String   // PLANNED, COMPLETED, FAILED, EXPIRED
  score           Float?
  passingScore    Float?
  notes           String?
  
  // İlişkiler
  deviceTrainings DeviceTraining[]
  
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}

model DeviceTraining {
  id              String         @id @default(cuid())
  trainingRecordId String
  trainingRecord  TrainingRecord @relation(...)
  deviceId        String?
  device          Device?        @relation(...)
  
  authorized      Boolean  @default(false)
  authorizedBy    String?
  authorizedDate  DateTime?
  
  createdAt       DateTime @default(now())
}
```

---

### 2. Cihaz Teslim Alma ve Hizmete Sunma Süreci

**SKS Standardı:** DMC09 - Temin ve Hizmete Sunulma  
**Denetim Sorusu:** "Cihazların temini ve hizmete sunulmasına yönelik düzenlemeler mevcut mu?"

#### Özellikler:
- Satın alma siparişi takibi
- Teslim alma kontrol listesi (ambalaj kontrolü, belgeler, eksik parçalar)
- Kurulum ve test süreci (ilk kurulum kaydı, test sonuçları)
- Onay süreci (kabul/red, onaylayan kişi, tarih)
- Hizmete alma (aktif kullanıma başlama, ilk kullanıcı eğitimi)
- Kabul edilmeyen cihazlar için iade süreci

#### Veritabanı Modeli:
```prisma
model DeviceProcurement {
  id                String   @id @default(cuid())
  purchaseOrderNumber String @unique
  deviceId          String?
  device            Device?  @relation(...)
  
  // Sipariş Bilgileri
  supplierId        String?
  supplier          Supplier? @relation(...)
  orderDate         DateTime
  expectedDeliveryDate DateTime?
  actualDeliveryDate DateTime?
  
  // Teslim Alma
  deliveryStatus    String   // PENDING, DELIVERED, REJECTED, RETURNED
  deliveryChecklist String?  // JSON: {ambalaj: bool, belgeler: bool, ...}
  deliveryNotes     String?
  receivedBy        String?
  receivedDate      DateTime?
  
  // Kurulum ve Test
  installationStatus String? // PENDING, IN_PROGRESS, COMPLETED
  installationDate   DateTime?
  installerName      String?
  installationNotes  String?
  testResults        String? // JSON: {test1: pass/fail, ...}
  
  // Onay
  acceptanceStatus   String? // PENDING, ACCEPTED, REJECTED
  acceptedBy         String?
  acceptanceDate     DateTime?
  rejectionReason    String?
  
  // Hizmete Alma
  commissioningStatus String @default("PENDING") // PENDING, COMMISSIONED
  commissionedBy      String?
  commissionedDate    DateTime?
  firstUserTrainingDate DateTime?
  
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
}
```

---

### 3. Cihaz Kullanım Dışı Bırakma (Decommissioning) Yönetimi

**SKS Standardı:** DMC15 - Kullanım Dışı Bırakılma  
**Denetim Sorusu:** "Cihazların kullanım dışı bırakılması sürecine yönelik düzenlemeler mevcut mu?"

#### Özellikler:
- Kullanım dışı bırakma talebi ve gerekçesi
- Değerlendirme süreci (teknik değerlendirme, mali analiz)
- Onay süreci (yönetim onayı, departman onayı)
- Fiziksel işlemler (depolama, hurda, bağış, satış)
- Veri silme/kalıcı silme (veri güvenliği)
- Dokümantasyon arşivleme

#### Veritabanı Modeli:
```prisma
model DeviceDecommissioning {
  id                  String   @id @default(cuid())
  deviceId            String
  device              Device   @relation(...)
  
  // Talep
  requestDate         DateTime @default(now())
  requestedBy         String?
  reason              String   // OBSOLETE, DAMAGED, REPLACED, SAFETY_CONCERN
  reasonDetails       String?
  
  // Değerlendirme
  evaluationStatus    String   @default("PENDING") // PENDING, EVALUATING, APPROVED, REJECTED
  evaluatedBy         String?
  evaluationDate      DateTime?
  evaluationNotes     String?
  technicalAssessment String?  // JSON
  
  // Onay
  approvalStatus      String?  // PENDING, APPROVED, REJECTED
  approvedBy          String?
  approvalDate        DateTime?
  rejectionReason     String?
  
  // Fiziksel İşlem
  disposalMethod      String?  // SCRAP, DONATION, SALE, RECYCLE, STORAGE
  disposalDate        DateTime?
  disposalLocation    String?
  disposalCertificate String?  // PDF dosyası
  dataWiped           Boolean  @default(false)
  dataWipeDate        DateTime?
  dataWipeMethod      String?
  
  // Final
  status              String   @default("REQUESTED") // REQUESTED, APPROVED, COMPLETED
  completedDate       DateTime?
  
  createdAt           DateTime @default(now())
  updatedAt           DateTime @updatedAt
}
```

---

### 4. Hasta Başı Test Cihazları (HBTC) Yönetimi

**SKS Standardı:** DMC16 - Hasta Başı Test Cihazları  
**Denetim Sorusu:** "Hasta Başı Test Cihazlarının (HBTC) kullanım süreci ve kalite kontrol çalışmalarına yönelik düzenlemeler yapılmış mı?"

#### Özellikler:
- HBTC tanımlama (glukometre, nabız oksimetre vb.)
- Kullanım kayıtları (hasta bazlı, tarih/saat)
- Kalite kontrol (QC) testleri (kontrol solüsyonu testleri, prosedür)
- QC test sonuçları takibi (kabul/ret kriterleri)
- Kalibrasyon ve bakım özel takibi
- Kullanıcı yetkilendirme (sadece yetkili personel kullanabilir)

#### Veritabanı Modeli:
```prisma
model HBTCDevice {
  id                    String   @id @default(cuid())
  deviceId              String   @unique
  device                Device   @relation(...)
  
  // HBTC Özel Bilgiler
  testType              String   // GLUCOSE, BLOOD_PRESSURE, PULSE_OXIMETER, etc.
  qcInterval            Int      // Günlük QC test aralığı
  qcProcedure           String?  // QC prosedür dokümantasyonu
  
  // Kullanım Takibi
  usageRecords          HBTCUsage[]
  qcRecords             HBTCQualityControl[]
  
  createdAt             DateTime @default(now())
  updatedAt             DateTime @updatedAt
}

model HBTCUsage {
  id              String   @id @default(cuid())
  deviceId        String
  device          HBTCDevice @relation(...)
  
  // Hasta Bilgileri (KVKK uyumlu - sadece ID)
  patientId       String?  // Hastane hasta ID'si (gerçek KVKK verisi değil)
  
  // Test Bilgileri
  testDate        DateTime @default(now())
  testType        String
  result          String?
  units           String?
  
  // Kullanıcı
  performedBy     String?  // User ID
  performedByName String?  // KVKK: isim ayrı saklanır
  
  notes           String?
  
  createdAt       DateTime @default(now())
}

model HBTCQualityControl {
  id              String   @id @default(cuid())
  deviceId        String
  device          HBTCDevice @relation(...)
  
  // QC Test Bilgileri
  testDate        DateTime
  testType        String   // CONTROL_SOLUTION, LINEARITY, PRECISION
  controlLevel    String?  // LOW, NORMAL, HIGH
  expectedValue   Float?
  actualValue     Float?
  tolerance       Float?
  
  // Sonuç
  result          String   // PASS, FAIL
  passed          Boolean
  notes           String?
  
  // Test Eden
  testedBy        String?
  testedByName    String?
  
  createdAt       DateTime @default(now())
}
```

---

### 5. İç Denetim (Internal Audit) Modülü

**SKS Standardı:** Genel Kalite Yönetimi  
**Denetim Sorusu:** "İç denetim süreçleri tanımlanmış ve düzenli olarak yapılıyor mu?"

#### Özellikler:
- Denetim planı (yıllık plan, denetim takvimi)
- Denetim yürütme (checklist, gözlemler, bulgular)
- Uygunsuzluk kayıtları (minor, major, critical)
- Düzeltici faaliyet bağlantısı (CAPA ile entegrasyon)
- Denetim raporu (PDF export)
- Takip ve kapanış

#### Veritabanı Modeli:
```prisma
model InternalAudit {
  id                  String   @id @default(cuid())
  auditNumber         String   @unique // AUD-2025-001
  
  // Planlama
  title               String
  scope               String   // "Cihaz Yönetimi", "Bakım Süreçleri", etc.
  auditType           String   // INTERNAL, EXTERNAL, SUPPLIER
  scheduledDate       DateTime
  actualDate          DateTime?
  
  // Denetçiler
  auditors            String   // User IDs (JSON array)
  leadAuditor         String?
  auditee             String?  // Department/Hospital
  
  // Yürütme
  status              String   @default("PLANNED") // PLANNED, IN_PROGRESS, COMPLETED, CLOSED
  checklist           String?  // JSON: SKS checklist items
  
  // Bulgular
  findings            AuditFinding[]
  
  // Rapor
  reportFile          String?  // PDF
  reportDate          DateTime?
  
  // Kapanış
  closedDate          DateTime?
  closedBy            String?
  
  createdAt           DateTime @default(now())
  updatedAt           DateTime @updatedAt
}

model AuditFinding {
  id                  String   @id @default(cuid())
  auditId             String
  audit               InternalAudit @relation(...)
  
  // Bulgu Detayları
  findingNumber       String   // AUD-2025-001-001
  description         String
  severity            String   // MINOR, MAJOR, CRITICAL
  sksStandard         String?  // DMC08, DMC12, etc.
  location            String?  // Nerede bulundu
  
  // Düzeltici Faaliyet
  capaId              String?
  capa                CAPA?    @relation(...)
  correctiveAction    String?
  targetDate          DateTime?
  
  // Takip
  status              String   @default("OPEN") // OPEN, IN_PROGRESS, VERIFIED, CLOSED
  verifiedDate        DateTime?
  verifiedBy          String?
  
  createdAt           DateTime @default(now())
  updatedAt           DateTime @updatedAt
}
```

---

### 6. Tedarikçi Değerlendirme ve Kalite Yönetimi

**SKS Standardı:** Genel Tedarikçi Yönetimi  
**Denetim Sorusu:** "Tedarikçiler değerlendiriliyor ve kalite kriterlerine göre seçiliyor mu?"

#### Özellikler:
- Tedarikçi kayıt sistemi (genişletilmiş - mevcut temel var)
- Tedarikçi değerlendirme formu (kalite, fiyat, teslim süresi, hizmet)
- Tedarikçi denetimi (yerinde denetim kayıtları)
- Performans takibi (teslim süresi, kalite oranı, şikayet sayısı)
- Onaylı tedarikçi listesi (aktif/pasif)
- Tedarikçi sertifikaları (ISO, TİTCK vb.)

#### Veritabanı Modeli:
```prisma
// Supplier modelini genişlet
model Supplier {
  // ... mevcut alanlar ...
  
  // Yeni Alanlar
  registrationNumber  String?  // TİTCK Kayıt No
  taxNumber           String?
  contactPerson       String?
  contactEmail        String?
  contactPhone        String?
  
  // Değerlendirme
  status              String   @default("PENDING") // PENDING, APPROVED, SUSPENDED, BLACKLISTED
  approvalDate        DateTime?
  approvedBy          String?
  lastEvaluationDate  DateTime?
  overallRating       Float?   // 1-5 arası
  
  // Performans Metrikleri
  totalOrders         Int      @default(0)
  onTimeDeliveryRate  Float?   // %
  qualityScore        Float?   // 1-5
  averageDeliveryDays Int?
  complaintCount      Int      @default(0)
  
  // Sertifikalar
  certificates        SupplierCertificate[]
  
  // İlişkiler
  evaluations         SupplierEvaluation[]
  audits              InternalAudit[]
  
  // ... mevcut ilişkiler ...
}

model SupplierCertificate {
  id              String   @id @default(cuid())
  supplierId      String
  supplier        Supplier @relation(...)
  
  certificateType String   // ISO_13485, TITCK_REGISTRATION, CE_MARKING
  certificateNumber String
  issuedBy        String?
  issueDate       DateTime?
  expiryDate      DateTime?
  certificateFile String?  // PDF
  
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}

model SupplierEvaluation {
  id              String   @id @default(cuid())
  supplierId      String
  supplier        Supplier @relation(...)
  
  evaluationDate  DateTime
  evaluatedBy     String?
  
  // Değerlendirme Kriterleri (1-5 arası)
  qualityScore    Float
  priceScore      Float
  deliveryScore   Float
  serviceScore    Float
  overallScore    Float
  
  comments        String?
  recommendation  String  // APPROVE, CONDITIONAL_APPROVAL, REJECT
  
  createdAt       DateTime @default(now())
}
```

---

### 7. Dokümantasyon Yönetimi

**SKS Standardı:** Genel Dokümantasyon Yönetimi  
**Denetim Sorusu:** "Süreç dokümantasyonu mevcut ve güncel tutuluyor mu?"

#### Özellikler:
- Doküman türleri (SOP, Manual, Prosedür, Talimat, Form)
- Versiyon kontrolü (revizyon numarası, tarih)
- Onay süreci (hazırlayan, gözden geçiren, onaylayan)
- Dağıtım listesi (kimler tarafından görüntülenebilir)
- Eski versiyonların arşivlenmesi
- Doküman arama ve filtreleme

#### Veritabanı Modeli:
```prisma
model Document {
  id                  String   @id @default(cuid())
  
  // Doküman Bilgileri
  title               String
  documentNumber      String   @unique // DOC-SOP-001
  documentType        String   // SOP, MANUAL, PROCEDURE, INSTRUCTION, FORM
  category            String?  // DEVICE_MANAGEMENT, MAINTENANCE, CALIBRATION, etc.
  
  // Versiyon Kontrolü
  version             String   @default("1.0")
  revisionNumber      Int      @default(1)
  effectiveDate       DateTime
  reviewDate          DateTime?  // Bir sonraki gözden geçirme tarihi
  
  // İçerik
  description         String?
  content             String?  // HTML/Markdown içerik
  filePath            String?  // PDF/DOCX dosyası
  
  // Onay Süreci
  status              String   @default("DRAFT") // DRAFT, UNDER_REVIEW, APPROVED, OBSOLETE
  preparedBy          String?
  reviewedBy          String?
  approvedBy          String?
  approvalDate        DateTime?
  
  // İlişkiler
  relatedDevices      DocumentDevice[]
  versions            DocumentVersion[]
  distributions       DocumentDistribution[]
  
  createdAt           DateTime @default(now())
  updatedAt           DateTime @updatedAt
}

model DocumentVersion {
  id              String   @id @default(cuid())
  documentId      String
  document        Document @relation(...)
  
  version         String
  revisionNumber  Int
  filePath        String
  changeLog       String?  // Değişiklik günlüğü
  
  createdAt       DateTime @default(now())
  createdBy       String?
}

model DocumentDevice {
  id              String   @id @default(cuid())
  documentId      String
  document        Document @relation(...)
  deviceId        String?
  device          Device?  @relation(...)
  deviceCategoryId String?
  deviceCategory  DeviceCategory? @relation(...)
}

model DocumentDistribution {
  id              String   @id @default(cuid())
  documentId      String
  document        Document @relation(...)
  userId          String?
  department      String?
  
  distributedDate DateTime @default(now())
  acknowledged    Boolean  @default(false)
  acknowledgedDate DateTime?
}
```

---

### 8. Periyodik Test ve Kontrol Modülü (Kalibrasyon'dan Ayrı)

**SKS Standardı:** DMC12, DMC13 - Test ve Kontrol  
**Denetim Sorusu:** "Test, kontrol ve kalibrasyon sonucuna göre kullanıma uygun olmayan cihazlarla ilgili süreçler tanımlanmış mı?"

#### Özellikler:
- Periyodik test planı (kalibrasyondan bağımsız)
- Test prosedürleri ve kriterleri
- Test sonuçları kaydı (pass/fail)
- Uygun olmayan cihazlar için otomatik durum değişikliği (OUT_OF_SERVICE)
- Onarım/ayar sonrası yeniden test
- Test sertifikaları ve raporları

#### Veritabanı Modeli:
```prisma
model PeriodicTest {
  id                  String   @id @default(cuid())
  deviceId            String
  device              Device   @relation(...)
  hospitalId          String
  hospital            Hospital @relation(...)
  
  // Test Bilgileri
  testType            String   // SAFETY_TEST, FUNCTIONAL_TEST, PERFORMANCE_TEST
  testProcedure       String?  // Test prosedür referansı
  scheduledDate       DateTime
  completedDate       DateTime?
  
  // Sonuçlar
  status              String   @default("SCHEDULED") // SCHEDULED, COMPLETED, FAILED
  result              String?  // PASS, FAIL, CONDITIONAL
  testResults         String?  // JSON: detaylı test sonuçları
  
  // Uygunluk Durumu
  deviceSuitable      Boolean? // Kullanıma uygun mu?
  restrictions        String?  // Kısıtlamalar
  
  // Test Eden
  testedBy            String?
  tester              User?    @relation(...)
  testerName          String?
  
  // Dokümantasyon
  certificateFile     String?  // PDF
  notes               String?
  
  // Sonraki Test
  nextTestDate        DateTime?
  testInterval        Int?     // Gün
  
  createdAt           DateTime @default(now())
  updatedAt           DateTime @updatedAt
  
  @@index([deviceId])
  @@index([hospitalId])
  @@index([scheduledDate])
  @@index([deviceSuitable])
}
```

---

### 9. Şikayet Yönetimi

**SKS Standardı:** Genel Hasta/Personel Memnuniyeti  
**Denetim Sorusu:** "Şikayetler kayıt altına alınıyor ve değerlendiriliyor mu?"

#### Özellikler:
- Şikayet kaydı (cihaz, hizmet, tedarikçi bazlı)
- Şikayet kategorizasyonu (kalite, güvenlik, hizmet, fiyat)
- Şikayet değerlendirme süreci
- CAPA bağlantısı (gerekirse)
- Müşteri yanıtı ve kapanış
- Şikayet istatistikleri ve trend analizi

#### Veritabanı Modeli:
```prisma
model Complaint {
  id                  String   @id @default(cuid())
  complaintNumber     String   @unique // COMP-2025-001
  
  // Şikayet Detayları
  complaintType       String   // DEVICE, SERVICE, SUPPLIER, OTHER
  category            String   // QUALITY, SAFETY, DELIVERY, PRICE, OTHER
  title               String
  description         String
  
  // İlgili Kayıtlar
  deviceId            String?
  device              Device?  @relation(...)
  supplierId          String?
  supplier            Supplier? @relation(...)
  relatedWorkOrderId  String?
  
  // Şikayetçi
  complainantName     String
  complainantEmail    String?
  complainantPhone    String?
  complainantType     String   // INTERNAL, PATIENT, EXTERNAL
  
  // Süreç
  status              String   @default("RECEIVED") // RECEIVED, INVESTIGATING, RESOLVED, CLOSED, REJECTED
  priority            String   @default("MEDIUM") // LOW, MEDIUM, HIGH, URGENT
  
  // Atama
  assignedTo          String?
  assignedUser        User?    @relation(...)
  
  // Değerlendirme
  receivedDate        DateTime @default(now())
  investigationNotes  String?
  resolution          String?
  resolvedDate        DateTime?
  
  // CAPA Bağlantısı
  capaId              String?
  capa                CAPA?    @relation(...)
  
  // Müşteri Yanıtı
  customerNotified    Boolean  @default(false)
  customerResponse    String?
  
  createdAt           DateTime @default(now())
  updatedAt           DateTime @updatedAt
  
  @@index([status])
  @@index([complaintType])
  @@index([receivedDate])
}
```

---

### 10. Cihaz Güvenlik ve Risk Analizi

**SKS Standardı:** DMC11 - Güvenli Kullanım  
**Denetim Sorusu:** "Cihazların güvenli ve verimli kullanımına yönelik düzenlemeler yapılmış mı?"

#### Özellikler:
- Risk analizi kayıtları (başlangıç riski, kalan risk)
- Risk seviyesi (düşük, orta, yüksek, kritik)
- Güvenlik uyarıları ve kısıtlamalar
- Kullanım talimatları ve önlemler
- Kaza/olay sonrası risk değerlendirme güncellemesi
- Risk azaltma önlemleri

#### Veritabanı Modeli:
```prisma
model DeviceRiskAnalysis {
  id                  String   @id @default(cuid())
  deviceId            String
  device              Device   @relation(...)
  
  // Risk Analizi
  analysisDate        DateTime @default(now())
  analyzedBy          String?
  analyzer            User?    @relation(...)
  
  // Risk Değerlendirme
  initialRiskLevel    String   // LOW, MEDIUM, HIGH, CRITICAL
  residualRiskLevel   String?  // Önlemler sonrası
  
  // Risk Faktörleri (JSON)
  riskFactors         String?  // {electrical: true, radiation: false, ...}
  identifiedHazards   String?  // Tespit edilen tehlikeler
  
  // Önlemler
  safetyMeasures      String?  // Alınan güvenlik önlemleri
  usageRestrictions   String?  // Kullanım kısıtlamaları
  requiredTraining    Boolean? // Özel eğitim gerekli mi?
  
  // Dokümantasyon
  riskAssessmentFile  String?  // PDF
  safetyInstructions  String?  // Güvenlik talimatları
  
  // İnceleme
  reviewDate          DateTime? // Bir sonraki gözden geçirme
  reviewFrequency     Int?      // Aylık
  
  createdAt           DateTime @default(now())
  updatedAt           DateTime @updatedAt
  
  @@index([deviceId])
  @@index([initialRiskLevel])
}
```

---

### 11. Enerji ve Çevre Yönetimi

**SKS Standardı:** Genel Çevre Yönetimi  
**Not:** Elektrikli cihazlar için enerji tüketimi ve çevresel etki takibi

#### Özellikler:
- Enerji tüketimi kayıtları (kWh)
- Çevre sertifikaları (RoHS, WEEE)
- Atık yönetimi (cihaz hurdası, kimyasal atık)
- Çevresel uyumluluk takibi

#### Veritabanı Modeli:
```prisma
// Device modeline ek alanlar
// energyConsumption: Float? // kWh/yıl
// environmentalCertifications: String? // JSON
// wasteDisposalMethod: String?

model EnergyConsumption {
  id              String   @id @default(cuid())
  deviceId        String
  device          Device   @relation(...)
  
  measurementDate DateTime
  consumptionKwh  Float
  period          String   // MONTHLY, YEARLY
  
  createdAt       DateTime @default(now())
}

model WasteManagement {
  id              String   @id @default(cuid())
  deviceId        String?
  device          Device?  @relation(...)
  
  wasteType       String   // DEVICE_WASTE, CHEMICAL, ELECTRONIC
  quantity        Float
  unit            String   // kg, unit
  disposalMethod  String   // RECYCLE, HAZARDOUS_WASTE, LANDFILL
  disposalDate    DateTime
  disposalCompany String?
  certificateFile String?  // PDF
  
  createdAt       DateTime @default(now())
}
```

---

## 📊 Öncelik Sıralaması

### Yüksek Öncelik (SKS Denetimi İçin Kritik)
1. ✅ **Personel Eğitim ve Yetkilendirme** (DMC08)
2. ✅ **Cihaz Teslim Alma ve Hizmete Sunma** (DMC09)
3. ✅ **Cihaz Kullanım Dışı Bırakma** (DMC15)
4. ✅ **Hasta Başı Test Cihazları (HBTC)** (DMC16)
5. ✅ **Periyodik Test ve Kontrol** (DMC12, DMC13)

### Orta Öncelik (Kalite Yönetimi İçin Önemli)
6. ✅ **İç Denetim Modülü**
7. ✅ **Tedarikçi Değerlendirme** (mevcut temel var, genişletilebilir)
8. ✅ **Şikayet Yönetimi**
9. ✅ **Cihaz Güvenlik ve Risk Analizi** (DMC11)

### Düşük Öncelik (Destekleyici Özellikler)
10. ✅ **Dokümantasyon Yönetimi**
11. ✅ **Enerji ve Çevre Yönetimi**

---

## 🔄 Mevcut Özelliklerin Genişletilmesi

### Mevcut Özelliklerde İyileştirme Önerileri:

1. **Bakım Yönetimi:**
   - ✅ Mevcut: Planlı bakım, arıza onarım
   - ➕ Eklenebilir: Bakım prosedürleri (SOP), bakım kontrol listeleri, parça envanteri

2. **Kalibrasyon:**
   - ✅ Mevcut: Temel kalibrasyon kayıtları
   - ➕ Eklenebilir: Kalibrasyon prosedürleri, belirsizlik hesaplaması, izlenebilirlik zinciri

3. **CAPA:**
   - ✅ Mevcut: Temel CAPA kayıtları
   - ➕ Eklenebilir: Etkinlik değerlendirme takibi, CAPA raporları, trend analizi

---

## 💻 Teknik Uygulama Notları

### API Endpoint'leri Örnekleri:

```
# Personel Eğitim
GET    /api/training
POST   /api/training
GET    /api/training/[id]
PUT    /api/training/[id]
GET    /api/training/user/[userId]
GET    /api/training/device/[deviceId]

# Teslim Alma
GET    /api/procurement
POST   /api/procurement
GET    /api/procurement/[id]
PUT    /api/procurement/[id]
POST   /api/procurement/[id]/accept
POST   /api/procurement/[id]/commission

# Kullanım Dışı Bırakma
GET    /api/decommissioning
POST   /api/decommissioning
PUT    /api/decommissioning/[id]
POST   /api/decommissioning/[id]/approve
POST   /api/decommissioning/[id]/complete

# HBTC
GET    /api/hbtc/devices
GET    /api/hbtc/[deviceId]/usage
POST   /api/hbtc/[deviceId]/qc
GET    /api/hbtc/[deviceId]/qc-history

# İç Denetim
GET    /api/audits
POST   /api/audits
GET    /api/audits/[id]
POST   /api/audits/[id]/findings
PUT    /api/audits/findings/[id]
```

### Dashboard Widget'ları:

- Eğitim Gecikmeleri
- Bekleyen Teslim Almalar
- HBTC QC Test Sonuçları
- Açık Denetim Bulguları
- Kullanım Dışı Bırakma Talepleri
- Tedarikçi Performans Metrikleri

---

## 📝 Sonuç

Bu özelliklerin eklenmesi ile yazılım, SKS denetlemelerinde sorulan tüm sorulara cevap verebilecek seviyeye gelecektir. Her modül, ilgili SKS standardına uygun şekilde tasarlanmıştır ve denetimcilerin beklediği kayıtları sağlayacaktır.

**Önerilen Uygulama Sırası:**
1. Personel Eğitim ve Yetkilendirme (kritik)
2. Cihaz Teslim Alma (kritik)
3. Periyodik Test ve Kontrol (kritik)
4. HBTC Yönetimi (kritik)
5. Kullanım Dışı Bırakma (kritik)
6. Diğer modüller (kalite yönetimi)

Her modül için ayrıntılı teknik dokümantasyon ve API spesifikasyonları ayrıca hazırlanabilir.