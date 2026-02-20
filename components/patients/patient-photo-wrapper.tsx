'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Camera, X, Loader2, User } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface PatientPhotoWrapperProps {
  patientId: string
  photoUrl?: string | null
  photoName?: string | null
  patientName: string
  editable?: boolean
}

export function PatientPhotoWrapper({
  patientId,
  photoUrl,
  patientName,
  editable = true,
}: PatientPhotoWrapperProps) {
  const router = useRouter()
  const [isUploading, setIsUploading] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [currentPhotoUrl, setCurrentPhotoUrl] = useState(photoUrl)

  const handleFile = async (file: File) => {
    if (!editable) return

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

      const uploadResponse = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      if (!uploadResponse.ok) {
        const error = await uploadResponse.json()
        throw new Error(error.error || 'Error al subir imagen')
      }

      const uploadResult = await uploadResponse.json()

      const updateResponse = await fetch(`/api/patients/${patientId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          photoUrl: uploadResult.url,
          photoName: uploadResult.fileName,
        }),
      })

      if (!updateResponse.ok) {
        throw new Error('Error al actualizar paciente')
      }

      setCurrentPhotoUrl(uploadResult.url)
      toast.success('Foto actualizada')
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error al subir imagen')
    } finally {
      setIsUploading(false)
    }
  }

  const handleDelete = async () => {
    if (!currentPhotoUrl) return

    try {
      const deleteResponse = await fetch('/api/upload', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: currentPhotoUrl }),
      })

      if (!deleteResponse.ok) {
        throw new Error('Error al eliminar imagen')
      }

      const updateResponse = await fetch(`/api/patients/${patientId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          photoUrl: null,
          photoName: null,
        }),
      })

      if (!updateResponse.ok) {
        throw new Error('Error al actualizar paciente')
      }

      setCurrentPhotoUrl(null)
      toast.success('Foto eliminada')
      router.refresh()
    } catch {
      toast.error('Error al eliminar imagen')
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    if (editable) setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <div
        className={cn(
          'relative h-24 w-24 rounded-full overflow-hidden bg-muted border-2 transition-colors',
          isDragging && 'border-primary border-dashed',
          !editable && 'opacity-90'
        )}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        {currentPhotoUrl ? (
          <>
            <Image
              src={currentPhotoUrl}
              alt={`Foto de ${patientName}`}
              fill
              className="object-cover"
              unoptimized
            />
            {editable && (
              <button
                onClick={handleDelete}
                className="absolute top-0 right-0 p-1 bg-destructive text-destructive-foreground rounded-full opacity-0 hover:opacity-100 transition-opacity"
                type="button"
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
              !editable && 'cursor-default'
            )}
          >
            <input
              type="file"
              accept=".jpg,.jpeg,.png"
              onChange={handleInputChange}
              disabled={!editable || isUploading}
              className="hidden"
              id="patient-photo-upload"
            />
            {isUploading ? (
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            ) : (
              <div className="flex flex-col items-center gap-1">
                <User className="h-10 w-10 text-muted-foreground" />
                {editable && <Camera className="h-4 w-4 text-muted-foreground" />}
              </div>
            )}
          </label>
        )}
      </div>

      {editable && !currentPhotoUrl && (
        <label htmlFor="patient-photo-upload">
          <Button variant="outline" size="sm" asChild disabled={isUploading}>
            <span className="cursor-pointer">
              <Camera className="h-4 w-4 mr-2" />
              Subir foto
            </span>
          </Button>
        </label>
      )}

      {editable && currentPhotoUrl && (
        <Button variant="ghost" size="sm" onClick={handleDelete} className="text-muted-foreground">
          <X className="h-4 w-4 mr-1" />
          Eliminar
        </Button>
      )}
    </div>
  )
}
