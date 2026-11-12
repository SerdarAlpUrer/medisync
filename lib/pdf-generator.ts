import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { format } from 'date-fns'
import { tr } from 'date-fns/locale'

// Define types for jsPDF with autoTable
interface jsPDFWithAutoTable extends jsPDF {
  lastAutoTable: { finalY: number }
}

export const generateDeviceReport = (devices: any[], title: string = 'Cihaz Envanter Raporu') => {
  const doc = new jsPDF() as jsPDFWithAutoTable

  // Header
  addHeader(doc, title)

  // Table Data
  const tableData = devices.map(d => [
    d.name,
    d.brand || '-',
    d.model || '-',
    d.serialNumber || '-',
    d.status === 'ACTIVE' ? 'Aktif' : d.status,
    d.location?.name || '-'
  ])

  autoTable(doc, {
    head: [['Cihaz Adı', 'Marka', 'Model', 'Seri No', 'Durum', 'Konum']],
    body: tableData,
    startY: 40,
    styles: { font: 'helvetica', fontSize: 9 },
    headStyles: { fillColor: [59, 130, 246] }, // Blue-500
    alternateRowStyles: { fillColor: [243, 244, 246] } // Gray-100
  })

  // Footer
  addFooter(doc)

  doc.save(`cihaz-raporu-${format(new Date(), 'yyyy-MM-dd')}.pdf`)
}

export const generateMaintenanceReport = (maintenances: any[], title: string = 'Bakım Raporu') => {
  const doc = new jsPDF() as jsPDFWithAutoTable

  addHeader(doc, title)

  const tableData = maintenances.map(m => [
    m.device?.name || 'Bilinmeyen Cihaz',
    m.type,
    m.status,
    format(new Date(m.scheduledDate), 'dd.MM.yyyy'),
    m.technician?.name || '-',
    m.cost ? `₺${m.cost}` : '-'
  ])

  autoTable(doc, {
    head: [['Cihaz', 'Bakım Tipi', 'Durum', 'Tarih', 'Teknisyen', 'Maliyet']],
    body: tableData,
    startY: 40,
    styles: { font: 'helvetica', fontSize: 9 },
    headStyles: { fillColor: [16, 185, 129] }, // Green-500
    alternateRowStyles: { fillColor: [240, 253, 244] } // Green-50
  })

  addFooter(doc)

  doc.save(`bakim-raporu-${format(new Date(), 'yyyy-MM-dd')}.pdf`)
}

export const generateCalibrationReport = (calibrations: any[], title: string = 'Kalibrasyon Raporu') => {
  const doc = new jsPDF() as jsPDFWithAutoTable

  addHeader(doc, title)

  const tableData = calibrations.map(c => [
    c.device?.name || 'Bilinmeyen Cihaz',
    c.certificateNumber || '-',
    c.calibrationLab || '-',
    c.scheduledDate ? format(new Date(c.scheduledDate), 'dd.MM.yyyy') : '-',
    c.expiryDate ? format(new Date(c.expiryDate), 'dd.MM.yyyy') : '-',
    c.status === 'COMPLETED' ? 'Tamamlandi' : c.status === 'SCHEDULED' ? 'Planlandi' : (c.status || '-')
  ])

  autoTable(doc, {
    head: [['Cihaz', 'Sertifika No', 'Laboratuvar', 'Kalibrasyon Tarihi', 'Gecerlilik Tarihi', 'Durum']],
    body: tableData,
    startY: 40,
    styles: { font: 'helvetica', fontSize: 9 },
    headStyles: { fillColor: [139, 92, 246] }, // Purple-500
    alternateRowStyles: { fillColor: [245, 243, 255] }
  })

  addFooter(doc)

  doc.save(`kalibrasyon-raporu-${format(new Date(), 'yyyy-MM-dd')}.pdf`)
}

export const generateUsageInstructionPDF = (
  deviceName: string,
  brand: string,
  model?: string | null,
  categoryName?: string,
  instructions?: string,
  safetyWarnings: string[] = [],
  technicalSpecs: Record<string, string> = {}
): jsPDF => {
  const doc = new jsPDF() as jsPDFWithAutoTable
  addHeader(doc, `${deviceName || 'Cihaz'} - Kullanım Talimatı`)

  const startY = 40

  const infoData: string[][] = [
    ['Cihaz Adı', deviceName || '-'],
    ['Kategori', categoryName || '-'],
    ['Marka / Model', `${brand || '-'} / ${model || '-'}`],
  ]

  if (technicalSpecs && Object.keys(technicalSpecs).length > 0) {
    Object.entries(technicalSpecs).forEach(([key, val]) => {
      infoData.push([key, String(val)])
    })
  }

  autoTable(doc, {
    head: [['Özellik', 'Değer']],
    body: infoData,
    startY,
    styles: { font: 'helvetica', fontSize: 9 },
    headStyles: { fillColor: [59, 130, 246] },
    alternateRowStyles: { fillColor: [243, 244, 246] }
  })

  let currentY = doc.lastAutoTable.finalY + 10

  if (safetyWarnings && safetyWarnings.length > 0) {
    if (currentY > 230) {
      doc.addPage()
      currentY = 20
    }
    doc.setFontSize(12)
    doc.setTextColor(220, 38, 38)
    doc.text('Güvenlik Uyarıları ve Önlemleri', 14, currentY)
    currentY += 6

    const warningRows = safetyWarnings.map((w, idx) => [`${idx + 1}`, w])
    autoTable(doc, {
      head: [['#', 'Uyarı']],
      body: warningRows,
      startY: currentY,
      styles: { font: 'helvetica', fontSize: 9 },
      headStyles: { fillColor: [239, 68, 68] },
      alternateRowStyles: { fillColor: [254, 242, 242] }
    })
    currentY = doc.lastAutoTable.finalY + 10
  }

  if (instructions) {
    if (currentY > 230) {
      doc.addPage()
      currentY = 20
    }
    doc.setFontSize(12)
    doc.setTextColor(30, 41, 59)
    doc.text('Talimat Metni', 14, currentY)
    currentY += 8

    doc.setFontSize(9)
    doc.setTextColor(51, 65, 85)
    const cleanLines = instructions.split('\n')
    for (const rawLine of cleanLines) {
      const line = rawLine.replace(/^[#*-]+\s*/, '').trim()
      if (!line) {
        currentY += 3
        continue
      }
      if (currentY > 270) {
        doc.addPage()
        currentY = 20
      }
      const splitText = doc.splitTextToSize(line, doc.internal.pageSize.width - 28)
      doc.text(splitText, 14, currentY)
      currentY += (splitText.length * 4.5) + 1
    }
  }

  addFooter(doc)
  return doc
}

export const generateMaintenanceProcedurePDF = (
  deviceName: string,
  brand: string,
  model?: string | null,
  categoryName?: string,
  procedure?: string,
  frequency?: string,
  requiredTools?: string[],
  safetyPrecautions?: string[]
): jsPDF => {
  const doc = new jsPDF() as jsPDFWithAutoTable
  addHeader(doc, `${deviceName || 'Cihaz'} - Periyodik Bakım Prosedürü`)

  const startY = 40

  const infoData: string[][] = [
    ['Cihaz Adı', deviceName || '-'],
    ['Kategori', categoryName || '-'],
    ['Marka / Model', `${brand || '-'} / ${model || '-'}`],
    ['Bakım Periyodu', frequency || 'Belirtilmedi'],
  ]

  if (requiredTools && requiredTools.length > 0) {
    infoData.push(['Gerekli Alet / Ekipman', requiredTools.join(', ')])
  }

  autoTable(doc, {
    head: [['Özellik', 'Bilgi']],
    body: infoData,
    startY,
    styles: { font: 'helvetica', fontSize: 9 },
    headStyles: { fillColor: [16, 185, 129] },
    alternateRowStyles: { fillColor: [240, 253, 244] }
  })

  let currentY = doc.lastAutoTable.finalY + 10

  if (safetyPrecautions && safetyPrecautions.length > 0) {
    if (currentY > 230) {
      doc.addPage()
      currentY = 20
    }
    doc.setFontSize(12)
    doc.setTextColor(220, 38, 38)
    doc.text('Bakım Güvenlik Önlemleri', 14, currentY)
    currentY += 6

    const safetyRows = safetyPrecautions.map((s, idx) => [`${idx + 1}`, s])
    autoTable(doc, {
      head: [['#', 'Önlem']],
      body: safetyRows,
      startY: currentY,
      styles: { font: 'helvetica', fontSize: 9 },
      headStyles: { fillColor: [239, 68, 68] },
      alternateRowStyles: { fillColor: [254, 242, 242] }
    })
    currentY = doc.lastAutoTable.finalY + 10
  }

  if (procedure) {
    if (currentY > 230) {
      doc.addPage()
      currentY = 20
    }
    doc.setFontSize(12)
    doc.setTextColor(30, 41, 59)
    doc.text('Bakım Adımları ve Prosedür', 14, currentY)
    currentY += 8

    doc.setFontSize(9)
    doc.setTextColor(51, 65, 85)
    const cleanLines = procedure.split('\n')
    for (const rawLine of cleanLines) {
      const line = rawLine.replace(/^[#*-]+\s*/, '').trim()
      if (!line) {
        currentY += 3
        continue
      }
      if (currentY > 270) {
        doc.addPage()
        currentY = 20
      }
      const splitText = doc.splitTextToSize(line, doc.internal.pageSize.width - 28)
      doc.text(splitText, 14, currentY)
      currentY += (splitText.length * 4.5) + 1
    }
  }

  addFooter(doc)
  return doc
}

const addHeader = (doc: jsPDF, title: string) => {
  const pageWidth = doc.internal.pageSize.width

  // Logo placeholder (color block)
  doc.setFillColor(59, 130, 246)
  doc.rect(14, 10, 10, 10, 'F')

  doc.setFontSize(20)
  doc.setTextColor(40, 40, 40)
  doc.text('MediSync', 30, 18)

  doc.setFontSize(10)
  doc.setTextColor(100, 100, 100)
  doc.text('Profesyonel Cihaz Yönetim Sistemi', 30, 23)

  // Title
  doc.setFontSize(16)
  doc.setTextColor(0, 0, 0)
  doc.text(title, 14, 35)

  // Date
  doc.setFontSize(10)
  doc.setTextColor(100, 100, 100)
  doc.text(`Tarih: ${format(new Date(), 'dd MMMM yyyy', { locale: tr })}`, pageWidth - 14, 18, { align: 'right' })

  // Line
  doc.setDrawColor(200, 200, 200)
  doc.line(14, 25, pageWidth - 14, 25)
}

const addFooter = (doc: jsPDF) => {
  const pageCount = doc.getNumberOfPages()
  const pageWidth = doc.internal.pageSize.width
  const pageHeight = doc.internal.pageSize.height

  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    doc.setFontSize(8)
    doc.setTextColor(150, 150, 150)
    doc.text(
      `Sayfa ${i} / ${pageCount}`,
      pageWidth / 2,
      pageHeight - 10,
      { align: 'center' }
    )
    doc.text(
      'MediSync tarafından otomatik oluşturulmuştur.',
      14,
      pageHeight - 10
    )
  }
}
