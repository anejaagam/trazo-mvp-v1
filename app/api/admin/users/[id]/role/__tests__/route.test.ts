/**
 * Tests for PATCH /api/admin/users/[id]/role
 */

import { PATCH } from '../route'
import { createClient } from '@/lib/supabase/server'
import { canPerformAction } from '@/lib/rbac/guards'
import { updateUserRole } from '@/lib/supabase/queries/users'
import { isDevModeActive } from '@/lib/dev-mode'
import { NextRequest } from 'next/server'

jest.mock('@/lib/supabase/server')
jest.mock('@/lib/rbac/guards')
jest.mock('@/lib/supabase/queries/users')
jest.mock('@/lib/dev-mode')

function mockRequest(body: unknown): NextRequest {
  return { json: async () => body } as unknown as NextRequest
}

describe('PATCH /api/admin/users/[id]/role', () => {
  const mockGetUser = jest.fn()
  const mockFrom = jest.fn()
  const mockSelect = jest.fn()
  const mockEq = jest.fn()
  const mockSingle = jest.fn()

  const supabase = { auth: { getUser: mockGetUser }, from: mockFrom }

  beforeEach(() => {
    jest.clearAllMocks()
    ;(createClient as jest.Mock).mockResolvedValue(supabase)
    ;(isDevModeActive as jest.Mock).mockReturnValue(false)

    mockFrom.mockReturnValue({ select: mockSelect })
    mockSelect.mockReturnValue({ eq: mockEq })
    mockEq.mockReturnValue({ single: mockSingle })
  })

  it('returns 401 when not authenticated', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: new Error('no') })

    const res = await PATCH(mockRequest({ role: 'operator' }), { params: Promise.resolve({ id: 'u1' }) })
    const data = await res.json()

    expect(res.status).toBe(401)
    expect(data.error).toBe('Unauthorized')
  })

  it('returns 400 on invalid role', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'me' } }, error: null })

    const res = await PATCH(mockRequest({ role: 'not_a_role' }), { params: Promise.resolve({ id: 'u1' }) })
    const data = await res.json()

    expect(res.status).toBe(400)
    expect(data.error).toBe('Invalid role')
  })

  it('returns 403 if lacking role:assign', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'me' } }, error: null })
    mockSingle.mockResolvedValueOnce({ data: { role: 'operator', organization_id: 'org1' }, error: null })
    ;(canPerformAction as jest.Mock).mockReturnValue({ allowed: false })

    const res = await PATCH(mockRequest({ role: 'operator' }), { params: Promise.resolve({ id: 'u1' }) })
    const data = await res.json()

    expect(res.status).toBe(403)
    expect(data.error).toBe('Insufficient permissions')
  })

  it('returns 403 if target user is in different org', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'me' } }, error: null })
    // inviter user record
    mockSingle.mockResolvedValueOnce({ data: { role: 'site_manager', organization_id: 'org1' }, error: null })
    // target user record
    mockSingle.mockResolvedValueOnce({ data: { id: 'u1', organization_id: 'org2' }, error: null })
    ;(canPerformAction as jest.Mock).mockReturnValue({ allowed: true })

    const res = await PATCH(mockRequest({ role: 'operator' }), { params: Promise.resolve({ id: 'u1' }) })
    const data = await res.json()

    expect(res.status).toBe(403)
    expect(data.error).toBe('Cannot modify users in other organizations')
  })

  it('returns 403 if assigning equal/higher role (non-admin)', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'me' } }, error: null })
    // inviter user
    mockSingle.mockResolvedValueOnce({ data: { role: 'site_manager', organization_id: 'org1' }, error: null })
    // target user in same org
    mockSingle.mockResolvedValueOnce({ data: { id: 'u1', organization_id: 'org1' }, error: null })
    ;(canPerformAction as jest.Mock).mockReturnValue({ allowed: true })

    const res = await PATCH(mockRequest({ role: 'site_manager' }), { params: Promise.resolve({ id: 'u1' }) })
    const data = await res.json()

    expect(res.status).toBe(403)
    expect(data.error).toContain('equal or higher')
  })

  it('returns 200 when assigning lower role', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'me' } }, error: null })
    // inviter user
    mockSingle.mockResolvedValueOnce({ data: { role: 'site_manager', organization_id: 'org1' }, error: null })
    // target user in same org
    mockSingle.mockResolvedValueOnce({ data: { id: 'u1', organization_id: 'org1' }, error: null })
    ;(canPerformAction as jest.Mock).mockReturnValue({ allowed: true })
    ;(updateUserRole as jest.Mock).mockResolvedValue({ id: 'u1', role: 'operator' })

    const res = await PATCH(mockRequest({ role: 'operator' }), { params: Promise.resolve({ id: 'u1' }) })
    const data = await res.json()

    expect(res.status).toBe(200)
    expect(data.success).toBe(true)
    expect(updateUserRole).toHaveBeenCalledWith('u1', 'operator')
  })
})
