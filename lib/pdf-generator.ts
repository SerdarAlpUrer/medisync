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
