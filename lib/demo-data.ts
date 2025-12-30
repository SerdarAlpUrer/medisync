export const demoDevices = [
    {
        id: '1',
        name: 'MRI Cihazı',
        brand: 'Siemens',
        model: 'Magnetom Vida',
        serialNumber: 'SN-2023-001',
        categoryId: 'cat-1',
        category: { name: 'Görüntüleme' },
        locationId: 'loc-1',
        location: { name: 'Radyoloji' },
        status: 'ACTIVE',
        lastMaintenanceDate: '2023-10-15T00:00:00.000Z',
        createdAt: '2023-01-01T00:00:00.000Z'
    },
    {
        id: '2',
        name: 'Ultrason',
        brand: 'GE HealthCare',
        model: 'Voluson E10',
        serialNumber: 'SN-2023-002',
        categoryId: 'cat-1',
        category: { name: 'Görüntüleme' },
        locationId: 'loc-2',
        location: { name: 'Kadın Doğum' },
        status: 'MAINTENANCE',
        lastMaintenanceDate: '2023-09-20T00:00:00.000Z',
        createdAt: '2023-02-15T00:00:00.000Z'
    },
    {
        id: '3',
        name: 'Defibrilatör',
        brand: 'Stryker',
        model: 'Lifepak 20e',
        serialNumber: 'SN-2023-003',
        categoryId: 'cat-2',
        category: { name: 'Acil Tıp' },
        locationId: 'loc-3',
        location: { name: 'Acil Servis' },
        status: 'ACTIVE',
        lastMaintenanceDate: '2023-11-01T00:00:00.000Z',
        createdAt: '2023-03-10T00:00:00.000Z'
    },
    {
        id: '4',
        name: 'Ventilatör',
        brand: 'Getinge',
        model: 'Servo-U',
        serialNumber: 'SN-2023-004',
        categoryId: 'cat-3',
        category: { name: 'Yoğun Bakım' },
        locationId: 'loc-4',
        location: { name: 'Yoğun Bakım' },
        status: 'CALIBRATION',
        lastMaintenanceDate: '2023-08-05T00:00:00.000Z',
        createdAt: '2023-04-20T00:00:00.000Z'
    },
    {
        id: '5',
        name: 'Hasta Başı Monitörü',
        brand: 'Philips',
        model: 'IntelliVue MX800',
        serialNumber: 'SN-2023-005',
        categoryId: 'cat-3',
        category: { name: 'Yoğun Bakım' },
        locationId: 'loc-4',
        location: { name: 'Yoğun Bakım' },
        status: 'ACTIVE',
        lastMaintenanceDate: '2023-10-25T00:00:00.000Z',
        createdAt: '2023-05-12T00:00:00.000Z'
    }
]

export const demoUsers = [
    {
        id: '1',
        name: 'Demo Yönetici',
        email: 'admin@demo.com',
        role: 'ADMIN',
        department: 'Biyomedikal',
        phone: '+90 555 111 2233',
        hospital: 'Demo Hastanesi',
        isActive: true
    },
    {
        id: '2',
        name: 'Demo Teknisyen',
        email: 'tech@demo.com',
        role: 'TECHNICIAN',
        department: 'Teknik Servis',
        phone: '+90 555 444 5566',
        hospital: 'Demo Hastanesi',
        isActive: true
    }
]

export const demoHospitals = [
    {
        id: '1',
        name: 'Merkez Demo Hastanesi',
        code: 'DEMO-001',
        city: 'İstanbul',
        phone: '+90 212 555 0000',
        email: 'info@demohospital.com',
        deviceCount: 150,
        activeContract: true
    },
    {
        id: '2',
        name: 'Anadolu Demo Şubesi',
        code: 'DEMO-002',
        city: 'Ankara',
        phone: '+90 312 555 0000',
        email: 'ankara@demohospital.com',
        deviceCount: 85,
        activeContract: true
    }
]

export const demoMaintenances = [
    {
        id: '1',
        deviceId: '1',
        device: { name: 'MRI Cihazı', serialNumber: 'SN-2023-001' },
        type: 'PREVENTIVE',
        status: 'COMPLETED',
        priority: 'HIGH',
        scheduledDate: '2023-11-15T09:00:00.000Z',
        technician: { name: 'Ahmet Yılmaz' },
        description: 'Yıllık periyodik bakım'
    },
    {
        id: '2',
        deviceId: '2',
        device: { name: 'Ultrason', serialNumber: 'SN-2023-002' },
        type: 'CORRECTIVE',
        status: 'IN_PROGRESS',
        priority: 'CRITICAL',
        scheduledDate: '2023-11-20T10:30:00.000Z',
        technician: { name: 'Mehmet Demir' },
        description: 'Prob arızası giderilmesi'
    }
]

export const demoCalibrations = [
    {
        id: '1',
        deviceId: '3',
        device: { name: 'Defibrilatör', serialNumber: 'SN-2023-003' },
        status: 'PASSED',
        scheduledDate: '2023-11-10T14:00:00.000Z',
        technician: { name: 'Ali Veli' },
        certificateNumber: 'CERT-2026-001',
        nextCalibrationDate: '2026-11-10T14:00:00.000Z'
    },
    {
        id: '2',
        deviceId: '4',
        device: { name: 'Ventilatör', serialNumber: 'SN-2023-004' },
        status: 'SCHEDULED',
        scheduledDate: '2023-11-25T09:00:00.000Z',
        technician: { name: 'Ayşe Fatma' },
        certificateNumber: null,
        nextCalibrationDate: null
    }
]

export const demoReportStats = {
    totalDevices: 125,
    activeDevices: 98,
    maintenanceThisMonth: 12,
    calibrationThisMonth: 8,
    totalCost: 45000
}

export const demoCategories = [
    { id: 'cat-1', name: 'Görüntüleme' },
    { id: 'cat-2', name: 'Acil Tıp' },
    { id: 'cat-3', name: 'Yoğun Bakım' },
    { id: 'cat-4', name: 'Laboratuvar' },
    { id: 'cat-5', name: 'Ameliyathane' }
]

export const demoLocations = [
    { id: 'loc-1', name: 'Acil Servis' },
    { id: 'loc-2', name: 'Ameliyathane' },
    { id: 'loc-3', name: 'Anesteziyoloji ve Reanimasyon' },
    { id: 'loc-4', name: 'Beslenme ve Diyet' },
    { id: 'loc-5', name: 'Beyin ve Sinir Cerrahisi' },
    { id: 'loc-6', name: 'Biyokimya' },
    { id: 'loc-7', name: 'Çocuk Cerrahisi' },
    { id: 'loc-8', name: 'Çocuk Sağlığı ve Hastalıkları' },
    { id: 'loc-9', name: 'Dahiliye (İç Hastalıkları)' },
    { id: 'loc-10', name: 'Dermatoloji (Cildiye)' },
    { id: 'loc-11', name: 'Diş Polikliniği' },
    { id: 'loc-12', name: 'Eczane' },
    { id: 'loc-13', name: 'Endokrinoloji' },
    { id: 'loc-14', name: 'Enfeksiyon Hastalıkları' },
    { id: 'loc-15', name: 'Fizik Tedavi ve Rehabilitasyon' },
    { id: 'loc-16', name: 'Gastroenteroloji' },
    { id: 'loc-17', name: 'Genel Cerrahi' },
    { id: 'loc-18', name: 'Göğüs Cerrahisi' },
    { id: 'loc-19', name: 'Göğüs Hastalıkları' },
    { id: 'loc-20', name: 'Göz Hastalıkları' },
    { id: 'loc-21', name: 'Hematoloji' },
    { id: 'loc-22', name: 'Kadın Hastalıkları ve Doğum' },
    { id: 'loc-23', name: 'Kalp ve Damar Cerrahisi' },
    { id: 'loc-24', name: 'Kan Merkezi' },
    { id: 'loc-25', name: 'Kardiyoloji' },
    { id: 'loc-26', name: 'Kulak Burun Boğaz' },
    { id: 'loc-27', name: 'Laboratuvar' },
    { id: 'loc-28', name: 'Morg' },
    { id: 'loc-29', name: 'Nefroloji' },
    { id: 'loc-30', name: 'Nöroloji' },
    { id: 'loc-31', name: 'Nükleer Tıp' },
    { id: 'loc-32', name: 'Onkoloji' },
    { id: 'loc-33', name: 'Ortopedi ve Travmatoloji' },
    { id: 'loc-34', name: 'Patoloji' },
    { id: 'loc-35', name: 'Plastik, Rekonstrüktif ve Estetik Cerrahi' },
    { id: 'loc-36', name: 'Psikiyatri' },
    { id: 'loc-37', name: 'Radyoloji' },
    { id: 'loc-38', name: 'Romatoloji' },
    { id: 'loc-39', name: 'Sterilizasyon (MSÜ)' },
    { id: 'loc-40', name: 'Teknik Servis' },
    { id: 'loc-41', name: 'Üroloji' },
    { id: 'loc-42', name: 'Yemekhane' },
    { id: 'loc-43', name: 'Yoğun Bakım' },
    { id: 'loc-44', name: 'Çamaşırhane' }
]
