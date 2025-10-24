import { render, screen } from '@testing-library/react'
import { UserRoleDialog } from '../user-role-dialog'

jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}))

describe('UserRoleDialog', () => {
  const onClose = jest.fn()
  const onUpdated = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('disables Save when selected role is not assignable (equal rank)', () => {
    render(
      <UserRoleDialog
        open
        onClose={onClose}
        userId={"user-1"}
        currentRole={'site_manager'}
        inviterRole={'site_manager'}
        onUpdated={onUpdated}
      />
    )

    const saveBtn = screen.getByRole('button', { name: /save/i })
    expect(saveBtn).toBeDisabled()
  })

  it('enables Save when selected role is assignable (lower rank)', () => {
    render(
      <UserRoleDialog
        open
        onClose={onClose}
        userId={"user-1"}
        currentRole={'operator'}
        inviterRole={'site_manager'}
        onUpdated={onUpdated}
      />
    )

    const saveBtn = screen.getByRole('button', { name: /save/i })
    expect(saveBtn).not.toBeDisabled()
  })
})
