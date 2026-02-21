import { describe, it, expect } from 'vitest'
import { hasTimeConflict, isValidTimeSlot, shouldCheckForConflicts } from '@/lib/domain/appointments/conflict-validator'
import type { AppointmentStatus, AppointmentWithRelations } from '@/lib/domain/appointments/types'

describe('conflict-validator', () => {
  describe('isValidTimeSlot', () => {
    it('should return true when endTime is after startTime', () => {
      const startTime = new Date('2024-01-15T10:00:00')
      const endTime = new Date('2024-01-15T10:30:00')
      
      expect(isValidTimeSlot(startTime, endTime)).toBe(true)
    })

    it('should return false when endTime equals startTime', () => {
      const startTime = new Date('2024-01-15T10:00:00')
      const endTime = new Date('2024-01-15T10:00:00')
      
      expect(isValidTimeSlot(startTime, endTime)).toBe(false)
    })

    it('should return false when endTime is before startTime', () => {
      const startTime = new Date('2024-01-15T10:30:00')
      const endTime = new Date('2024-01-15T10:00:00')
      
      expect(isValidTimeSlot(startTime, endTime)).toBe(false)
    })

    it('should handle different dates', () => {
      const startTime = new Date('2024-01-15T23:00:00')
      const endTime = new Date('2024-01-16T01:00:00')
      
      expect(isValidTimeSlot(startTime, endTime)).toBe(true)
    })
  })

  describe('hasTimeConflict', () => {
    const createSlot = (start: string, end: string) => ({
      startTime: new Date(start),
      endTime: new Date(end)
    })

    it('should detect conflict when new appointment starts during existing', () => {
      const existing = createSlot('2024-01-15T10:00:00', '2024-01-15T11:00:00')
      const newSlot = createSlot('2024-01-15T10:30:00', '2024-01-15T11:30:00')
      
      expect(hasTimeConflict(existing, newSlot)).toBe(true)
    })

    it('should detect conflict when new appointment ends during existing', () => {
      const existing = createSlot('2024-01-15T10:00:00', '2024-01-15T11:00:00')
      const newSlot = createSlot('2024-01-15T09:30:00', '2024-01-15T10:30:00')
      
      expect(hasTimeConflict(existing, newSlot)).toBe(true)
    })

    it('should detect conflict when new appointment encompasses existing', () => {
      const existing = createSlot('2024-01-15T10:00:00', '2024-01-15T11:00:00')
      const newSlot = createSlot('2024-01-15T09:00:00', '2024-01-15T12:00:00')
      
      expect(hasTimeConflict(existing, newSlot)).toBe(true)
    })

    it('should detect conflict when existing encompasses new', () => {
      const existing = createSlot('2024-01-15T09:00:00', '2024-01-15T12:00:00')
      const newSlot = createSlot('2024-01-15T10:00:00', '2024-01-15T11:00:00')
      
      expect(hasTimeConflict(existing, newSlot)).toBe(true)
    })

    it('should detect conflict when appointments are identical', () => {
      const existing = createSlot('2024-01-15T10:00:00', '2024-01-15T11:00:00')
      const newSlot = createSlot('2024-01-15T10:00:00', '2024-01-15T11:00:00')
      
      expect(hasTimeConflict(existing, newSlot)).toBe(true)
    })

    it('should not detect conflict when new appointment is before existing', () => {
      const existing = createSlot('2024-01-15T11:00:00', '2024-01-15T12:00:00')
      const newSlot = createSlot('2024-01-15T10:00:00', '2024-01-15T11:00:00')
      
      expect(hasTimeConflict(existing, newSlot)).toBe(false)
    })

    it('should not detect conflict when new appointment is after existing', () => {
      const existing = createSlot('2024-01-15T10:00:00', '2024-01-15T11:00:00')
      const newSlot = createSlot('2024-01-15T11:00:00', '2024-01-15T12:00:00')
      
      expect(hasTimeConflict(existing, newSlot)).toBe(false)
    })

    it('should handle back-to-back appointments without conflict', () => {
      const existing = createSlot('2024-01-15T09:00:00', '2024-01-15T10:00:00')
      const newSlot = createSlot('2024-01-15T10:00:00', '2024-01-15T11:00:00')
      
      expect(hasTimeConflict(existing, newSlot)).toBe(false)
    })

    it('should detect conflict with overlapping edge cases', () => {
      const existing = createSlot('2024-01-15T10:00:00', '2024-01-15T11:00:00')
      const newSlot = createSlot('2024-01-15T10:59:59', '2024-01-15T11:30:00')
      
      expect(hasTimeConflict(existing, newSlot)).toBe(true)
    })
  })

  describe('shouldCheckForConflicts', () => {
    it('should return true for SCHEDULED status', () => {
      expect(shouldCheckForConflicts('SCHEDULED')).toBe(true)
    })

    it('should return true for CONFIRMED status', () => {
      expect(shouldCheckForConflicts('CONFIRMED')).toBe(true)
    })

    it('should return true for IN_PROGRESS status', () => {
      expect(shouldCheckForConflicts('IN_PROGRESS')).toBe(true)
    })

    it('should return true for COMPLETED status', () => {
      expect(shouldCheckForConflicts('COMPLETED')).toBe(true)
    })

    it('should return false for CANCELLED status', () => {
      expect(shouldCheckForConflicts('CANCELLED')).toBe(false)
    })

    it('should return false for NO_SHOW status', () => {
      expect(shouldCheckForConflicts('NO_SHOW')).toBe(false)
    })
  })
})
