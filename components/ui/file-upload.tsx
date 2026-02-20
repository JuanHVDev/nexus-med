'use client'

import { useState, useCallback } from 'react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { Upload, X, FileText, Image as ImageIcon, Loader2, Download } from 'lucide-react'
import { toast } from 'sonner'

interface FileUploadProps {
  onUpload: (url: string, fileName: string) => void
  onDelete?: () => void
  accept?: string
  maxSize?: number
  currentFile?: {
    url: string
    name: string
  }
  folder: 'lab-results' | 'imaging-reports' | 'imaging-images'
  disabled?: boolean
}

export function FileUpload({
  onUpload,
  onDelete,
  accept = '.pdf,.jpg,.jpeg,.png',
  maxSize = 5,
  currentFile,
  folder,
  disabled = false,
}: FileUploadProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  const isImage = (fileName: string) => {
    const ext = fileName.toLowerCase().split('.').pop()
    return ['jpg', 'jpeg', 'png'].includes(ext || '')
  }

  const handleFile = useCallback(async (file: File) => {
    if (disabled) return

    const maxSizeBytes = maxSize * 1024 * 1024
    if (file.size > maxSizeBytes) {
      toast.error(`El archivo excede el tamano maximo de ${maxSize}MB`)
      return
    }

    setIsUploading(true)

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('folder', folder)

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Error al subir archivo')
      }

      const result = await response.json()
      
      if (isImage(file.name)) {
        setPreviewUrl(result.url)
      }

      onUpload(result.url, result.fileName)
      toast.success('Archivo subido correctamente')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error al subir archivo')
    } finally {
      setIsUploading(false)
    }
  }, [folder, maxSize, onUpload, disabled])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)

    const file = e.dataTransfer.files[0]
    if (file) {
      handleFile(file)
    }
  }, [handleFile])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    if (!disabled) {
      setIsDragging(true)
    }
  }, [disabled])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleFile(file)
    }
  }, [handleFile])

  const handleDelete = async () => {
    if (!currentFile || !onDelete) return

    try {
      const response = await fetch('/api/upload', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: currentFile.url }),
      })

      if (!response.ok) {
        throw new Error('Error al eliminar archivo')
      }

      setPreviewUrl(null)
      onDelete()
      toast.success('Archivo eliminado')
    } catch {
      toast.error('Error al eliminar archivo')
    }
  }

  if (currentFile) {
    const isImageFile = isImage(currentFile.name)
    const displayUrl = previewUrl || currentFile.url

    return (
      <div className="border rounded-lg p-4 bg-muted/50">
        <div className="flex items-center gap-4">
          {isImageFile && displayUrl ? (
            <div className="relative w-20 h-20 rounded-md overflow-hidden bg-muted">
              <Image
                src={displayUrl}
                alt={currentFile.name}
                fill
                className="object-cover"
                unoptimized
              />
            </div>
          ) : (
            <div className="w-20 h-20 rounded-md bg-muted flex items-center justify-center">
              <FileText className="h-8 w-8 text-muted-foreground" />
            </div>
          )}

          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{currentFile.name}</p>
            <p className="text-xs text-muted-foreground">
              {isImageFile ? 'Imagen' : 'PDF'}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              asChild
            >
              <a href={currentFile.url} target="_blank" rel="noopener noreferrer">
                {isImageFile ? <ImageIcon className="h-4 w-4 mr-1" /> : <Download className="h-4 w-4 mr-1" />}
                Ver
              </a>
            </Button>
            {onDelete && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleDelete}
                disabled={disabled}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div
      className={cn(
        'border-2 border-dashed rounded-lg p-8 text-center transition-colors',
        isDragging && 'border-primary bg-primary/5',
        disabled && 'opacity-50 cursor-not-allowed'
      )}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
    >
      <input
        type="file"
        accept={accept}
        onChange={handleInputChange}
        disabled={disabled || isUploading}
        className="hidden"
        id="file-upload"
      />

      <label
        htmlFor="file-upload"
        className={cn(
          'cursor-pointer',
          disabled && 'cursor-not-allowed'
        )}
      >
        <div className="flex flex-col items-center gap-2">
          {isUploading ? (
            <Loader2 className="h-10 w-10 text-muted-foreground animate-spin" />
          ) : (
            <Upload className="h-10 w-10 text-muted-foreground" />
          )}

          <div className="space-y-1">
            <p className="text-sm font-medium">
              {isUploading ? 'Subiendo archivo...' : 'Arrastra un archivo o haz clic para seleccionar'}
            </p>
            <p className="text-xs text-muted-foreground">
              PDF, JPG o PNG (max. {maxSize}MB)
            </p>
          </div>
        </div>
      </label>
    </div>
  )
}
