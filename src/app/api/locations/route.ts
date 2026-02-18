import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/locations - Tüm lokasyonları listele
export async function GET() {
    try {
        let locations = await prisma.location.findMany({
            orderBy: {
                name: 'asc',
            },
        })

        // If we have fewer locations than the demo data (indicating incomplete setup),
        // or if we want to ensure all standard departments exist:
        const { demoLocations } = await import('@/lib/demo-data')

        if (locations.length < demoLocations.length) {
            console.log('Syncing missing locations...')

            // Get existing location names for quick lookup
            const existingNames = new Set(locations.map(l => l.name))

            const locationsToCreate = []
            let nextCodeIndex = locations.length + 1

            for (const demoLoc of demoLocations) {
                if (!existingNames.has(demoLoc.name)) {
                    locationsToCreate.push({
                        name: demoLoc.name,
                        code: `LOC-${nextCodeIndex.toString().padStart(3, '0')}`,
                        description: demoLoc.name
                    })
                    nextCodeIndex++
                }
            }

            if (locationsToCreate.length > 0) {
                await prisma.location.createMany({
                    data: locationsToCreate
                })

                // Fetch again after syncing
                locations = await prisma.location.findMany({
                    orderBy: {
                        name: 'asc',
                    },
                })
            }
        }

        return NextResponse.json(locations)
    } catch (error) {
        console.error('Error fetching locations:', error)
        return NextResponse.json(
            { error: 'Lokasyonlar yüklenirken hata oluştu' },
            { status: 500 }
        )
    }
}
