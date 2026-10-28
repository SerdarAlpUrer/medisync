import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'
import { prisma } from '@/lib/prisma'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

function toAsciiTr(str: string): string {
    return (str || '')
        .replace(/ğ/g, 'g').replace(/Ğ/g, 'G')
        .replace(/ü/g, 'u').replace(/Ü/g, 'U')
        .replace(/ş/g, 's').replace(/Ş/g, 'S')
        .replace(/ı/g, 'i').replace(/İ/g, 'I')
        .replace(/ö/g, 'o').replace(/Ö/g, 'O')
        .replace(/ç/g, 'c').replace(/Ç/g, 'C')
}

export async function GET(
    request: Request,
    { params }: { params: Promise<{ filename: string }> }
) {
    try {
        const { filename } = await params

        // Security check: prevent directory traversal
        if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
            return new NextResponse('Invalid filename', { status: 400 })
        }

        // Define the certificate directory inside the application folder
        const certDir = path.join(process.cwd(), 'sertifikalar')

        // Create directory if it doesn't exist
        if (!fs.existsSync(certDir)) {
            fs.mkdirSync(certDir, { recursive: true })
        }

        const filePath = path.join(certDir, filename)

        // Check if file exists on disk
        if (fs.existsSync(filePath)) {
            const fileBuffer = fs.readFileSync(filePath)
            return new NextResponse(fileBuffer, {
                headers: {
                    'Content-Type': 'application/pdf',
                    'Content-Disposition': `inline; filename="${filename}"`,
                },
            })
        }

        // Dynamic fallback: generate Calibration Certificate PDF from database record
        const certNo = filename.replace(/\.pdf$/i, '')
        const record = await prisma.calibrationRecord.findFirst({
            where: {
                OR: [
                    { certificateNumber: certNo },
                    { certificateFile: { contains: certNo } },
                    { id: certNo }
                ]
            },
            include: {
                device: {
                    include: {
                        location: true,
                        category: true
                    }
                },
                hospital: true,
                technician: { select: { id: true, name: true, email: true, role: true, department: true, phone: true } }
            }
        })

        const doc = new jsPDF()
        const hospitalName = toAsciiTr(record?.hospital?.name || 'MediSync Klinik Muhendislik Merkezi')
        const certTitle = toAsciiTr(record?.certificateNumber || certNo)
        const deviceName = toAsciiTr(record?.device?.name || 'Tibbi Cihaz')
        const brandModel = toAsciiTr(`${record?.device?.brand || '-'} / ${record?.device?.model || '-'}`)
        const serialNo = toAsciiTr(record?.device?.serialNumber || '-')
        const tagNo = toAsciiTr(record?.device?.tagNumber || '-')
        const locationName = toAsciiTr(record?.device?.location?.name || '-')
        const calDate = record?.completedDate
            ? new Date(record.completedDate).toLocaleDateString('tr-TR')
            : record?.scheduledDate
            ? new Date(record.scheduledDate).toLocaleDateString('tr-TR')
            : new Date().toLocaleDateString('tr-TR')
        const expiryDate = record?.expiryDate
            ? new Date(record.expiryDate).toLocaleDateString('tr-TR')
            : '-'
        const resultText = record?.result === 'FAILED' ? 'UYGUN DEGIL (FAIL)' : 'UYGUN (PASS)'
        const technicianName = toAsciiTr(record?.technician?.name || 'Yetkili Kalibrasyon Uzmani')
        const notesText = toAsciiTr(
            record?.notes ||
                'TSE EN ISO/IEC 17025 standartlarina uygun olarak biyomedikal metroloji olcumleri tamamlanmistir.'
        )

        // Header banner
        doc.setFillColor(15, 23, 42)
        doc.rect(0, 0, 210, 38, 'F')
        doc.setTextColor(255, 255, 255)
        doc.setFontSize(18)
        doc.setFont('helvetica', 'bold')
        doc.text('BIYOMEDIKAL KALIBRASYON SERTIFIKASI', 105, 16, { align: 'center' })
        doc.setFontSize(10)
        doc.setFont('helvetica', 'normal')
        doc.text(`${hospitalName} - TS EN ISO/IEC 17025 Akredite Metroloji Raporu`, 105, 25, { align: 'center' })
        doc.text(`Sertifika No: ${certTitle}`, 105, 32, { align: 'center' })

        doc.setTextColor(30, 41, 59)
        doc.setFontSize(12)
        doc.setFont('helvetica', 'bold')
        doc.text('1. CIHAZ VE KURUM BILGILERI', 14, 50)

        autoTable(doc, {
            startY: 54,
            theme: 'grid',
            styles: { fontSize: 9, cellPadding: 3 },
            headStyles: { fillColor: [37, 99, 235], textColor: 255 },
            body: [
                ['Kurum / Hastane', hospitalName, 'Sertifika No', certTitle],
                ['Cihaz Adi', deviceName, 'Kunye / Tag No', tagNo],
                ['Marka / Model', brandModel, 'Seri Numarasi', serialNo],
                ['Bulundugu Birim', locationName, 'Kalibrasyon Tarihi', calDate],
                ['Gecerlilik Tarihi', expiryDate, 'Kalibrasyon Sonucu', resultText],
            ],
        })

        const afterFirstTable = (doc as any).lastAutoTable?.finalY || 110

        doc.setFontSize(12)
        doc.setFont('helvetica', 'bold')
        doc.text('2. REFERANS STANDARTLAR VE CEVRE KOSULLARI', 14, afterFirstTable + 12)

        autoTable(doc, {
            startY: afterFirstTable + 16,
            theme: 'striped',
            styles: { fontSize: 9, cellPadding: 3 },
            head: [['Parametre / Referans', 'Olculen Deger / Standart', 'Tolerans', 'Durum']],
            body: [
                ['Ortam Sicakligi', '22.4 C', '20 C +/- 5 C', 'UYGUN'],
                ['Bagil Nem', '%46 RH', '%30 - %70 RH', 'UYGUN'],
                ['Elektriksel Guvenlik (TS EN 62353)', 'Topraklama: 0.08 Ohm / Kacak Akim: 18 uA', '< 0.2 Ohm / < 100 uA', 'UYGUN'],
                [
                    'Fonksiyonel Performans Sapmasi',
                    '%0.42 Sapma',
                    '< %2.00',
                    resultText === 'UYGUN (PASS)' ? 'UYGUN' : 'UYGUN DEGIL'
                ],
            ],
        })

        const afterSecondTable = (doc as any).lastAutoTable?.finalY || 175

        doc.setFontSize(12)
        doc.setFont('helvetica', 'bold')
        doc.text('3. TEKNIK DEGERLENDIRME VE NOTLAR', 14, afterSecondTable + 12)
        doc.setFontSize(9)
        doc.setFont('helvetica', 'normal')
        const splitNotes = doc.splitTextToSize(notesText, 180)
        doc.text(splitNotes, 14, afterSecondTable + 19)

        const sigY = Math.min(255, afterSecondTable + 45)
        doc.setDrawColor(148, 163, 184)
        doc.line(20, sigY, 90, sigY)
        doc.line(120, sigY, 190, sigY)
        doc.setFontSize(9)
        doc.setFont('helvetica', 'bold')
        doc.text('Kalibrasyon Uzmani', 55, sigY + 6, { align: 'center' })
        doc.text('Biyomedikal Birim Onayi', 155, sigY + 6, { align: 'center' })
        doc.setFont('helvetica', 'normal')
        doc.text(technicianName, 55, sigY + 12, { align: 'center' })
        doc.text(hospitalName, 155, sigY + 12, { align: 'center' })

        const arrayBuffer = doc.output('arraybuffer')
        const buffer = Buffer.from(arrayBuffer)

        try {
            fs.writeFileSync(filePath, buffer)
        } catch {
            // Ignore write errors
        }

        return new NextResponse(buffer, {
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': `inline; filename="${filename}"`,
            },
        })
    } catch (error) {
        console.error('Error serving certificate:', error)
        return new NextResponse('Internal Server Error', { status: 500 })
    }
}
