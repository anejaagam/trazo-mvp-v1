/**
 * @jest-environment jsdom
 */

import { describe, it, expect } from '@jest/globals'
import { generateBatchPacketHTML } from '../batch-packet-generator'

describe('Batch Packet Generator', () => {
  const mockBatchData = {
    batch: {
      id: 'batch-123',
      batch_number: 'BATCH-001',
      current_stage: 'flowering',
      plant_count: 100,
      start_date: '2025-01-01',
      status: 'active',
      cultivar: {
        name: 'Test Strain',
        strain_type: 'hybrid',
      },
      site: {
        name: 'Test Site',
        license_number: 'LIC-12345',
      },
    },
    tasks: [
      {
        id: 'task-1',
        title: 'Daily Inspection',
        status: 'done',
        completed_at: '2025-11-14T10:00:00Z',
      },
      {
        id: 'task-2',
        title: 'Water Plants',
        status: 'in_progress',
      },
    ],
    events: [
      {
        id: 'event-1',
        batch_id: 'batch-123',
        event_type: 'stage_change' as const,
        timestamp: '2025-11-14T09:00:00Z',
        notes: 'Transitioned to flowering',
        user_id: 'user-1',
      },
    ],
    sopLinks: [
      {
        id: 'link-1',
        sop_template: {
          name: 'Weekly Maintenance',
          category: 'maintenance',
        },
      },
    ],
  }

  describe('generateBatchPacketHTML', () => {
    it('should generate valid HTML for a full packet', () => {
      const html = generateBatchPacketHTML(mockBatchData, {
        packetType: 'full',
        includesTasks: true,
        includesRecipe: true,
        includesInventory: true,
        includesCompliance: true,
      })

      expect(html).toContain('<!DOCTYPE html>')
      expect(html).toContain('Batch Packet: BATCH-001')
      expect(html).toContain('Test Strain')
      expect(html).toContain('flowering')
      expect(html).toContain('100')
    })

    it('should include tasks section when includesTasks is true', () => {
      const html = generateBatchPacketHTML(mockBatchData, {
        packetType: 'full',
        includesTasks: true,
        includesRecipe: false,
        includesInventory: false,
        includesCompliance: false,
      })

      expect(html).toContain('Tasks & Standard Operating Procedures')
      expect(html).toContain('Daily Inspection')
      expect(html).toContain('Water Plants')
      expect(html).toContain('Weekly Maintenance')
    })

    it('should exclude tasks section when includesTasks is false', () => {
      const html = generateBatchPacketHTML(mockBatchData, {
        packetType: 'summary',
        includesTasks: false,
        includesRecipe: false,
        includesInventory: false,
        includesCompliance: false,
      })

      expect(html).not.toContain('Tasks & Standard Operating Procedures')
      expect(html).not.toContain('Daily Inspection')
    })

    it('should include event timeline when includesCompliance is true', () => {
      const html = generateBatchPacketHTML(mockBatchData, {
        packetType: 'compliance',
        includesTasks: false,
        includesRecipe: false,
        includesInventory: false,
        includesCompliance: true,
      })

      expect(html).toContain('Event Timeline')
      expect(html).toContain('stage_change')
      expect(html).toContain('Transitioned to flowering')
    })

    it('should handle batch without cultivar', () => {
      const dataWithoutCultivar = {
        ...mockBatchData,
        batch: {
          ...mockBatchData.batch,
          cultivar: null,
        },
      }

      const html = generateBatchPacketHTML(dataWithoutCultivar, {
        packetType: 'full',
        includesTasks: false,
        includesRecipe: false,
        includesInventory: false,
        includesCompliance: false,
      })

      expect(html).toContain('<!DOCTYPE html>')
      expect(html).toContain('BATCH-001')
    })

    it('should handle empty tasks array', () => {
      const dataWithoutTasks = {
        ...mockBatchData,
        tasks: [],
      }

      const html = generateBatchPacketHTML(dataWithoutTasks, {
        packetType: 'full',
        includesTasks: true,
        includesRecipe: false,
        includesInventory: false,
        includesCompliance: false,
      })

      expect(html).toContain('<!DOCTYPE html>')
      expect(html).not.toContain('Daily Inspection')
    })

    it('should include packet type in subtitle', () => {
      const html = generateBatchPacketHTML(mockBatchData, {
        packetType: 'harvest',
        includesTasks: false,
        includesRecipe: false,
        includesInventory: false,
        includesCompliance: false,
      })

      expect(html).toContain('Packet Type: Harvest')
    })

    it('should include site information', () => {
      const html = generateBatchPacketHTML(mockBatchData, {
        packetType: 'full',
        includesTasks: false,
        includesRecipe: false,
        includesInventory: false,
        includesCompliance: false,
      })

      expect(html).toContain('Test Site')
      expect(html).toContain('LIC-12345')
    })
  })
})
