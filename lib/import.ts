import * as XLSX from 'xlsx'

export interface CalibrationImportData {
    deviceSerialNumber: string
    tagNumber?: string
    deviceName?: string
    brand?: string
    model?: string
    location?: string
    calibrationLab?: string
    scheduledDate: string
    completedDate?: string
    expiryDate?: string
    technicianName?: string
    status: string
    result?: string
    certificateNumber?: string
    cost?: number
}

export interface CalibrationImportError {
    row: number
    field: string
    message: string
}

export interface CalibrationImportResult {
    data: CalibrationImportData[]
    errors: CalibrationImportError[]
}

/**
 * Helper to get value from row with case-insensitive key lookup
 */
function getColumnValue(row: any, key: string): string | undefined {
    if (!row || typeof row !== 'object') return undefined

    // Direct match
    if (row[key] !== undefined) return row[key]?.toString().trim()

    // Case-insensitive match
    const lowerKey = key.toLowerCase()
    const foundKey = Object.keys(row).find(k => k.toLowerCase().trim() === lowerKey)

    if (foundKey && row[foundKey] !== undefined) {
        return row[foundKey]?.toString().trim()
    }

    return undefined
}

/**
 * Parse Excel file for calibration data import
 */
export async function parseCalibrationExcel(file: File): Promise<CalibrationImportResult> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader()

        reader.onload = (e) => {
            try {
                const data = e.target?.result
                const workbook = XLSX.read(data, { type: 'binary' })
                const sheetName = workbook.SheetNames[0]
                const worksheet = workbook.Sheets[sheetName]

                // First, convert to array of arrays to find the header row
                const rawData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][]

                // Find the header row index by looking for known columns
                let headerRowIndex = 0
                // Updated known columns to match export format
                const knownColumns = ['Seri No', 'Künye No', 'Cihaz Adı', 'Planlanan Tarih', 'Tamamlanma Tarihi', 'Kalibrasyon Laboratuvarı', 'Lokasyon']

                for (let i = 0; i < Math.min(rawData.length, 10); i++) {
                    const row = rawData[i]
                    const matchCount = row.filter(cell =>
                        typeof cell === 'string' &&
                        knownColumns.some(col => cell.toLowerCase().includes(col.toLowerCase()))
                    ).length

                    if (matchCount >= 2) { // If at least 2 known columns are found
                        headerRowIndex = i
                        break
                    }
                }

                // Now convert to JSON using the found header row
                const jsonData = XLSX.utils.sheet_to_json(worksheet, {
                    range: headerRowIndex,
                    raw: false
                })

                const calibrations: CalibrationImportData[] = []
                const errors: CalibrationImportError[] = []

                jsonData.forEach((row: any, index: number) => {
                    const rowNumber = index + headerRowIndex + 2 // +2 for 1-based index and header row

                    // Skip empty rows
                    if (Object.keys(row).length === 0) return

                    try {
                        // Required fields
                        const serialNumber = getColumnValue(row, 'Seri No')
                        const tagNumber = getColumnValue(row, 'Künye No')

                        // Date fields
                        // Support both old 'Kalibrasyon Tarihi' and new 'Planlanan Tarih' / 'Tamamlanma Tarihi'
                        const scheduledDateStr = getColumnValue(row, 'Planlanan Tarih') || getColumnValue(row, 'Kalibrasyon Tarihi')
                        const completedDateStr = getColumnValue(row, 'Tamamlanma Tarihi') || getColumnValue(row, 'Kalibrasyon Tarihi')
                        const expiryDateStr = getColumnValue(row, 'Geçerlilik Tarihi') || getColumnValue(row, 'Gelecek Kalibrasyon Tarihi')

                        // Validate required fields (at least one identifier)
                        if (!serialNumber && !tagNumber) {
                            // Only report error if row is not completely empty
                            const hasData = Object.values(row).some(val => val && val.toString().trim() !== '')
                            if (hasData) {
                                errors.push({
                                    row: rowNumber,
                                    field: 'Seri/Künye No',
                                    message: 'Seri numarası veya Künye numarası zorunludur'
                                })
                            }
                            return
                        }

                        // Validate dates - need at least one date to make sense of a record
                        if (!scheduledDateStr && !completedDateStr) {
                            errors.push({
                                row: rowNumber,
                                field: 'Tarih',
                                message: 'Planlanan Tarih veya Tamamlanma Tarihi zorunludur'
                            })
                            return
                        }

                        // Parse dates
                        const parsedScheduledDate = parseDate(scheduledDateStr || '')
                        const parsedCompletedDate = parseDate(completedDateStr || '')
                        const parsedExpiryDate = parseDate(expiryDateStr || '')

                        if ((scheduledDateStr && !parsedScheduledDate) || (completedDateStr && !parsedCompletedDate)) {
                            errors.push({
                                row: rowNumber,
                                field: 'Tarih Formatı',
                                message: 'Geçersiz tarih formatı'
                            })
                            return
                        }

                        // Parse Status
                        const statusLabel = getColumnValue(row, 'Durum')
                        let status = 'SCHEDULED' // Default
                        if (statusLabel) {
                            status = parseStatusLabel(statusLabel)
                        } else if (parsedCompletedDate) {
                            status = 'COMPLETED'
                        }

                        // Parse Result
                        const resultLabel = getColumnValue(row, 'Sonuç')
                        let result = undefined
                        if (resultLabel) {
                            result = parseResultLabel(resultLabel)
                        } else if (status === 'COMPLETED') {
                            result = 'PASSED' // Default for completed if not specified
                        }

                        calibrations.push({
                            deviceSerialNumber: serialNumber || '',
                            tagNumber: tagNumber,
                            deviceName: getColumnValue(row, 'Cihaz Adı'),
                            brand: getColumnValue(row, 'Marka'),
                            model: getColumnValue(row, 'Model'),
                            location: getColumnValue(row, 'Lokasyon'),
                            calibrationLab: getColumnValue(row, 'Kalibrasyon Laboratuvarı') || '',
                            scheduledDate: parsedScheduledDate || parsedCompletedDate || new Date().toISOString().split('T')[0],
                            completedDate: parsedCompletedDate,
                            expiryDate: parsedExpiryDate,
                            technicianName: getColumnValue(row, 'Teknisyen'),
                            status: status,
                            result: result,
                            certificateNumber: getColumnValue(row, 'Sertifika No'),
                            cost: 0,
                        })
                    } catch (error) {
                        errors.push({
                            row: rowNumber,
                            field: 'Genel',
                            message: `Satır işlenirken hata: ${error instanceof Error ? error.message : 'Bilinmeyen hata'}`
                        })
                    }
                })

                resolve({ data: calibrations, errors })
            } catch (error) {
                reject(new Error(`Excel dosyası okunamadı: ${error instanceof Error ? error.message : 'Bilinmeyen hata'}`))
            }
        }

        reader.onerror = () => {
            reject(new Error('Dosya okunamadı'))
        }

        reader.readAsBinaryString(file)
    })
}

/**
 * Parse date from Turkish or ISO format
 */
function parseDate(dateStr: string): string | undefined {
    if (!dateStr) return undefined

    // Try ISO format first (YYYY-MM-DD)
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
        return dateStr
    }

    // Try Turkish format (DD.MM.YYYY or DD/MM/YYYY)
    const turkishMatch = dateStr.match(/^(\d{1,2})[./](\d{1,2})[./](\d{4})$/)
    if (turkishMatch) {
        const [, day, month, year] = turkishMatch
        return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
    }

    // Try parsing as a date and convert to ISO
    try {
        const date = new Date(dateStr)
        if (!isNaN(date.getTime())) {
            return date.toISOString().split('T')[0]
        }
    } catch {
        // Ignore parsing errors
    }

    return undefined
}

function parseStatusLabel(label: string): string {
    const map: Record<string, string> = {
        'Aktif': 'ACTIVE',
        'Pasif': 'INACTIVE',
        'Bakımda': 'MAINTENANCE',
        'Kalibrasyonda': 'CALIBRATION',
        'Onarımda': 'REPAIR',
        'Hizmet Dışı': 'RETIRED',
        'Planlandı': 'SCHEDULED',
        'Devam Ediyor': 'IN_PROGRESS',
        'Tamamlandı': 'COMPLETED',
        'Başarısız': 'FAILED',
        'İptal Edildi': 'CANCELLED'
    }
    // Case insensitive lookup
    const found = Object.keys(map).find(k => k.toLowerCase() === label.toLowerCase())
    return found ? map[found] : 'SCHEDULED'
}

function parseResultLabel(label: string): string | undefined {
    const map: Record<string, string> = {
        'KULLANIMA UYGUNDUR': 'PASSED',
        'SINIRLI KULLANIMA UYGUNDUR': 'PASSED_WITH_ADJUSTMENT',
        'KULLANIMA UYGUN DEĞİLDİR': 'FAILED'
    }
    // Case insensitive lookup
    const found = Object.keys(map).find(k => k.toLowerCase() === label.toLowerCase())
    return found ? map[found] : undefined
}
