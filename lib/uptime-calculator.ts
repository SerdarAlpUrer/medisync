import { prisma } from './prisma'

/**
 * Cihaz için uptime/downtime hesapla
 */
export async function calculateDeviceUptime(deviceId: string, startDate: Date, endDate: Date) {
  // Bakım ve Arıza Onarım kayıtlarını getir
  const maintenanceRecords = await prisma.maintenanceRecord.findMany({
    where: {
      deviceId,
      scheduledDate: {
        lte: endDate
      },
      OR: [
        { isActiveRepair: true },
        { type: 'CORRECTIVE' },
        { type: 'EMERGENCY' },
        { duration: { gt: 0 } },
        { repairStartDate: { not: null } }
      ]
    },
    orderBy: { scheduledDate: 'asc' }
  })

  // İş emirleri (Arıza ve Acil Çağrılar)
  const workOrders = await prisma.workOrder.findMany({
    where: {
      deviceId,
      createdAt: {
        lte: endDate
      },
      OR: [
        { type: 'CORRECTIVE' },
        { type: 'EMERGENCY' },
        { startedAt: { not: null } },
        { laborHours: { gt: 0 } }
      ]
    },
    orderBy: { createdAt: 'asc' }
  })

  // Uptime kayıtlarını getir
  const uptimeRecords = await prisma.deviceUptime.findMany({
    where: {
      deviceId,
      startDate: {
        lte: endDate
      }
    },
    orderBy: { startDate: 'asc' }
  })

  const windowStartMs = startDate.getTime()
  const windowEndMs = endDate.getTime()
  const totalSeconds = Math.max(0, (windowEndMs - windowStartMs) / 1000)

  // Overlapping downtime aralıklarını birleştirmek için aralık listesi
  const intervals: Array<[number, number]> = []
  let totalFailures = 0

  // 1. Bakım / Arıza onarım sürelerini hesapla
  for (const record of maintenanceRecords) {
    totalFailures++
    const rawStart = record.repairStartDate || record.scheduledDate
    let rawEnd = record.repairEndDate || record.completedDate

    // Eğer manuel süre (dakika) girilmiş ve bitiş saati yoksa:
    if (rawStart && !rawEnd && record.duration && record.duration > 0) {
      rawEnd = new Date(rawStart.getTime() + record.duration * 60 * 1000)
    }

    if (rawStart && !rawEnd) {
      rawEnd = record.status === 'COMPLETED' ? rawStart : endDate
    }

    if (rawStart && rawEnd) {
      const clampedStart = Math.max(windowStartMs, rawStart.getTime())
      const clampedEnd = Math.min(windowEndMs, rawEnd.getTime())
      if (clampedEnd > clampedStart) {
        intervals.push([clampedStart, clampedEnd])
      }
    }
  }

  // 2. İş Emri Arıza sürelerini hesapla
  for (const wo of workOrders) {
    totalFailures++
    const rawStart = wo.startedAt || wo.scheduledDate || wo.createdAt
    let rawEnd = wo.completedAt

    // Eğer işçilik saati girilmişse ve bitiş saati yoksa:
    if (rawStart && !rawEnd && wo.laborHours && wo.laborHours > 0) {
      rawEnd = new Date(rawStart.getTime() + wo.laborHours * 3600 * 1000)
    }

    if (rawStart && !rawEnd) {
      rawEnd = wo.status === 'COMPLETED' ? rawStart : endDate
    }

    if (rawStart && rawEnd) {
      const clampedStart = Math.max(windowStartMs, rawStart.getTime())
      const clampedEnd = Math.min(windowEndMs, rawEnd.getTime())
      if (clampedEnd > clampedStart) {
        intervals.push([clampedStart, clampedEnd])
      }
    }
  }

  // 3. Doğrudan DeviceUptime log kayıtlarından hesapla
  for (const record of uptimeRecords) {
    if (record.status === 'DOWNTIME' || record.status === 'MAINTENANCE') {
      const rawStart = record.startDate
      const rawEnd = record.endDate || endDate
      const clampedStart = Math.max(windowStartMs, rawStart.getTime())
      const clampedEnd = Math.min(windowEndMs, rawEnd.getTime())
      if (clampedEnd > clampedStart) {
        intervals.push([clampedStart, clampedEnd])
      }
    }
  }

  // Çakışan aralıkları birleştir (merge overlapping intervals)
  intervals.sort((a, b) => a[0] - b[0])
  const merged: Array<[number, number]> = []
  for (const interval of intervals) {
    if (merged.length === 0 || merged[merged.length - 1][1] < interval[0]) {
      merged.push([...interval])
    } else {
      merged[merged.length - 1][1] = Math.max(merged[merged.length - 1][1], interval[1])
    }
  }

  let downtimeSeconds = 0
  for (const [s, e] of merged) {
    downtimeSeconds += (e - s) / 1000
  }

  downtimeSeconds = Math.min(totalSeconds, Math.max(0, downtimeSeconds))
  const uptimeSeconds = Math.max(0, totalSeconds - downtimeSeconds)
  const uptimePercentage = totalSeconds > 0 ? (uptimeSeconds / totalSeconds) * 100 : 100
  const downtimePercentage = totalSeconds > 0 ? (downtimeSeconds / totalSeconds) * 100 : 0

  const uptimeHours = Math.round(uptimeSeconds / 3600 * 100) / 100
  const downtimeHours = Math.round(downtimeSeconds / 3600 * 100) / 100
  const totalHours = Math.round(totalSeconds / 3600 * 100) / 100

  // MTTR (Mean Time to Repair - Ortalama Onarım Süresi)
  const mttrHours = totalFailures > 0 ? Math.round((downtimeHours / totalFailures) * 10) / 10 : 0
  // MTBF (Mean Time Between Failures - Arızalar Arası Ortalama Süre)
  const mtbfHours = totalFailures > 0 ? Math.round((uptimeHours / totalFailures) * 10) / 10 : uptimeHours

  return {
    totalSeconds: Math.round(totalSeconds),
    uptimeSeconds: Math.round(uptimeSeconds),
    downtimeSeconds: Math.round(downtimeSeconds),
    uptimePercentage: Math.round(uptimePercentage * 100) / 100,
    downtimePercentage: Math.round(downtimePercentage * 100) / 100,
    uptimeHours,
    downtimeHours,
    totalHours,
    totalFailures,
    mttrHours,
    mtbfHours
  }
}

/**
 * Cihaz için uptime kaydı oluştur
 */
export async function createUptimeRecord(
  deviceId: string,
  status: 'ACTIVE' | 'DOWNTIME' | 'MAINTENANCE',
  startDate: Date,
  reason?: string,
  maintenanceRecordId?: string
) {
  return await prisma.deviceUptime.create({
    data: {
      deviceId,
      status,
      startDate,
      reason,
      maintenanceRecordId,
      totalSeconds: null // Sonradan hesaplanacak
    }
  })
}

/**
 * Uptime kaydını kapat
 */
export async function closeUptimeRecord(uptimeRecordId: string, endDate: Date) {
  const record = await prisma.deviceUptime.findUnique({
    where: { id: uptimeRecordId }
  })

  if (!record) {
    throw new Error('Uptime record not found')
  }

  const totalSeconds = Math.round((endDate.getTime() - record.startDate.getTime()) / 1000)

  return await prisma.deviceUptime.update({
    where: { id: uptimeRecordId },
    data: {
      endDate,
      totalSeconds
    }
  })
}

/**
 * Bakım kaydı için otomatik uptime/downtime kaydı oluştur
 */
export async function createMaintenanceUptimeRecords(maintenanceRecordId: string) {
  const maintenance = await prisma.maintenanceRecord.findUnique({
    where: { id: maintenanceRecordId },
    include: { device: true }
  })

  if (!maintenance) {
    throw new Error('Maintenance record not found')
  }

  // Eğer aktif onarım ise, downtime kaydı oluştur
  if (maintenance.isActiveRepair) {
    const startDate = maintenance.repairStartDate || maintenance.scheduledDate
    await createUptimeRecord(
      maintenance.deviceId,
      'MAINTENANCE',
      startDate,
      `Bakım: ${maintenance.description}`,
      maintenanceRecordId
    )
  }

  return { success: true }
}
