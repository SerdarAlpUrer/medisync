'use client'

import React, { useRef, useState, useEffect, useContext } from 'react'
import { QRCodeCanvas } from 'qrcode.react'
import { Download, Printer, Tag, Check, Sparkles, Info, Edit3, Building } from 'lucide-react'
import { useSettings } from '@/contexts/SettingsContext'
import { HospitalContext } from '@/contexts/HospitalContext'

interface QRCodeGeneratorProps {
  value: string
  size?: number
  title?: string
  device?: {
    name?: string
    brand?: string
    tagNumber?: string
    barcode?: string
    serialNumber?: string
    model?: string
    department?: string
    location?: any
  }
  onClose?: () => void
}

export type LabelFormat =
  | 'tze-24mm'             // Brother TZe 24mm Dikey (Fotoğraftaki Standart 24x50mm)
  | 'tze-32mm'             // Brother TZe 32/36mm Dikey (Geniş Şerit 32x65mm)
  | 'tze-18mm'             // Brother TZe 18mm Dikey (Dar Şerit 18x42mm)
  | 'tze-24mm-horizontal'  // Brother TZe 24mm Yatay Şerit (60x24mm)
  | 'thermal-50x30'        // Termal Rulo 50x30mm
  | 'thermal-80x50'        // Termal Rulo 80x50mm
  | 'standard'             // Standart A4 Sayfa

export default function QRCodeGenerator({
  value,
  size = 200,
  title,
  device,
  onClose
}: QRCodeGeneratorProps) {
  const qrRef = useRef<HTMLDivElement>(null)
  const [printSrc, setPrintSrc] = useState<string>('')
  const { settings } = useSettings()
  
  // Hospital context for clean institutional branding
  const hospitalCtx = useContext(HospitalContext)
  const activeHospital = hospitalCtx?.activeHospital

  const [labelFormat, setLabelFormat] = useState<LabelFormat>('tze-24mm')

  // Initial hospital name calculation:
  // Priority: 1. settings.labelHeaderText (if customized and not default)
  //           2. activeHospital.name (e.g. "Özel PARKHAYAT Hastanesi")
  //           3. "Özel PARKHAYAT Hastanesi"
  const getInitialHospitalTitle = () => {
    if (settings?.labelHeaderText && settings.labelHeaderText !== 'MEDISYNC BİYOMEDİKAL' && settings.labelHeaderText !== 'TIBBİ CİHAZ KÜNYESİ') {
      return settings.labelHeaderText
    }
    if (activeHospital?.name) {
      return activeHospital.name
    }
    return 'Özel PARKHAYAT Hastanesi'
  }

  const [headerTitle, setHeaderTitle] = useState<string>(getInitialHospitalTitle())
  const [isEditingTitle, setIsEditingTitle] = useState(false)

  const showSerial = settings?.showSerialOnLabel !== false
  const showLocation = settings?.showLocationOnLabel !== false

  // Safely extract location string
  const deviceLocation =
    (typeof device?.location === 'object' && device?.location?.name ? device.location.name : '') ||
    (typeof device?.location === 'string' ? device.location : '') ||
    (device as any)?.department ||
    ''

  useEffect(() => {
    if (settings?.defaultLabelFormat) {
      setLabelFormat(settings.defaultLabelFormat as LabelFormat)
    }
  }, [settings?.defaultLabelFormat])

  // Update headerTitle if activeHospital changes
  useEffect(() => {
    setHeaderTitle(getInitialHospitalTitle())
  }, [activeHospital?.name, settings?.labelHeaderText])

  // Parse title safely by splitting with " - "
  const titleParts = title ? title.split(' - ') : []
  const titleTag = titleParts.length > 1 ? titleParts[0].trim() : ''
  const titleName = titleParts.length > 1 ? titleParts.slice(1).join(' - ').trim() : (title || '')

  const tagNumber = device?.tagNumber || titleTag || (device as any)?.barcode || 'KÜNYE TANIMSIZ'
  const deviceName = device?.name || titleName || device?.model || 'Tıbbi Cihaz'
  const deviceBrand = (device as any)?.brand || ''
  const deviceModel = device?.model || ''
  const serialNumber = device?.serialNumber || ''

  // Full device name in uppercase for high-contrast thermal readability
  const uppercaseDeviceName = deviceName.toLocaleUpperCase('tr-TR')

  // Update print source when value changes
  useEffect(() => {
    const updatePrintSrc = () => {
      const canvas = qrRef.current?.querySelector('canvas')
      if (canvas) {
        setPrintSrc(canvas.toDataURL('image/png'))
      }
    }
    const timer = setTimeout(updatePrintSrc, 120)
    return () => clearTimeout(timer)
  }, [value, size, labelFormat])

  // Download high-resolution PNG with QR code AND Künye metadata embedded
  const downloadQRCode = () => {
    const qrCanvas = qrRef.current?.querySelector('canvas')
    if (!qrCanvas) return

    const compositeCanvas = document.createElement('canvas')
    const ctx = compositeCanvas.getContext('2d')
    if (!ctx) return

    const isTzeVertical = labelFormat === 'tze-24mm' || labelFormat === 'tze-32mm' || labelFormat === 'tze-18mm'

    if (isTzeVertical) {
      // Dikey Brother TZe Şerit (Fotoğraftaki Standart: Üstte QR, Altta 4 Satır Ortalı Metin)
      const canvasWidth = labelFormat === 'tze-24mm' ? 568 : labelFormat === 'tze-32mm' ? 756 : 425
      const canvasHeight = labelFormat === 'tze-24mm' ? 1180 : labelFormat === 'tze-32mm' ? 1530 : 990
      compositeCanvas.width = canvasWidth
      compositeCanvas.height = canvasHeight

      // 1. Zemin
      ctx.fillStyle = '#FFFFFF'
      ctx.fillRect(0, 0, canvasWidth, canvasHeight)

      // 2. Dış çerçeve kılavuzu
      ctx.strokeStyle = '#000000'
      ctx.lineWidth = 3
      ctx.strokeRect(3, 3, canvasWidth - 6, canvasHeight - 6)

      // 3. Üstte Karekod (Ortalı, tam şerit genişliğine yakın)
      const qrPadding = labelFormat === 'tze-24mm' ? 34 : labelFormat === 'tze-32mm' ? 48 : 25
      const qrDrawSize = canvasWidth - (qrPadding * 2)
      ctx.drawImage(qrCanvas, qrPadding, qrPadding, qrDrawSize, qrDrawSize)

      // 4. Alt Metin Bloğu (Ortalı, fotoğraf şablonu)
      ctx.textAlign = 'center'

      // Satır 1: Hastane Adı (Örn: Batıkent Hastanesi / Özel PARKHAYAT Hastanesi)
      ctx.fillStyle = '#000000'
      ctx.font = labelFormat === 'tze-24mm' ? 'bold 34px sans-serif' : labelFormat === 'tze-32mm' ? 'bold 44px sans-serif' : 'bold 26px sans-serif'
      const line1Y = qrPadding + qrDrawSize + (labelFormat === 'tze-24mm' ? 65 : 85)
      ctx.fillText(headerTitle.substring(0, 32), canvasWidth / 2, line1Y)

      // Satır 2: Cihaz Adı (Büyük Harflerle, Örn: THERMOHYGROMETRE)
      ctx.font = labelFormat === 'tze-24mm' ? '800 32px sans-serif' : labelFormat === 'tze-32mm' ? '800 42px sans-serif' : '800 24px sans-serif'
      const line2Y = line1Y + (labelFormat === 'tze-24mm' ? 60 : 80)
      ctx.fillText(uppercaseDeviceName.substring(0, 26), canvasWidth / 2, line2Y)

      // Satır 3: Künye No (TZe etiketlerde kenarlardan taşmaması ve estetik durması için 1 tık küçültülmüş punto)
      ctx.font = labelFormat === 'tze-24mm' ? '900 52px "Courier New", monospace, sans-serif' : labelFormat === 'tze-32mm' ? '900 68px "Courier New", monospace, sans-serif' : '900 38px "Courier New", monospace, sans-serif'
      const line3Y = line2Y + (labelFormat === 'tze-24mm' ? 95 : 120)
      ctx.fillText(tagNumber, canvasWidth / 2, line3Y)

      // Satır 4: Bölüm / Servis (Örn: 2.Kat Kadın Doğum Servisi)
      ctx.fillStyle = '#222222'
      ctx.font = labelFormat === 'tze-24mm' ? '600 28px sans-serif' : labelFormat === 'tze-32mm' ? '600 36px sans-serif' : '600 22px sans-serif'
      const line4Y = line3Y + (labelFormat === 'tze-24mm' ? 65 : 85)
      const locationText = deviceLocation || (showSerial && serialNumber ? `SN: ${serialNumber}` : '')
      ctx.fillText(locationText.substring(0, 32), canvasWidth / 2, line4Y)

    } else if (labelFormat === 'tze-24mm-horizontal') {
      // Yatay TZe formatı (600x240px)
      const canvasWidth = 600
      const canvasHeight = 240
      compositeCanvas.width = canvasWidth
      compositeCanvas.height = canvasHeight

      ctx.fillStyle = '#FFFFFF'
      ctx.fillRect(0, 0, canvasWidth, canvasHeight)
      ctx.strokeStyle = '#000000'
      ctx.lineWidth = 3
      ctx.strokeRect(3, 3, canvasWidth - 6, canvasHeight - 6)

      const qrPadding = 15
      const qrSize = canvasHeight - (qrPadding * 2)
      ctx.drawImage(qrCanvas, qrPadding, qrPadding, qrSize, qrSize)

      ctx.strokeStyle = '#CBD5E1'
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.moveTo(qrPadding + qrSize + 15, 10)
      ctx.lineTo(qrPadding + qrSize + 15, canvasHeight - 10)
      ctx.stroke()

      const textX = qrPadding + qrSize + 30
      ctx.textAlign = 'left'
      ctx.fillStyle = '#000000'
      ctx.font = 'bold 16px sans-serif'
      ctx.fillText(headerTitle.substring(0, 32), textX, 35)

      ctx.font = '900 24px "Courier New", monospace, sans-serif'
      ctx.fillText(tagNumber, textX, 85)

      ctx.font = 'bold 16px sans-serif'
      ctx.fillText(uppercaseDeviceName.substring(0, 30), textX, 130)

      ctx.fillStyle = '#333333'
      ctx.font = '600 14px sans-serif'
      const meta = [showSerial && serialNumber ? `SN: ${serialNumber}` : '', deviceLocation].filter(Boolean).join(' • ')
      ctx.fillText(meta.substring(0, 35), textX, 175)

    } else {
      // Standard A4 veya Termal Rulo
      const padding = 20
      const qrWidth = qrCanvas.width
      const qrHeight = qrCanvas.height
      const textHeight = 95

      compositeCanvas.width = qrWidth + padding * 2
      compositeCanvas.height = qrHeight + padding * 2 + textHeight

      ctx.fillStyle = '#FFFFFF'
      ctx.fillRect(0, 0, compositeCanvas.width, compositeCanvas.height)
      ctx.strokeStyle = '#000000'
      ctx.lineWidth = 2
      ctx.strokeRect(2, 2, compositeCanvas.width - 4, compositeCanvas.height - 4)

      ctx.fillStyle = '#000000'
      ctx.font = 'bold 13px sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText(headerTitle.substring(0, 32), compositeCanvas.width / 2, padding)

      ctx.drawImage(qrCanvas, padding, padding + 10)

      ctx.fillStyle = '#000000'
      ctx.font = '900 20px "Courier New", monospace, sans-serif'
      ctx.fillText(tagNumber, compositeCanvas.width / 2, qrHeight + padding + 40)

      ctx.font = 'bold 13px sans-serif'
      ctx.fillText(uppercaseDeviceName.substring(0, 30), compositeCanvas.width / 2, qrHeight + padding + 62)

      ctx.font = '600 11px sans-serif'
      ctx.fillStyle = '#444444'
      const meta = [deviceLocation, showSerial && serialNumber ? `SN: ${serialNumber}` : ''].filter(Boolean).join(' • ')
      ctx.fillText(meta.substring(0, 32), compositeCanvas.width / 2, qrHeight + padding + 82)
    }

    const pngUrl = compositeCanvas.toDataURL('image/png')
    const downloadLink = document.createElement('a')
    downloadLink.href = pngUrl
    downloadLink.download = `karekod-${tagNumber || 'cihaz'}-${labelFormat}.png`
    document.body.appendChild(downloadLink)
    downloadLink.click()
    document.body.removeChild(downloadLink)
  }

  const printQRCode = () => {
    window.print()
  }

  const isTzeVertical = labelFormat === 'tze-24mm' || labelFormat === 'tze-32mm' || labelFormat === 'tze-18mm'

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      {/* Dynamic Print Styles for Brother TZe (Vertical/Horizontal), Thermal & Standard Printers */}
      <style>{`
        @media print {
          @page {
            size: ${
              labelFormat === 'tze-24mm' ? '24mm 50mm' :
              labelFormat === 'tze-32mm' ? '32mm 65mm' :
              labelFormat === 'tze-18mm' ? '18mm 42mm' :
              labelFormat === 'tze-24mm-horizontal' ? '60mm 24mm' :
              labelFormat === 'thermal-50x30' ? '50mm 30mm' :
              labelFormat === 'thermal-80x50' ? '80mm 50mm' : 'auto'
            };
            margin: 0;
          }
          body * {
            visibility: hidden !important;
          }
          #printable-qr-container, #printable-qr-container * {
            visibility: visible !important;
          }
          #printable-qr-container {
            position: fixed !important;
            left: 0 !important;
            top: 0 !important;
            width: ${
              labelFormat === 'tze-24mm' ? '24mm' :
              labelFormat === 'tze-32mm' ? '32mm' :
              labelFormat === 'tze-18mm' ? '18mm' :
              labelFormat === 'tze-24mm-horizontal' ? '60mm' :
              labelFormat === 'thermal-50x30' ? '50mm' :
              labelFormat === 'thermal-80x50' ? '80mm' : '100%'
            } !important;
            height: ${
              labelFormat === 'tze-24mm' ? '50mm' :
              labelFormat === 'tze-32mm' ? '65mm' :
              labelFormat === 'tze-18mm' ? '42mm' :
              labelFormat === 'tze-24mm-horizontal' ? '24mm' :
              labelFormat === 'thermal-50x30' ? '30mm' :
              labelFormat === 'thermal-80x50' ? '50mm' : '100%'
            } !important;
            max-height: ${
              labelFormat === 'tze-24mm' ? '50mm' :
              labelFormat === 'tze-32mm' ? '65mm' :
              labelFormat === 'tze-18mm' ? '42mm' :
              labelFormat === 'tze-24mm-horizontal' ? '24mm' :
              labelFormat === 'thermal-50x30' ? '30mm' :
              labelFormat === 'thermal-80x50' ? '50mm' : 'none'
            } !important;
            margin: 0 !important;
            padding: ${
              labelFormat === 'standard' ? '15mm' :
              labelFormat === 'tze-24mm' ? '1mm 1.2mm' :
              labelFormat === 'tze-32mm' ? '1.5mm 1.8mm' :
              labelFormat === 'tze-18mm' ? '0.8mm 1mm' :
              labelFormat === 'tze-24mm-horizontal' ? '1mm 2mm' : '1.5mm 2.5mm'
            } !important;
            box-sizing: border-box !important;
            display: flex !important;
            flex-direction: ${
              labelFormat === 'tze-24mm-horizontal' || labelFormat === 'thermal-50x30' || labelFormat === 'thermal-80x50'
                ? 'row'
                : 'column'
            } !important;
            align-items: center !important;
            justify-content: ${
              labelFormat === 'tze-24mm-horizontal' || labelFormat === 'thermal-50x30' || labelFormat === 'thermal-80x50'
                ? 'space-between'
                : 'flex-start'
            } !important;
            background: white !important;
            color: black !important;
            z-index: 99999 !important;
            overflow: hidden !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .fixed.inset-0 {
            position: static !important;
            background: none !important;
          }
        }
      `}</style>

      {/* Hidden Print Container (Visible only during window.print()) */}
      <div id="printable-qr-container" style={{ display: 'none' }}>
        {isTzeVertical ? (
          /* ============================================================ */
          /* BROTHER TZE DİKEY ŞERİT (FOTOĞRAFTAKİ BİREBİR STANDART)        */
          /* ============================================================ */
          <div
            className="flex flex-col items-center justify-start w-full h-full text-black font-sans leading-none overflow-hidden text-center"
            style={{ boxSizing: 'border-box' }}
          >
            {/* 1. Üstte Karekod (Tam şerit genişliğinde ortalı) */}
            <div
              className="flex items-center justify-center flex-shrink-0"
              style={{
                width: labelFormat === 'tze-24mm' ? '21.6mm' : labelFormat === 'tze-32mm' ? '28.8mm' : '16.2mm',
                height: labelFormat === 'tze-24mm' ? '21.6mm' : labelFormat === 'tze-32mm' ? '28.8mm' : '16.2mm'
              }}
            >
              {printSrc && (
                <img
                  src={printSrc}
                  alt="QR"
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'contain',
                    imageRendering: 'pixelated'
                  }}
                />
              )}
            </div>

            {/* 2. Altta 4 Satır Ortalı Metin (Fotoğraf Şablonu) */}
            <div
              className="flex flex-col items-center justify-center w-full overflow-hidden text-center"
              style={{
                marginTop: labelFormat === 'tze-24mm' ? '1.2mm' : labelFormat === 'tze-32mm' ? '1.6mm' : '0.8mm',
                lineHeight: 1.15
              }}
            >
              {/* Satır 1: Hastane Adı (Örn: Batıkent Hastanesi) */}
              <div
                className="font-bold text-black truncate w-full"
                style={{
                  fontSize: labelFormat === 'tze-24mm' ? '7.5pt' : labelFormat === 'tze-32mm' ? '9.5pt' : '6pt'
                }}
              >
                {headerTitle}
              </div>

              {/* Satır 2: Cihaz Adı (Örn: THERMOHYGROMETRE) */}
              <div
                className="font-extrabold uppercase text-black truncate w-full"
                style={{
                  fontSize: labelFormat === 'tze-24mm' ? '7.5pt' : labelFormat === 'tze-32mm' ? '9.5pt' : '6pt',
                  marginTop: '0.4mm'
                }}
              >
                {uppercaseDeviceName}
              </div>

              {/* Satır 3: Künye No (TZe formatında 1 tık küçültülmüş, taşmayan net punto) */}
              <div
                className="font-black text-black tracking-wider w-full"
                style={{
                  fontFamily: 'monospace, sans-serif',
                  fontSize: labelFormat === 'tze-24mm' ? '10.5pt' : labelFormat === 'tze-32mm' ? '13.5pt' : '8.5pt',
                  margin: '0.5mm 0'
                }}
              >
                {tagNumber}
              </div>

              {/* Satır 4: Bölüm / Servis (Örn: 2.Kat Kadın Doğum Servisi) */}
              <div
                className="font-semibold text-gray-900 truncate w-full"
                style={{
                  fontSize: labelFormat === 'tze-24mm' ? '6.5pt' : labelFormat === 'tze-32mm' ? '8pt' : '5pt'
                }}
              >
                {deviceLocation || (showSerial && serialNumber ? `SN: ${serialNumber}` : '')}
              </div>
            </div>
          </div>
        ) : labelFormat === 'tze-24mm-horizontal' ? (
          /* BROTHER TZE 24MM YATAY ŞERİT */
          <div className="flex items-center justify-between w-full h-full text-black font-sans leading-none overflow-hidden" style={{ boxSizing: 'border-box' }}>
            <div className="flex-shrink-0 flex items-center justify-center" style={{ width: '21mm', height: '100%' }}>
              {printSrc && (
                <img
                  src={printSrc}
                  alt="QR"
                  style={{ width: '20mm', height: '20mm', objectFit: 'contain', imageRendering: 'pixelated' }}
                />
              )}
            </div>
            <div className="flex-1 flex flex-col justify-between h-full pl-2 overflow-hidden text-left" style={{ boxSizing: 'border-box' }}>
              <div className="font-extrabold tracking-tight truncate border-b border-black pb-0.5 text-[7pt]">
                {headerTitle}
              </div>
              <div className="my-auto py-0.5">
                <span className="font-mono font-black text-black text-[11pt] tracking-wider">
                  {tagNumber}
                </span>
              </div>
              <div className="overflow-hidden">
                <div className="font-bold text-black truncate text-[7.5pt]">
                  {uppercaseDeviceName}
                </div>
                <div className="text-gray-800 truncate font-semibold text-[6pt]">
                  {deviceLocation}
                </div>
              </div>
            </div>
          </div>
        ) : labelFormat === 'standard' ? (
          /* A4 STANDART SAYFA */
          <div className="text-center font-sans">
            <p className="text-sm font-bold uppercase tracking-wider text-gray-700 mb-1">{headerTitle}</p>
            <h1 className="text-xl font-bold mb-2">{uppercaseDeviceName}</h1>
            {printSrc && <img src={printSrc} width={size} height={size} alt="QR Code" className="mx-auto" />}
            <div className="mt-4 text-center">
              <p className="font-mono text-2xl font-black text-black tracking-wider mb-1">
                {tagNumber}
              </p>
              {deviceLocation && (
                <p className="text-sm font-semibold text-gray-700">
                  {deviceLocation}
                </p>
              )}
              {showSerial && serialNumber && (
                <p className="font-mono text-xs text-gray-500 mt-0.5">
                  SERİ NO: {serialNumber}
                </p>
              )}
            </div>
          </div>
        ) : (
          /* TERMAL 50x30 / 80x50 RULO ETİKET */
          <div className="flex items-center justify-between w-full h-full text-black font-sans leading-tight">
            <div className="flex-1 pr-1 overflow-hidden flex flex-col justify-center text-left">
              <div className="font-extrabold text-[10px] tracking-tight truncate border-b border-black pb-0.5 mb-0.5">
                {headerTitle}
              </div>
              <div className="font-mono font-black text-[12px] text-black">
                {tagNumber}
              </div>
              <div className="font-bold text-[9px] line-clamp-1 text-gray-900 mt-0.5">
                {uppercaseDeviceName}
              </div>
              {deviceLocation && (
                <div className="text-[7.5px] text-gray-700 truncate mt-0.5 font-medium">
                  {deviceLocation}
                </div>
              )}
            </div>
            <div className="flex-shrink-0 flex items-center justify-center pl-1">
              {printSrc && (
                <img
                  src={printSrc}
                  alt="QR"
                  style={{
                    width: labelFormat === 'thermal-50x30' ? '26.5mm' : '44mm',
                    height: labelFormat === 'thermal-50x30' ? '26.5mm' : '44mm',
                    objectFit: 'contain',
                    imageRendering: 'pixelated'
                  }}
                />
              )}
            </div>
          </div>
        )}
      </div>

      {/* Modal Dialog (Screen View) */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full p-6 animate-in fade-in zoom-in-95 duration-200 print:hidden border border-gray-100 dark:border-gray-700 max-h-[92vh] overflow-y-auto">
        <div className="text-center">
          <div className="flex items-center justify-center space-x-2 mb-1">
            <Tag className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
              Cihaz Künye & Karekod Etiketi
            </h3>
          </div>

          <p className="text-xs text-gray-500 dark:text-gray-400 mb-3 truncate">
            {deviceName} {deviceBrand ? `(${deviceBrand})` : ''}
          </p>

          {/* DYNAMIC PREVIEW BOX */}
          {isTzeVertical ? (
            /* ============================================================ */
            /* FOTOĞRAFTAKİ BİREBİR DİKEY BROTHER TZE ŞERİT ÖNİZLEMESİ       */
            /* ============================================================ */
            <div className="bg-gray-100 dark:bg-gray-900/70 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-inner mb-4 flex flex-col items-center">
              <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider block mb-2">
                Canlı Brother TZe Şerit Önizlemesi ({labelFormat === 'tze-24mm' ? '24 x 50 mm' : labelFormat === 'tze-32mm' ? '32 x 65 mm' : '18 x 42 mm'})
              </span>

              {/* Fiziksel Şerit Görünümlü Kart */}
              <div
                className="bg-white text-black rounded-sm border-2 border-black shadow-lg flex flex-col items-center p-3 font-sans transition-all"
                style={{
                  width: labelFormat === 'tze-24mm' ? '180px' : labelFormat === 'tze-32mm' ? '210px' : '150px'
                }}
              >
                {/* 1. Üstte Karekod (Tam Genişlik) */}
                <div
                  ref={qrRef}
                  className="bg-white p-1 rounded flex items-center justify-center"
                >
                  <QRCodeCanvas
                    value={value}
                    size={labelFormat === 'tze-24mm' ? 140 : labelFormat === 'tze-32mm' ? 170 : 110}
                    level={"M"}
                    includeMargin={false}
                  />
                </div>

                {/* 2. Altta Ortalı 4 Satır Metin */}
                <div className="w-full mt-2 text-center overflow-hidden">
                  {/* Satır 1: Hastane Adı */}
                  <div
                    className="font-bold text-black truncate"
                    style={{ fontSize: '11px', lineHeight: 1.2 }}
                    title={headerTitle}
                  >
                    {headerTitle}
                  </div>

                  {/* Satır 2: Cihaz Adı */}
                  <div
                    className="font-extrabold uppercase text-black truncate mt-0.5"
                    style={{ fontSize: '11px', lineHeight: 1.2 }}
                    title={uppercaseDeviceName}
                  >
                    {uppercaseDeviceName}
                  </div>

                  {/* Satır 3: Künye No (1 tık küçültülmüş, taşmayan net görünüm) */}
                  <div
                    className="font-black text-black tracking-wider my-1"
                    style={{
                      fontFamily: 'monospace, sans-serif',
                      fontSize: '14.5px',
                      lineHeight: 1.15
                    }}
                  >
                    {tagNumber}
                  </div>

                  {/* Satır 4: Bölüm / Servis */}
                  <div
                    className="text-gray-800 font-semibold truncate"
                    style={{ fontSize: '10px', lineHeight: 1.2 }}
                    title={deviceLocation}
                  >
                    {deviceLocation || 'Genel Klinik Servisi'}
                  </div>
                </div>
              </div>

              {/* Kurum Adını Hızlı Düzenleme Butonu / Alanı */}
              <div className="mt-3 w-full max-w-[280px]">
                {isEditingTitle ? (
                  <div className="flex items-center gap-1.5">
                    <input
                      type="text"
                      value={headerTitle}
                      onChange={(e) => setHeaderTitle(e.target.value)}
                      placeholder="Hastane Adı (Örn: Batıkent Hastanesi)"
                      className="flex-1 text-xs px-2.5 py-1.5 rounded-lg border border-blue-400 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={() => setIsEditingTitle(false)}
                      className="px-2 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700"
                    >
                      Tamam
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setIsEditingTitle(true)}
                    className="text-[11px] text-blue-600 dark:text-blue-400 hover:underline flex items-center justify-center gap-1 mx-auto"
                  >
                    <Edit3 className="w-3 h-3" />
                    <span>Kurum Başlığını Değiştir ({headerTitle})</span>
                  </button>
                )}
              </div>
            </div>
          ) : (
            /* Diğer Formatlar İçin Önizleme Kutusu */
            <div className="bg-gray-50 dark:bg-gray-900/60 p-3 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm mb-4 max-w-[340px] mx-auto">
              <div className="bg-white text-black p-3 rounded-lg border border-black shadow flex items-center gap-3 font-sans">
                <div ref={qrRef} className="shrink-0 p-1 bg-white flex items-center justify-center">
                  <QRCodeCanvas value={value} size={180} style={{ width: 85, height: 85 }} level={"M"} includeMargin={false} />
                </div>
                <div className="flex-1 text-left min-w-0">
                  <div className="text-[9px] font-bold truncate">{headerTitle}</div>
                  <div className="text-xs font-black font-mono my-0.5">{tagNumber}</div>
                  <div className="text-[10px] font-bold truncate">{uppercaseDeviceName}</div>
                  <div className="text-[8px] text-gray-600 truncate">{deviceLocation}</div>
                </div>
              </div>
            </div>
          )}

          {/* Format Seçici */}
          <div className="mb-4 text-left">
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
              Etiket & Yazıcı Formatı:
            </label>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {/* Option 1: Brother TZe 24mm DİKEY (Fotoğraftaki Standart) */}
              <button
                type="button"
                onClick={() => setLabelFormat('tze-24mm')}
                className={`p-2.5 rounded-lg border text-left transition-all ${
                  labelFormat === 'tze-24mm'
                    ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 font-semibold ring-2 ring-blue-500/50'
                    : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold">Brother TZe 24mm</span>
                  {labelFormat === 'tze-24mm' && <Check className="w-3.5 h-3.5 text-blue-600" />}
                </div>
                <p className="text-[10px] text-gray-500 dark:text-gray-400 font-normal mt-0.5">
                  Dikey Şerit (Fotoğraftaki Standart)
                </p>
              </button>

              {/* Option 2: Brother TZe 32/36mm DİKEY */}
              <button
                type="button"
                onClick={() => setLabelFormat('tze-32mm')}
                className={`p-2.5 rounded-lg border text-left transition-all ${
                  labelFormat === 'tze-32mm'
                    ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 font-semibold ring-2 ring-blue-500/50'
                    : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold">Brother TZe 32/36mm</span>
                  {labelFormat === 'tze-32mm' && <Check className="w-3.5 h-3.5 text-blue-600" />}
                </div>
                <p className="text-[10px] text-gray-500 dark:text-gray-400 font-normal mt-0.5">
                  Geniş Dikey Şerit Kaset
                </p>
              </button>

              {/* Option 3: Brother TZe 18mm DİKEY */}
              <button
                type="button"
                onClick={() => setLabelFormat('tze-18mm')}
                className={`p-2.5 rounded-lg border text-left transition-all ${
                  labelFormat === 'tze-18mm'
                    ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 font-semibold ring-2 ring-blue-500/50'
                    : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold">Brother TZe 18mm</span>
                  {labelFormat === 'tze-18mm' && <Check className="w-3.5 h-3.5 text-blue-600" />}
                </div>
                <p className="text-[10px] text-gray-500 dark:text-gray-400 font-normal mt-0.5">
                  Dar Dikey Şerit Kaset
                </p>
              </button>

              {/* Option 4: Termal 50x30 mm */}
              <button
                type="button"
                onClick={() => setLabelFormat('thermal-50x30')}
                className={`p-2.5 rounded-lg border text-left transition-all ${
                  labelFormat === 'thermal-50x30'
                    ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 font-semibold ring-2 ring-blue-500/50'
                    : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span>Termal (50x30 mm)</span>
                  {labelFormat === 'thermal-50x30' && <Check className="w-3.5 h-3.5 text-blue-600" />}
                </div>
                <p className="text-[10px] text-gray-500 dark:text-gray-400 font-normal mt-0.5">
                  Zebra / TSC Standart Rulo
                </p>
              </button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-3 mb-3">
            <button
              type="button"
              onClick={printQRCode}
              className="flex items-center justify-center space-x-2 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold rounded-xl shadow-md transition-all text-xs sm:text-sm active:scale-95"
            >
              <Printer className="h-4 w-4" />
              <span>Etiketi Yazdır</span>
            </button>

            <button
              type="button"
              onClick={downloadQRCode}
              className="flex items-center justify-center space-x-2 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 font-medium rounded-xl transition-all text-xs sm:text-sm active:scale-95"
            >
              <Download className="h-4 w-4" />
              <span>Görseli İndir</span>
            </button>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-full py-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 font-medium text-xs transition-colors"
          >
            Kapat
          </button>
        </div>
      </div>
    </div>
  )
}
