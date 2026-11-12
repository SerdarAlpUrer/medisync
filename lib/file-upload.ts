/**
 * File Upload Service
 * Handles secure file uploads with validation
 */

import { logger } from './logger'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'

export interface FileUploadOptions {
  maxSize?: number // in bytes
  allowedTypes?: string[]
  destination?: string
}

export interface UploadedFile {
  filename: string
  path: string
  size: number
  mimetype: string
  url: string
}

/**
 * Validate file before upload
 */
export function validateFile(
  file: File,
  options: FileUploadOptions = {}
): { valid: boolean; error?: string } {
  const maxSize = options.maxSize || 10 * 1024 * 1024 // 10MB default
  const allowedTypes = options.allowedTypes || [
    'image/jpeg',
    'image/png',
    'image/gif',
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
    'application/vnd.ms-excel', // .xls
  ]

  if (file.size > maxSize) {
    return {
      valid: false,
      error: `Dosya boyutu çok büyük. Maksimum: ${Math.round(maxSize / 1024 / 1024)}MB`,
    }
  }

  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: `Dosya tipi desteklenmiyor. İzin verilen tipler: ${allowedTypes.join(', ')}`,
    }
  }

  return { valid: true }
}

/**
 * Upload file to server
 */
export async function uploadFile(
  file: File,
  options: FileUploadOptions = {}
): Promise<UploadedFile> {
  const validation = validateFile(file, options)
  if (!validation.valid) {
    throw new Error(validation.error)
  }

  const destination = options.destination || 'uploads'
  const uploadDir = join(process.cwd(), 'public', destination)

  // Create directory if it doesn't exist
  if (!existsSync(uploadDir)) {
    await mkdir(uploadDir, { recursive: true })
  }

  // Generate unique filename
  const timestamp = Date.now()
  const randomString = Math.random().toString(36).substring(2, 15)
  const extension = file.name.split('.').pop()
  const filename = `${timestamp}-${randomString}.${extension}`
  const filepath = join(uploadDir, filename)

  // Convert File to Buffer and save
  const bytes = await file.arrayBuffer()
  const buffer = Buffer.from(bytes)

  await writeFile(filepath, buffer)

  logger.info('File uploaded', {
    filename,
    size: file.size,
    mimetype: file.type,
  })

  return {
    filename,
    path: filepath,
    size: file.size,
    mimetype: file.type,
    url: `/${destination}/${filename}`,
  }
}

/**
 * Delete uploaded file
 */
export async function deleteFile(filepath: string): Promise<boolean> {
  try {
    const { unlink } = await import('fs/promises')
    await unlink(filepath)
    logger.info('File deleted', { filepath })
    return true
  } catch (error) {
    logger.error('Failed to delete file', error as Error, { filepath })
    return false
  }
}

