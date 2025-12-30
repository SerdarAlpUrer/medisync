import * as XLSX from 'xlsx'

export interface ExportColumn {
    key: string
    header: string
}

export interface ExportOptions {
    filename?: string
    sheetName?: string
}

/**
 * Export data to Excel file
 */
export function exportToExcel<T>(
    data: T[],
    columns: ExportColumn[],
    options: ExportOptions = {}
) {
    const { filename = 'export.xlsx', sheetName = 'Sheet1' } = options

    // Prepare data for export
    const exportData = data.map(item => {
        const row: any = {}
        columns.forEach(col => {
            row[col.header] = (item as any)[col.key] || ''
        })
        return row
    })

    // Create worksheet
    const worksheet = XLSX.utils.json_to_sheet(exportData)

    // Auto-size columns
    const columnWidths = columns.map(col => ({
        wch: Math.max(col.header.length + 2, 15)
    }))
    worksheet['!cols'] = columnWidths

    // Create workbook
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName)

    // Generate and download file
    XLSX.writeFile(workbook, filename)
}

/**
 * Export devices to Excel
 */
export function exportDevicesToExcel(devices: any[]) {
    const columns: ExportColumn[] = [
        { key: 'name', header: 'Cihaz Adı' },
        { key: 'brand', header: 'Marka' },
        { key: 'model', header: 'Model' },
        { key: 'serialNumber', header: 'Seri No' },
        { key: 'tagNumber', header: 'Künye No' },
        { key: 'barcode', header: 'Barkod' },
        { key: 'rfidTag', header: 'RFID' },
        { key: 'manufacturer', header: 'Üretici' },
        { key: 'category', header: 'Kategori' },
        { key: 'location', header: 'Lokasyon' },
        { key: 'supplier', header: 'Tedarikçi' },
        { key: 'status', header: 'Durum' },
        { key: 'condition', header: 'Koşul' },
        { key: 'purchaseDate', header: 'Alım Tarihi' },
        { key: 'purchasePrice', header: 'Satın Alma Fiyatı' },
        { key: 'warrantyExpiry', header: 'Garanti Bitiş' },
        { key: 'lastMaintenance', header: 'Son Bakım' },
        { key: 'nextMaintenanceDate', header: 'Sonraki Bakım' },
        { key: 'maintenanceInterval', header: 'Bakım Aralığı (Gün)' },
        { key: 'description', header: 'Açıklama' },
    ]

    const formattedData = devices.map(device => ({
        name: device.name,
        brand: device.brand || '-',
        model: device.model || '-',
        serialNumber: device.serialNumber,
        tagNumber: device.tagNumber || '-',
        barcode: device.barcode || '-',
        rfidTag: device.rfidTag || '-',
        manufacturer: device.manufacturer || '-',
        category: device.category?.name || device.category || '-',
        location: device.location?.name || device.location || '-',
        supplier: device.supplier?.name || device.supplier || '-',
        status: getStatusLabel(device.status),
        condition: getConditionLabel(device.condition),
        purchaseDate: formatDate(device.purchaseDate),
        purchasePrice: device.purchasePrice || '-',
        warrantyExpiry: formatDate(device.warrantyExpiry),
        lastMaintenance: formatDate(device.lastMaintenanceDate || device.lastMaintenance),
        nextMaintenanceDate: formatDate(device.nextMaintenanceDate),
        maintenanceInterval: device.maintenanceInterval || '-',
        description: device.description || '-'
    }))

    exportToExcel(formattedData, columns, {
        filename: `Cihaz_Envanteri_${new Date().toISOString().split('T')[0]}.xlsx`,
        sheetName: 'Cihazlar',
    })
}

/**
 * Export maintenance records to Excel
 */
export function exportMaintenanceToExcel(maintenances: any[]) {
    const columns: ExportColumn[] = [
        { key: 'device', header: 'Cihaz' },
        { key: 'type', header: 'Bakım Tipi' },
        { key: 'status', header: 'Durum' },
        { key: 'priority', header: 'Öncelik' },
        { key: 'scheduledDate', header: 'Planlanan Tarih' },
        { key: 'completedDate', header: 'Tamamlanma Tarihi' },
        { key: 'technician', header: 'Teknisyen' },
        { key: 'cost', header: 'Maliyet (₺)' },
        { key: 'description', header: 'Açıklama' },
    ]

    const formattedData = maintenances.map(maintenance => ({
        ...maintenance,
        device: maintenance.device?.name || maintenance.device || '',
        type: getMaintenanceTypeLabel(maintenance.type),
        status: getMaintenanceStatusLabel(maintenance.status),
        priority: getPriorityLabel(maintenance.priority),
        technician: maintenance.technician?.name || maintenance.technician || '',
        cost: maintenance.cost ? `₺${maintenance.cost.toLocaleString('tr-TR')}` : '',
    }))

    exportToExcel(formattedData, columns, {
        filename: `Bakim_Kayitlari_${new Date().toISOString().split('T')[0]}.xlsx`,
        sheetName: 'Bakım Kayıtları',
    })
}

/**
 * Export calibration records to Excel
 */
export function exportCalibrationsToExcel(calibrations: any[]) {
    const columns: ExportColumn[] = [
        { key: 'deviceName', header: 'Cihaz Adı' },
        { key: 'brand', header: 'Marka' },
        { key: 'model', header: 'Model' },
        { key: 'serialNumber', header: 'Seri No' },
        { key: 'tagNumber', header: 'Künye No' },
        { key: 'location', header: 'Lokasyon' },
        { key: 'calibrationLab', header: 'Kalibrasyon Laboratuvarı' },
        { key: 'scheduledDate', header: 'Planlanan Tarih' },
        { key: 'completedDate', header: 'Tamamlanma Tarihi' },
        { key: 'expiryDate', header: 'Geçerlilik Tarihi' },
        { key: 'technician', header: 'Teknisyen' },
        { key: 'status', header: 'Durum' },
        { key: 'result', header: 'Sonuç' },
        { key: 'certificateNumber', header: 'Sertifika No' },
    ]

    const formattedData = calibrations.map(calibration => ({
        deviceName: calibration.device?.name || '',
        brand: calibration.device?.brand || '',
        model: calibration.device?.model || '',
        serialNumber: calibration.device?.serialNumber || '',
        tagNumber: calibration.device?.tagNumber || '',
        location: calibration.device?.location?.name || '',
        calibrationLab: calibration.calibrationLab || '',
        scheduledDate: formatDate(calibration.scheduledDate),
        completedDate: formatDate(calibration.completedDate),
        expiryDate: formatDate(calibration.expiryDate),
        technician: calibration.technician?.name || '',
        status: getCalibrationStatusLabel(calibration.status),
        result: getCalibrationResultLabel(calibration.result),
        certificateNumber: calibration.certificateNumber || '',
    }))

    exportToExcel(formattedData, columns, {
        filename: `Kalibrasyon_Kayitlari_${new Date().toISOString().split('T')[0]}.xlsx`,
        sheetName: 'Kalibrasyon Kayıtları',
    })
}

// Helper functions
function formatDate(date: any): string {
    if (!date) return ''
    const d = new Date(date)
    return d.toLocaleDateString('tr-TR')
}

function getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
        ACTIVE: 'Aktif',
        INACTIVE: 'Pasif',
        MAINTENANCE: 'Bakımda',
        CALIBRATION: 'Kalibrasyonda',
        REPAIR: 'Onarımda',
        RETIRED: 'Hizmet Dışı',
    }
    return labels[status] || status
}

function getConditionLabel(condition: string): string {
    const labels: Record<string, string> = {
        EXCELLENT: 'Mükemmel',
        GOOD: 'İyi',
        FAIR: 'Orta',
        POOR: 'Kötü',
        BROKEN: 'Arızalı',
    }
    return labels[condition] || condition
}

function getMaintenanceTypeLabel(type: string): string {
    const labels: Record<string, string> = {
        PREVENTIVE: 'Önleyici Bakım',
        CORRECTIVE: 'Arıza Onarımı',
        PREDICTIVE: 'Öngörücü Bakım',
        INSPECTION: 'Muayene',
        EMERGENCY: 'Acil Müdahale',
    }
    return labels[type] || type
}

function getMaintenanceStatusLabel(status: string): string {
    const labels: Record<string, string> = {
        SCHEDULED: 'Planlandı',
        IN_PROGRESS: 'Devam Ediyor',
        COMPLETED: 'Tamamlandı',
        CANCELLED: 'İptal Edildi',
    }
    return labels[status] || status
}

function getPriorityLabel(priority: string): string {
    const labels: Record<string, string> = {
        LOW: 'Düşük',
        MEDIUM: 'Orta',
        HIGH: 'Yüksek',
        CRITICAL: 'Kritik',
    }
    return labels[priority] || priority
}

function getCalibrationStatusLabel(status: string): string {
    const labels: Record<string, string> = {
        SCHEDULED: 'Planlandı',
        IN_PROGRESS: 'Devam Ediyor',
        COMPLETED: 'Tamamlandı',
        FAILED: 'Başarısız',
    }
    return labels[status] || status
}

function getCalibrationResultLabel(result: string): string {
    if (!result) return ''
    const labels: Record<string, string> = {
        PASSED: 'KULLANIMA UYGUNDUR',
        PASSED_WITH_ADJUSTMENT: 'SINIRLI KULLANIMA UYGUNDUR',
        FAILED: 'KULLANIMA UYGUN DEĞİLDİR',
    }
    return labels[result] || result
}
