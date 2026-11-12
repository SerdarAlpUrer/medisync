import { NextResponse } from 'next/server'
import { saveFile } from '@/lib/storage'

// POST /api/contracts/upload - Upload Contract Document
export async function POST(request: Request) {
    try {
        const formData = await request.formData()
        const file = formData.get('file') as File
        const contractName = formData.get('contractName') as string || 'Genel'

        if (!file) {
            return NextResponse.json(
                { error: 'Dosya yüklenmedi' },
                { status: 400 }
            )
        }

        // Save using centralized storage
        // Module: 'sozlesmeler', Entity: Contract Name
        const savedFile = await saveFile(file, 'sozlesmeler', contractName)

        return NextResponse.json({
            message: 'Dosya başarıyla yüklendi',
            path: savedFile.filepath // Stores relative path: sozlesmeler/ContractName/uuid-filename
        })
    } catch (error) {
        console.error('Error uploading file:', error)
        return NextResponse.json(
            { error: 'Dosya yüklenirken hata oluştu' },
            { status: 500 }
        )
    }
}
