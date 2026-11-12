import { mkdir, writeFile } from 'fs/promises'
import path from 'path'
import { v4 as uuidv4 } from 'uuid'

// Centralized uploads root (Secure, not public)
const UPLOADS_ROOT = path.join(process.cwd(), 'uploads')

// Legacy paths for backward compatibility
const LEGACY_PATHS = {
    contracts: path.join(process.cwd(), 'sozlesmeler'),
    training: path.join(process.cwd(), 'egitim-dokumanlari')
}

export type UploadModule = 'sozlesmeler' | 'egitim-dokumanlari' | 'kalibrasyon-dokumanlari'

/**
 * Saves a file to the structured uploads directory.
 * Structure: uploads/[Module]/[EntityName]/[UUID-Filename]
 * Returns the relative path to be stored in the database.
 */
export async function saveFile(
    file: File,
    moduleName: UploadModule,
    entityName: string
): Promise<{ filepath: string, filename: string, size: number, mimetype: string }> {

    const buffer = Buffer.from(await file.arrayBuffer())
    const originalName = file.name
    const sanitizedFilename = originalName.replace(/[^a-zA-Z0-9.-]/g, '_')
    const uniqueFilename = `${uuidv4()}-${sanitizedFilename}`

    // Sanitize folder name (remove dangerous chars)
    const safeEntityName = entityName.replace(/[^a-zA-Z0-9-_\sğüşıöçĞÜŞİÖÇ]/g, '').trim() || 'Genel'

    // Construct target directory: uploads/module/entity
    const uploadDir = path.join(UPLOADS_ROOT, moduleName, safeEntityName)

    // Ensure directory exists
    await mkdir(uploadDir, { recursive: true })

    // Full system path for writing
    const fullPath = path.join(uploadDir, uniqueFilename)
    await writeFile(fullPath, buffer)

    // Relative path to store in DB: module/entity/filename
    // Note: We perform path normalization to ensure forward slashes for DB consistency if needed, 
    // but Windows separators are usually fine if handled correctly. 
    // For URL usage, forward slashes are better.
    const relativePath = path.join(moduleName, safeEntityName, uniqueFilename).split(path.sep).join('/')

    return {
        filepath: relativePath,
        filename: uniqueFilename, // Keeping the unique filename as "filename" for display/download if needed, or we can use originalName
        size: file.size,
        mimetype: file.type
    }
}

/**
 * Resolves the full system path for a given file path.
 * Handles both new structured paths and legacy paths.
 */
export function getAbsoluteFilePath(storedPath: string, moduleName: UploadModule): string {
    // Check if it's a new structure path (contains slashes and starts with module name)
    // Actually, storedPath from new system includes module name: "sozlesmeler/Bakim/file.pdf"

    // New check: does it look like "module/..."?
    if (storedPath.includes('/') || storedPath.includes('\\')) {
        return path.join(UPLOADS_ROOT, storedPath)
    }

    // Fallback to legacy path
    if (moduleName === 'sozlesmeler') {
        return path.join(LEGACY_PATHS.contracts, storedPath)
    }
    if (moduleName === 'egitim-dokumanlari') {
        return path.join(LEGACY_PATHS.training, storedPath)
    }

    return path.join(UPLOADS_ROOT, storedPath)
}
