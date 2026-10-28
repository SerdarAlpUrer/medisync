import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logger'
import { getAuthenticatedUser } from '@/lib/auth-middleware'
import { readFile } from 'fs/promises'
import { existsSync } from 'fs'
import path from 'path'

const MANIFEST_PATH = path.join(process.cwd(), 'uploads', 'files-manifest.json')

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url)
        const deviceId = searchParams.get('deviceId')
        const category = searchParams.get('category')
        let hospitalId = searchParams.get('hospitalId')

        try {
            const user = await getAuthenticatedUser()
            if (user?.hospitalId) {
                hospitalId = user.hospitalId
            }
        } catch { }

        const allFiles: any[] = []

        // 1. Read files uploaded via Files management
        if (existsSync(MANIFEST_PATH)) {
            try {
                const raw = await readFile(MANIFEST_PATH, 'utf-8')
                const uploadedFiles = JSON.parse(raw)
                if (Array.isArray(uploadedFiles)) {
                    allFiles.push(...uploadedFiles)
                }
            } catch (e) {
                console.error('Error reading files manifest:', e)
            }
        }

        // 2. Aggregate Training Documents
        try {
            const trainingDocs = await prisma.trainingDocument.findMany({
                where: hospitalId ? { session: { hospitalId } } : undefined,
                include: {
                    session: {
                        select: { title: true, trainingDate: true }
                    }
                },
                take: 100
            })

            for (const doc of trainingDocs) {
                allFiles.push({
                    id: doc.id,
                    fileName: doc.filename,
                    fileType: doc.mimetype || 'application/pdf',
                    filePath: `/api/training-sessions/documents/${doc.filepath}`,
                    fileSize: doc.filesize,
                    uploadedAt: doc.session?.trainingDate?.toISOString() || new Date().toISOString(),
                    uploadedBy: 'Eğitim Birimi',
                    category: 'other',
                    deviceName: doc.session?.title ? `Eğitim: ${doc.session.title}` : undefined
                })
            }
        } catch (e) {
            // Training docs lookup fallback
        }

        // 3. Aggregate Contract Documents
        try {
            const contracts = await prisma.contract.findMany({
                where: {
                    documentPath: { not: null },
                    ...(hospitalId ? { hospitalId } : {})
                },
                include: { supplier: { select: { name: true } } },
                take: 100
            })

            for (const c of contracts) {
                if (c.documentPath) {
                    allFiles.push({
                        id: `contract-${c.id}`,
                        fileName: path.basename(c.documentPath),
                        fileType: 'application/pdf',
                        filePath: `/api/contracts/documents/${c.documentPath}`,
                        fileSize: 0,
                        uploadedAt: c.createdAt?.toISOString() || new Date().toISOString(),
                        uploadedBy: c.supplier?.name || 'Tedarikçi',
                        category: 'warranty',
                        deviceName: `Sözleşme: ${c.name}`
                    })
                }
            }
        } catch (e) {
            // Contract docs lookup fallback
        }

        // Apply filters if provided
        let filteredFiles = allFiles
        if (deviceId) {
            filteredFiles = filteredFiles.filter(f => f.deviceId === deviceId)
        }
        if (category && category !== 'ALL') {
            filteredFiles = filteredFiles.filter(f => f.category === category)
        }

        return NextResponse.json({ files: filteredFiles })
    } catch (error) {
        logger.error('Error fetching files:', error as Error)
        return NextResponse.json({ error: 'Dosyalar yüklenemedi' }, { status: 500 })
    }
}
