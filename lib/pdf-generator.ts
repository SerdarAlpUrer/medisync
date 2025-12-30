import jsPDF from 'jspdf'

/**
 * Kullanım Talimatı PDF oluştur
 */
export function generateUsageInstructionPDF(
  deviceName: string,
  deviceBrand: string,
  deviceModel: string,
  deviceCategory: string,
  instructions: string,
  safetyWarnings?: string[],
  technicalSpecs?: Record<string, string>
): jsPDF {
  const doc = new jsPDF()
  const pageWidth = doc.internal.pageSize.getWidth()
  const margin = 15
  const maxWidth = pageWidth - 2 * margin
  let yPosition = margin

  // Header
  doc.setFontSize(20)
  doc.setFont('helvetica', 'bold')
  doc.text('KULLANIM TALİMATI', pageWidth / 2, yPosition, { align: 'center' })
  yPosition += 10

  // Cihaz Bilgileri
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.text('Cihaz Bilgileri', margin, yPosition)
  yPosition += 8

  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  const deviceInfo = [
    `Cihaz Adı: ${deviceName}`,
    `Marka: ${deviceBrand}`,
    `Model: ${deviceModel}`,
    `Kategori: ${deviceCategory}`,
  ]

  deviceInfo.forEach(info => {
    doc.text(info, margin + 5, yPosition)
    yPosition += 6
  })

  yPosition += 5

  // Güvenlik Uyarıları
  if (safetyWarnings && safetyWarnings.length > 0) {
    if (yPosition > 250) {
      doc.addPage()
      yPosition = margin
    }

    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(255, 0, 0) // Kırmızı
    doc.text('⚠ GÜVENLİK UYARILARI', margin, yPosition)
    doc.setTextColor(0, 0, 0) // Siyah'a dön
    yPosition += 8

    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    safetyWarnings.forEach(warning => {
      const lines = doc.splitTextToSize(`• ${warning}`, maxWidth - 10)
      lines.forEach((line: string) => {
        if (yPosition > 270) {
          doc.addPage()
          yPosition = margin
        }
        doc.text(line, margin + 5, yPosition)
        yPosition += 5
      })
      yPosition += 2
    })
  }

  yPosition += 5

  // Teknik Özellikler
  if (technicalSpecs && Object.keys(technicalSpecs).length > 0) {
    if (yPosition > 250) {
      doc.addPage()
      yPosition = margin
    }

    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.text('Teknik Özellikler', margin, yPosition)
    yPosition += 8

    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    Object.entries(technicalSpecs).forEach(([key, value]) => {
      if (yPosition > 270) {
        doc.addPage()
        yPosition = margin
      }
      doc.text(`${key}: ${value}`, margin + 5, yPosition)
      yPosition += 6
    })
    yPosition += 5
  }

  // Kullanım Talimatları
  if (yPosition > 250) {
    doc.addPage()
    yPosition = margin
  }

  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.text('Kullanım Talimatları', margin, yPosition)
  yPosition += 8

  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  const instructionLines = doc.splitTextToSize(instructions, maxWidth - 10)
  instructionLines.forEach((line: string) => {
    if (yPosition > 270) {
      doc.addPage()
      yPosition = margin
    }
    doc.text(line, margin + 5, yPosition)
    yPosition += 6
  })

  // Footer
  const pageCount = doc.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    doc.setFontSize(8)
    doc.setFont('helvetica', 'italic')
    doc.text(
      `Sayfa ${i} / ${pageCount} - Oluşturulma Tarihi: ${new Date().toLocaleDateString('tr-TR')}`,
      pageWidth / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: 'center' }
    )
  }

  return doc
}

/**
 * Bakım Prosedürü PDF oluştur
 */
export function generateMaintenanceProcedurePDF(
  deviceName: string,
  deviceBrand: string,
  deviceModel: string,
  deviceCategory: string,
  procedure: string,
  frequency?: string,
  requiredTools?: string[],
  safetyPrecautions?: string[]
): jsPDF {
  const doc = new jsPDF()
  const pageWidth = doc.internal.pageSize.getWidth()
  const margin = 15
  const maxWidth = pageWidth - 2 * margin
  let yPosition = margin

  // Header
  doc.setFontSize(20)
  doc.setFont('helvetica', 'bold')
  doc.text('BAKIM PROSEDÜRÜ', pageWidth / 2, yPosition, { align: 'center' })
  yPosition += 10

  // Cihaz Bilgileri
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.text('Cihaz Bilgileri', margin, yPosition)
  yPosition += 8

  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  const deviceInfo = [
    `Cihaz Adı: ${deviceName}`,
    `Marka: ${deviceBrand}`,
    `Model: ${deviceModel}`,
    `Kategori: ${deviceCategory}`,
  ]
  if (frequency) {
    deviceInfo.push(`Bakım Sıklığı: ${frequency}`)
  }

  deviceInfo.forEach(info => {
    doc.text(info, margin + 5, yPosition)
    yPosition += 6
  })

  yPosition += 5

  // Güvenlik Önlemleri
  if (safetyPrecautions && safetyPrecautions.length > 0) {
    if (yPosition > 250) {
      doc.addPage()
      yPosition = margin
    }

    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(255, 165, 0) // Turuncu
    doc.text('⚠ GÜVENLİK ÖNLEMLERİ', margin, yPosition)
    doc.setTextColor(0, 0, 0)
    yPosition += 8

    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    safetyPrecautions.forEach(precaution => {
      const lines = doc.splitTextToSize(`• ${precaution}`, maxWidth - 10)
      lines.forEach((line: string) => {
        if (yPosition > 270) {
          doc.addPage()
          yPosition = margin
        }
        doc.text(line, margin + 5, yPosition)
        yPosition += 5
      })
      yPosition += 2
    })
  }

  yPosition += 5

  // Gerekli Araçlar
  if (requiredTools && requiredTools.length > 0) {
    if (yPosition > 250) {
      doc.addPage()
      yPosition = margin
    }

    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.text('Gerekli Araçlar ve Malzemeler', margin, yPosition)
    yPosition += 8

    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    requiredTools.forEach(tool => {
      if (yPosition > 270) {
        doc.addPage()
        yPosition = margin
      }
      doc.text(`• ${tool}`, margin + 5, yPosition)
      yPosition += 6
    })
    yPosition += 5
  }

  // Bakım Prosedürü
  if (yPosition > 250) {
    doc.addPage()
    yPosition = margin
  }

  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.text('Bakım Adımları', margin, yPosition)
  yPosition += 8

  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  const procedureLines = doc.splitTextToSize(procedure, maxWidth - 10)
  procedureLines.forEach((line: string) => {
    if (yPosition > 270) {
      doc.addPage()
      yPosition = margin
    }
    doc.text(line, margin + 5, yPosition)
    yPosition += 6
  })

  // Footer
  const pageCount = doc.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    doc.setFontSize(8)
    doc.setFont('helvetica', 'italic')
    doc.text(
      `Sayfa ${i} / ${pageCount} - Oluşturulma Tarihi: ${new Date().toLocaleDateString('tr-TR')}`,
      pageWidth / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: 'center' }
    )
  }

  return doc
}

/**
 * Eğitim Belgesi PDF oluştur
 */
export function generateTrainingCertificatePDF(
  userName: string,
  trainingTitle: string,
  trainingDate: string,
  certificateNumber: string,
  score?: number,
  passingScore?: number
): jsPDF {
  const doc = new jsPDF('landscape', 'mm', 'a4')
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()

  // Border
  doc.setDrawColor(0, 0, 0)
  doc.setLineWidth(1)
  doc.rect(10, 10, pageWidth - 20, pageHeight - 20)

  // Title
  doc.setFontSize(24)
  doc.setFont('helvetica', 'bold')
  doc.text('EĞİTİM BELGESİ', pageWidth / 2, 40, { align: 'center' })

  // Certificate Number
  doc.setFontSize(12)
  doc.setFont('helvetica', 'normal')
  doc.text(`Belge No: ${certificateNumber}`, pageWidth / 2, 50, { align: 'center' })

  // Content
  doc.setFontSize(14)
  doc.setFont('helvetica', 'normal')
  doc.text('Aşağıda adı geçen kişiye', pageWidth / 2, 70, { align: 'center' })

  // Name
  doc.setFontSize(18)
  doc.setFont('helvetica', 'bold')
  doc.text(userName, pageWidth / 2, 85, { align: 'center' })

  // Training Info
  doc.setFontSize(14)
  doc.setFont('helvetica', 'normal')
  doc.text(`"${trainingTitle}"`, pageWidth / 2, 100, { align: 'center' })
  doc.text('konulu eğitimi başarıyla tamamlamıştır.', pageWidth / 2, 110, { align: 'center' })

  // Score if available
  if (score !== undefined && passingScore !== undefined) {
    doc.setFontSize(12)
    doc.text(`Not: ${score} / ${passingScore}`, pageWidth / 2, 125, { align: 'center' })
  }

  // Date
  doc.setFontSize(12)
  doc.text(`Tarih: ${trainingDate}`, pageWidth / 2, 145, { align: 'center' })

  // Signature area
  doc.setFontSize(10)
  doc.text('Eğitim Sorumlusu', pageWidth / 4, pageHeight - 40, { align: 'center' })
  doc.text('Onay', (3 * pageWidth) / 4, pageHeight - 40, { align: 'center' })

  return doc
}

/**
 * PDF'i blob olarak döndür (API için)
 */
export function pdfToBlob(pdf: jsPDF): Blob {
  return pdf.output('blob')
}
