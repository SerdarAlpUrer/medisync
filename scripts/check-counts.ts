
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    try {
        const deviceCount = await prisma.device.count()
        const unmatchedCount = await prisma.unmatchedCalibration.count()
        const calibrationCount = await prisma.calibrationRecord.count()

        console.log('--- Database Counts ---')
        console.log(`Devices: ${deviceCount}`)
        console.log(`Unmatched Calibrations: ${unmatchedCount}`)
        console.log(`Calibration Records: ${calibrationCount}`)

        // Also check if there are devices created recently (today)
        const today = new Date()
        today.setHours(0, 0, 0, 0)

        const newDevices = await prisma.device.count({
            where: {
                createdAt: {
                    gte: today
                }
            }
        })
        console.log(`Devices created today: ${newDevices}`)

    } catch (error) {
        console.error('Error checking counts:', error)
    } finally {
        await prisma.$disconnect()
    }
}

main()
