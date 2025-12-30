import { prisma } from './prisma'

/**
 * Cihaz için uptime/downtime hesapla
 */
export async function calculateDeviceUptime(deviceId: string, startDate: Date, endDate: Date) {
  // Bakım kayıtlarını getir
  const maintenanceRecords = await prisma.maintenanceRecord.findMany({
    where: {
      deviceId,
      scheduledDate: {
        gte: startDate,
        lte: endDate
      },
      isActiveRepair: true
    },
    orderBy: { scheduledDate: 'asc' }
  })

  // Uptime kayıtlarını getir
  const uptimeRecords = await prisma.deviceUptime.findMany({
    where: {
      deviceId,
      startDate: {
        gte: startDate,
        lte: endDate
      }
    },
    orderBy: { startDate: 'asc' }
  })

  const totalSeconds = (endDate.getTime() - startDate.getTime()) / 1000
  let downtimeSeconds = 0

  // Aktif onarım sürelerini hesapla
  for (const record of maintenanceRecords) {
    const repairStart = record.repairStartDate || record.scheduledDate
    const repairEnd = record.repairEndDate || record.completedDate || endDate

    if (repairStart && repairEnd) {
      const repairSeconds = (repairEnd.getTime() - repairStart.getTime()) / 1000
      downtimeSeconds += Math.max(0, repairSeconds)
    }
  }

  // Downtime kayıtlarından hesapla
  for (const record of uptimeRecords) {
    if (record.status === 'DOWNTIME' || record.status === 'MAINTENANCE') {
      const recordStart = record.startDate
      const recordEnd = record.endDate || endDate
      const recordSeconds = (recordEnd.getTime() - recordStart.getTime()) / 1000
      downtimeSeconds += Math.max(0, recordSeconds)
    }
  }

  const uptimeSeconds = totalSeconds - downtimeSeconds
  const uptimePercentage = totalSeconds > 0 ? (uptimeSeconds / totalSeconds) * 100 : 0

  return {
    totalSeconds: Math.round(totalSeconds),
    uptimeSeconds: Math.round(uptimeSeconds),
    downtimeSeconds: Math.round(downtimeSeconds),
    uptimePercentage: Math.round(uptimePercentage * 100) / 100,
    uptimeHours: Math.round(uptimeSeconds / 3600 * 100) / 100,
    downtimeHours: Math.round(downtimeSeconds / 3600 * 100) / 100,
    totalHours: Math.round(totalSeconds / 3600 * 100) / 100
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
