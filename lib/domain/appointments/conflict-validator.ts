import type { AppointmentStatus, AppointmentWithRelations } from "./types"

const EXCLUDED_STATUSES_FOR_CONFLICT: AppointmentStatus[] = ["CANCELLED", "NO_SHOW"]

export interface TimeSlot {
  startTime: Date
  endTime: Date
}

export function hasTimeConflict(
  existing: TimeSlot,
  newSlot: TimeSlot
): boolean {
  const { startTime: existingStart, endTime: existingEnd } = existing
  const { startTime: newStart, endTime: newEnd } = newSlot

  const startsDuringExisting = newStart >= existingStart && newStart < existingEnd
  const endsDuringExisting = newEnd > existingStart && newEnd <= existingEnd
  const encompassesExisting = newStart <= existingStart && newEnd >= existingEnd

  return startsDuringExisting || endsDuringExisting || encompassesExisting
}

export function isValidTimeSlot(startTime: Date, endTime: Date): boolean {
  return endTime > startTime
}

export function shouldCheckForConflicts(status: AppointmentStatus): boolean {
  return !EXCLUDED_STATUSES_FOR_CONFLICT.includes(status)
}

export function buildConflictMessage(appointment: AppointmentWithRelations): string {
  const patientName = `${appointment.patient.firstName} ${appointment.patient.lastName}`
  const startTime = appointment.startTime.toLocaleString('es-MX', {
    dateStyle: 'short',
    timeStyle: 'short'
  })
  return `El doctor ya tiene una cita con ${patientName} a las ${startTime}`
}
