'use client'

import { useState, useCallback } from 'react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { Camera, X, Loader2, User } from 'lucide-react'
import { toast } from 'sonner'

interface PatientPhotoProps {
  currentPhotoUrl?: string | null
  currentPhotoName?: string | null
  onUpload: (url: string, fileName: string) => void
  onDelete?: () => void
  disabled?: boolean
  size?: 'sm' | 'md' | 'lg'
}

const sizeClasses = {
  sm: 'h-16 w-16',
  md: 'h-24 w-24',
  lg: 'h-32 w-32',
}

const iconSizes = {
  sm: 'h-6 w-6',
  md: 'h-8 w-8',
  lg: 'h-10 w-10',
}

export function PatientPhoto({
  currentPhotoUrl,
  onUpload,
  onDelete,
  disabled = false,
  size = 'md',
}: PatientPhotoProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  const handleFile = useCallback(async (file: File) => {
    if (disabled) return

    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png']
    const maxSize = 2 * 1024 * 1024

    if (!allowedTypes.includes(file.type)) {
      toast.error('Solo se permiten imagenes JPG o PNG')
      return
    }

    if (file.size > maxSize) {
      toast.error('La imagen no puede exceder 2MB')
      return
    }

    setIsUploading(true)

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('folder', 'patient-photos')

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Error al subir imagen')
      }

      const result = await response.json()
      setPreviewUrl(result.url)
      onUpload(result.url, result.fileName)
      toast.success('Foto actualizada')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error al subir imagen')
    } finally {
      setIsUploading(false)
    }
  }, [disabled, onUpload])

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
    if (!currentPhotoUrl || !onDelete) return

    try {
      const response = await fetch('/api/upload', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: currentPhotoUrl }),
      })

      if (!response.ok) {
        throw new Error('Error al eliminar imagen')
      }

      setPreviewUrl(null)
      onDelete()
      toast.success('Foto eliminada')
    } catch {
      toast.error('Error al eliminar imagen')
    }
  }

  const displayUrl = previewUrl || currentPhotoUrl

  return (
    <div className="flex flex-col items-center gap-2">
      <div
        className={cn(
          'relative rounded-full overflow-hidden bg-muted border-2 border-dashed transition-colors',
          sizeClasses[size],
          isDragging && 'border-primary bg-primary/5',
          disabled && 'opacity-50 cursor-not-allowed'
        )}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        {displayUrl ? (
          <>
            <Image
              src={displayUrl}
              alt="Foto del paciente"
              fill
              className="object-cover"
              unoptimized
            />
            {!disabled && onDelete && (
              <button
                onClick={handleDelete}
                className="absolute top-0 right-0 p-1 bg-destructive text-destructive-foreground rounded-full opacity-0 hover:opacity-100 transition-opacity"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </>
        ) : (
          <label
            htmlFor="patient-photo-upload"
            className={cn(
              'w-full h-full flex flex-col items-center justify-center cursor-pointer',
              disabled && 'cursor-not-allowed'
            )}
          >
            <input
              type="file"
              accept=".jpg,.jpeg,.png"
              onChange={handleInputChange}
              disabled={disabled || isUploading}
              className="hidden"
              id="patient-photo-upload"
            />
            {isUploading ? (
              <Loader2 className={cn(iconSizes[size], 'animate-spin text-muted-foreground')} />
            ) : (
              <div className="flex flex-col items-center gap-1">
                <User className={cn(iconSizes[size], 'text-muted-foreground')} />
                {size === 'lg' && (
                  <Camera className="h-4 w-4 text-muted-foreground" />
                )}
              </div>
            )}
          </label>
        )}
      </div>

      {!displayUrl && !disabled && (
        <label htmlFor="patient-photo-upload">
          <Button variant="outline" size="sm" asChild disabled={isUploading}>
            <span className="cursor-pointer">
              <Camera className="h-4 w-4 mr-2" />
              Subir foto
            </span>
          </Button>
        </label>
      )}

      {displayUrl && !disabled && onDelete && (
        <Button variant="ghost" size="sm" onClick={handleDelete} className="text-muted-foreground">
          <X className="h-4 w-4 mr-1" />
          Eliminar
        </Button>
      )}
    </div>
  )
}
