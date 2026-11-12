import { NextResponse } from 'next/server'
import { writeFile, mkdir, readFile } from 'fs/promises'
import { existsSync } from 'fs'
import path from 'path'
import { v4 as uuidv4 } from 'uuid'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

const MANIFEST_PATH = path.join(process.cwd(), 'uploads', 'files-manifest.json')
const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads', 'documents')

async function getManifest(): Promise<any[]> {
    try {
        if (existsSync(MANIFEST_PATH)) {
            const raw = await readFile(MANIFEST_PATH, 'utf-8')
            return JSON.parse(raw)
        }
    } catch (e) {
        console.error('Failed to read files manifest:', e)
    }
    return []
}

async function saveManifest(data: any[]) {
    const dir = path.dirname(MANIFEST_PATH)
    if (!existsSync(dir)) {
        await mkdir(dir, { recursive: true })
    }
    await writeFile(MANIFEST_PATH, JSON.stringify(data, null, 2), 'utf-8')
}

export async function POST(request: Request) {
    try {
        const session = await getServerSession(authOptions)
        const formData = await request.formData()
        const file = formData.get('file') as File | null
        const category = (formData.get('category') as string) || 'other'
        const deviceId = (formData.get('deviceId') as string) || undefined

        if (!file) {
            return NextResponse.json({ message: 'Dosya seçilmedi' }, { status: 400 })
        }

        if (!existsSync(UPLOAD_DIR)) {
            await mkdir(UPLOAD_DIR, { recursive: true })
        }

        const buffer = Buffer.from(await file.arrayBuffer())
        const originalName = file.name
        const sanitizedFilename = originalName.replace(/[^a-zA-Z0-9.-]/g, '_')
        const fileId = uuidv4()
        const storedFilename = `${fileId}-${sanitizedFilename}`
        const fullPath = path.join(UPLOAD_DIR, storedFilename)

        await writeFile(fullPath, buffer)

        let deviceName: string | undefined = undefined
        if (deviceId) {
            try {
                const dev = await prisma.device.findUnique({
                    where: { id: deviceId },
                    select: { name: true, brand: true }
                })
                if (dev) {
                    deviceName = `${dev.name} - ${dev.brand || ''}`
                }
            } catch (e) {
                // Ignore device lookup error
            }
        }

        const newFile = {
            id: fileId,
            fileName: originalName,
            fileType: file.type || 'application/octet-stream',
            filePath: `/uploads/documents/${storedFilename}`,
            fileSize: file.size,
            uploadedAt: new Date().toISOString(),
            uploadedBy: session?.user?.name || session?.user?.email || 'Kullanıcı',
            deviceId: deviceId || undefined,
            deviceName,
            category
        }

        const manifest = await getManifest()
        manifest.unshift(newFile)
        await saveManifest(manifest)

        return NextResponse.json({
            success: true,
            file: newFile,
            message: 'Dosya başarıyla yüklendi'
        })
    } catch (error: any) {
        console.error('File upload error:', error)
        return NextResponse.json({ message: error?.message || 'Dosya yüklenemedi' }, { status: 500 })
    }
}
