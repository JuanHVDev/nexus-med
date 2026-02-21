import type { 
  AppointmentFilter, 
  AppointmentWithRelations, 
  AppointmentStatus,
  CalendarEvent,
  CreateAppointmentDTO,
  UpdateAppointmentDTO,
  STATUS_COLORS
} from "./types"
import { appointmentRepository } from "./appointment-repository"
import { hasTimeConflict, isValidTimeSlot, buildConflictMessage } from "./conflict-validator"
import { STATUS_COLORS as statusColors } from "./types"

export class AppointmentService {
  async create(
    data: CreateAppointmentDTO,
    clinicId: bigint,
    userId: string
  ): Promise<{ success: true; appointment: AppointmentWithRelations } | { success: false; error: string }> {
    if (!isValidTimeSlot(data.startTime, data.endTime)) {
      return { success: false, error: "La hora de fin debe ser posterior a la hora de inicio" }
    }

    const conflictParams = {
      doctorId: data.doctorId,
      startTime: data.startTime,
      endTime: data.endTime,
      clinicId,
    }

    const existingAppointment = await appointmentRepository.findConflicting(conflictParams)
    if (existingAppointment) {
      return { success: false, error: buildConflictMessage(existingAppointment) }
    }

    const appointment = await appointmentRepository.create({
      ...data,
      clinicId,
    })

    return { success: true, appointment }
  }

  async getById(
    id: bigint,
    clinicId: bigint
  ): Promise<AppointmentWithRelations | null> {
    return appointmentRepository.findById(id, clinicId)
  }

  async getMany(
    filter: AppointmentFilter,
    page: number = 1,
    limit: number = 100
  ): Promise<{ appointments: AppointmentWithRelations[]; total: number; pages: number }> {
    const { appointments, total } = await appointmentRepository.findMany(filter, page, limit)
    return {
      appointments,
      total,
      pages: Math.ceil(total / limit)
    }
  }

  async getCalendarEvents(
    clinicId: bigint,
    start: Date,
    end: Date,
    doctorId?: string
  ): Promise<CalendarEvent[]> {
    const appointments = await appointmentRepository.findForCalendar(clinicId, start, end, doctorId)

    return appointments.map(apt => {
      const patientName = `${apt.patient.firstName}${apt.patient.middleName ? ' ' + apt.patient.middleName : ''} ${apt.patient.lastName}`
      const doctorName = apt.doctor.name
      const backgroundColor = statusColors[apt.status]

      return {
        id: apt.id.toString(),
        title: `${patientName} - Dr. ${doctorName}`,
        start: apt.startTime.toISOString(),
        end: apt.endTime.toISOString(),
        backgroundColor,
        borderColor: backgroundColor,
        resource: {
          appointmentId: apt.id.toString(),
          patientId: apt.patientId.toString(),
          patientName,
          doctorId: apt.doctorId,
          doctorName,
          status: apt.status,
          reason: apt.reason,
        }
      }
    })
  }

  async update(
    id: bigint,
    clinicId: bigint,
    data: UpdateAppointmentDTO
  ): Promise<{ success: true; appointment: AppointmentWithRelations } | { success: false; error: string }> {
    const existing = await appointmentRepository.findById(id, clinicId)
    if (!existing) {
      return { success: false, error: "Cita no encontrada" }
    }

    const newStartTime = data.startTime ?? existing.startTime
    const newEndTime = data.endTime ?? existing.endTime

    if (!isValidTimeSlot(newStartTime, newEndTime)) {
      return { success: false, error: "La hora de fin debe ser posterior a la hora de inicio" }
    }

    if (data.doctorId || data.startTime || data.endTime) {
      const conflictParams = {
        doctorId: data.doctorId ?? existing.doctorId,
        startTime: newStartTime,
        endTime: newEndTime,
        clinicId,
        excludeAppointmentId: id,
      }

      const conflict = await appointmentRepository.findConflicting(conflictParams)
      if (conflict) {
        return { success: false, error: buildConflictMessage(conflict) }
      }
    }

    const appointment = await appointmentRepository.update(id, data)
    return { success: true, appointment }
  }

  async updateStatus(
    id: bigint,
    clinicId: bigint,
    status: AppointmentStatus
  ): Promise<{ success: true } | { success: false; error: string }> {
    const existing = await appointmentRepository.findById(id, clinicId)
    if (!existing) {
      return { success: false, error: "Cita no encontrada" }
    }

    await appointmentRepository.updateStatus(id, status)
    return { success: true }
  }

  async cancel(
    id: bigint,
    clinicId: bigint
  ): Promise<{ success: true } | { success: false; error: string }> {
    const existing = await appointmentRepository.findById(id, clinicId)
    if (!existing) {
      return { success: false, error: "Cita no encontrada" }
    }

    await appointmentRepository.updateStatus(id, "CANCELLED")
    return { success: true }
  }
}

export const appointmentService = new AppointmentService()
