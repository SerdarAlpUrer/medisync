
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    const devices = await prisma.device.findMany({
        select: { name: true },
        distinct: ['name']
    })
    console.log('Existing Device Names:', JSON.stringify(devices.map(d => d.name), null, 2))
}

main()
    .catch(e => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
