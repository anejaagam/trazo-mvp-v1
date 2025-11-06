import { render, screen, waitFor } from '@testing-library/react'
import React from 'react'
import { WelcomeBanner } from '../welcome-banner'

// Utility to control mocked localStorage
const setLocalStorage = (key: string, value: string | null) => {
  const ls = window.localStorage as unknown as {
    getItem: jest.Mock
    setItem: jest.Mock
    removeItem: jest.Mock
    clear: jest.Mock
  }
  if (value === null) {
    ls.getItem.mockReturnValueOnce(null)
  } else {
    ls.getItem.mockReturnValueOnce(value)
  }
}

describe('WelcomeBanner', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('does not render when dismissed flag is set', async () => {
    setLocalStorage('trazo-onboarded', '1')
    render(<WelcomeBanner role="org_admin" jurisdictionId="oregon_metrc" />)

    // Wait for effect to run
    await waitFor(() => {
      expect(screen.queryByText(/Welcome to Trazo/i)).not.toBeInTheDocument()
      expect(screen.queryByText(/You’re all set/i)).not.toBeInTheDocument()
    })
  })

  it('renders for first-time users (no dismissed flag)', async () => {
    setLocalStorage('trazo-onboarded', null)
    render(<WelcomeBanner role="org_admin" jurisdictionId="oregon_metrc" />)

    // Shows the admin welcome after effect runs
    expect(await screen.findByText(/Welcome to Trazo/i)).toBeInTheDocument()
  })
})
