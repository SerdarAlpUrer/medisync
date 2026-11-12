import { NextResponse } from 'next/server'
import { readFile, writeFile, unlink } from 'fs/promises'
import { existsSync } from 'fs'
import path from 'path'
import { prisma } from '@/lib/prisma'

const MANIFEST_PATH = path.join(process.cwd(), 'uploads', 'files-manifest.json')
const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads', 'documents')

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params

        // 1. Check if it's a contract document
        if (id.startsWith('contract-')) {
            const contractId = id.replace('contract-', '')
            await prisma.contract.update({
                where: { id: contractId },
                data: { documentPath: null }
            })
            return NextResponse.json({ success: true, message: 'Sözleşme belgesi kaldırıldı' })
        }

        // 2. Check if it's a TrainingDocument in Prisma
        const trainingDoc = await prisma.trainingDocument.findUnique({ where: { id } }).catch(() => null)
        if (trainingDoc) {
            await prisma.trainingDocument.delete({ where: { id } })
            return NextResponse.json({ success: true, message: 'Eğitim belgesi silindi' })
        }

        // 3. Otherwise delete from files-manifest.json
        if (!existsSync(MANIFEST_PATH)) {
            return NextResponse.json({ error: 'Dosya bulunamadı' }, { status: 404 })
        }

        const raw = await readFile(MANIFEST_PATH, 'utf-8')
        const manifest: any[] = JSON.parse(raw)

        const fileIndex = manifest.findIndex(f => f.id === id)
        if (fileIndex === -1) {
            return NextResponse.json({ error: 'Dosya bulunamadı' }, { status: 404 })
        }

        const fileItem = manifest[fileIndex]

        // Delete physical file if it exists
        if (fileItem.filePath && fileItem.filePath.startsWith('/uploads/documents/')) {
            const fileName = fileItem.filePath.replace('/uploads/documents/', '')
            const fullPath = path.join(UPLOAD_DIR, fileName)
            if (existsSync(fullPath)) {
                try {
                    await unlink(fullPath)
                } catch (e) {
                    console.warn('Could not delete physical file:', e)
                }
            }
        }

        manifest.splice(fileIndex, 1)
        await writeFile(MANIFEST_PATH, JSON.stringify(manifest, null, 2), 'utf-8')

        return NextResponse.json({ success: true, message: 'Dosya silindi' })
    } catch (error: any) {
        console.error('File delete error:', error)
        return NextResponse.json({ error: 'Dosya silinemedi' }, { status: 500 })
    }
}
