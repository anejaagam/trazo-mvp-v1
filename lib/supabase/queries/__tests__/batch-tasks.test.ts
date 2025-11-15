/**
 * @jest-environment node
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals'
import { linkTemplateToBatch, unlinkTemplateFromBatch, createTaskFromTemplate } from '../batch-tasks'

// Mock Supabase client
const mockFrom = jest.fn()
const mockAuthGetUser = jest.fn()

const mockSupabase = {
  from: mockFrom,
  auth: {
    getUser: mockAuthGetUser,
  },
}

// Mock the server client creation
jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(() => mockSupabase),
}))

describe('Batch-Task Integration Query Helpers', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    
    // Setup default auth mock
    mockAuthGetUser.mockResolvedValue({
      data: { user: { id: 'test-user-id' } },
      error: null,
    })
  })

  describe('linkTemplateToBatch', () => {
    it('should link a template to a batch successfully', async () => {
      // Mock existing link check (no existing link)
      mockFrom.mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({ data: null, error: null }),
            }),
          }),
        }),
      })

      // Mock insert
      mockFrom.mockReturnValueOnce({
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: {
                id: 'link-id',
                batch_id: 'batch-123',
                sop_template_id: 'template-456',
                auto_create: false,
              },
              error: null,
            }),
          }),
        }),
      })

      // Mock batch_events insert
      mockFrom.mockReturnValueOnce({
        insert: jest.fn().mockResolvedValue({ data: {}, error: null }),
      })

      const result = await linkTemplateToBatch('batch-123', 'template-456', {
        userId: 'test-user-id',
        autoCreate: false,
      })

      expect(result.error).toBeNull()
      expect(result.data).toBeDefined()
      expect(result.data?.batch_id).toBe('batch-123')
    })

    it('should return error if template already linked', async () => {
      // Mock existing link check (link exists)
      mockFrom.mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: { id: 'existing-link' },
                error: null,
              }),
            }),
          }),
        }),
      })

      const result = await linkTemplateToBatch('batch-123', 'template-456', {
        userId: 'test-user-id',
      })

      expect(result.error).toBeDefined()
      expect(result.data).toBeNull()
    })
  })

  describe('unlinkTemplateFromBatch', () => {
    it('should unlink a template successfully', async () => {
      // Mock link lookup
      mockFrom.mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: {
                batch_id: 'batch-123',
                sop_template_id: 'template-456',
              },
              error: null,
            }),
          }),
        }),
      })

      // Mock delete
      mockFrom.mockReturnValueOnce({
        delete: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({ error: null }),
        }),
      })

      // Mock batch_events insert
      mockFrom.mockReturnValueOnce({
        insert: jest.fn().mockResolvedValue({ data: {}, error: null }),
      })

      const result = await unlinkTemplateFromBatch('link-123', 'test-user-id')

      expect(result.error).toBeNull()
    })

    it('should return error if link not found', async () => {
      // Mock link lookup (not found)
      mockFrom.mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: null,
              error: null,
            }),
          }),
        }),
      })

      const result = await unlinkTemplateFromBatch('link-123', 'test-user-id')

      expect(result.error).toBeDefined()
    })
  })

  describe('createTaskFromTemplate', () => {
    it('should create a task from a template successfully', async () => {
      // Mock batch lookup
      mockFrom.mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: {
                batch_number: 'BATCH-001',
                site_id: 'site-123',
                organization_id: 'org-456',
              },
              error: null,
            }),
          }),
        }),
      })

      // Mock template lookup
      mockFrom.mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: {
                id: 'template-789',
                name: 'Test SOP',
                description: 'Test description',
                steps: [
                  {
                    title: 'Step 1',
                    description: 'Do something',
                    evidenceRequired: true,
                    evidenceType: 'photo',
                  },
                ],
                estimated_duration_minutes: 30,
              },
              error: null,
            }),
          }),
        }),
      })

      // Mock task insert
      mockFrom.mockReturnValueOnce({
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: {
                id: 'task-123',
                title: 'Test SOP - BATCH-001',
                batch_id: 'batch-123',
              },
              error: null,
            }),
          }),
        }),
      })

      // Mock task_steps insert
      mockFrom.mockReturnValueOnce({
        insert: jest.fn().mockResolvedValue({ error: null }),
      })

      // Mock batch_events insert
      mockFrom.mockReturnValueOnce({
        insert: jest.fn().mockResolvedValue({ data: {}, error: null }),
      })

      const result = await createTaskFromTemplate('batch-123', 'template-789', {
        userId: 'test-user-id',
        priority: 'high',
      })

      expect(result.error).toBeNull()
      expect(result.data).toBeDefined()
      expect(result.data?.title).toContain('Test SOP')
    })
  })
})
