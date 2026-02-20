import { put, del } from '@vercel/blob'

const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB

const ALLOWED_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/jpg',
  'image/png',
]

const ALLOWED_EXTENSIONS = ['.pdf', '.jpg', '.jpeg', '.png']

export interface UploadResult {
  url: string
  fileName: string
}

export interface UploadError {
  error: string
}

export function validateFile(file: File): { valid: boolean; error?: string } {
  if (!file) {
    return { valid: false, error: 'No se proporciono ningun archivo' }
  }

  if (file.size > MAX_FILE_SIZE) {
    return { valid: false, error: `El archivo excede el tamano maximo de 5MB` }
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return { valid: false, error: 'Tipo de archivo no permitido. Solo PDF, JPG, PNG' }
  }

  const extension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'))
  if (!ALLOWED_EXTENSIONS.includes(extension)) {
    return { valid: false, error: 'Extension de archivo no permitida' }
  }

  return { valid: true }
}

export async function uploadFile(
  file: File,
  folder: 'lab-results' | 'imaging-reports' | 'imaging-images'
): Promise<UploadResult> {
  const validation = validateFile(file)
  if (!validation.valid) {
    throw new Error(validation.error)
  }

  const timestamp = Date.now()
  const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
  const fileName = `${folder}/${timestamp}-${sanitizedName}`

  const blob = await put(fileName, file, {
    access: 'public',
  })

  return {
    url: blob.url,
    fileName: file.name,
  }
}

export async function deleteFile(url: string): Promise<void> {
  await del(url)
}

export function getFileExtension(fileName: string): string {
  return fileName.toLowerCase().substring(fileName.lastIndexOf('.'))
}

export function isImageFile(fileName: string): boolean {
  const extension = getFileExtension(fileName)
  return ['.jpg', '.jpeg', '.png'].includes(extension)
}

export function isPdfFile(fileName: string): boolean {
  const extension = getFileExtension(fileName)
  return extension === '.pdf'
}
