import { NextResponse } from 'next/server'
import { saveFile } from '@/lib/storage'

// POST /api/training-sessions/upload - Upload Training Document
export async function POST(request: Request) {
    try {
        const formData = await request.formData()
        const file = formData.get('file') as File
        const trainingTitle = formData.get('trainingTitle') as string || 'Genel'

        if (!file) {
            return NextResponse.json(
                { error: 'Dosya yüklenmedi' },
                { status: 400 }
            )
        }

        const savedFile = await saveFile(file, 'egitim-dokumanlari', trainingTitle)

        return NextResponse.json({
            message: 'Dosya başarıyla yüklendi',
            filename: savedFile.filename,
            originalName: file.name,
            filesize: savedFile.size,
            mimetype: savedFile.mimetype,
            path: savedFile.filepath // Stores relative path: egitim-dokumanlari/Title/uuid-filename
        })
    } catch (error) {
        console.error('Error uploading file:', error)
        return NextResponse.json(
            { error: 'Dosya yüklenirken hata oluştu' },
            { status: 500 }
        )
    }
}
