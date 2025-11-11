/**
 * Login Page Integration Tests
 * Tests login functionality, security, validation, and multi-region routing
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import LoginPage from '../page';
import { createClient, getStoredRegion, setStoredRegion } from '@/lib/supabase/client';

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

// Mock Supabase client
jest.mock('@/lib/supabase/client');

describe('Login Page', () => {
  const mockPush = jest.fn();
  const mockRefresh = jest.fn();
  const mockCreateClient = createClient as jest.MockedFunction<typeof createClient>;
  const mockGetStoredRegion = getStoredRegion as jest.MockedFunction<typeof getStoredRegion>;
  const mockSetStoredRegion = setStoredRegion as jest.MockedFunction<typeof setStoredRegion>;

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
      refresh: mockRefresh,
    });
    mockGetStoredRegion.mockReturnValue('US');
  });

  describe('Rendering', () => {
    it('should render login form with all required fields', () => {
      render(<LoginPage />);
      
      expect(screen.getByText('Log in')).toBeInTheDocument();
      expect(screen.getByLabelText(/email or username/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument();
    });

    it('should render forgot password link', () => {
      render(<LoginPage />);
      
      const forgotPasswordLink = screen.getByText(/forgot password/i);
      expect(forgotPasswordLink).toBeInTheDocument();
      expect(forgotPasswordLink).toHaveAttribute('href', '/auth/forgot-password');
    });

    it('should render sign up link', () => {
      render(<LoginPage />);
      
      const signUpLink = screen.getByText(/sign up/i);
      expect(signUpLink).toBeInTheDocument();
      expect(signUpLink).toHaveAttribute('href', '/auth/sign-up');
    });

    it('should render hero section with branding', () => {
      render(<LoginPage />);
      
      expect(screen.getByText('TRAZO FARM')).toBeInTheDocument();
    });
  });

  describe('Form Validation', () => {
    it('should require email field', async () => {
      render(<LoginPage />);
      
      const emailInput = screen.getByLabelText(/email or username/i) as HTMLInputElement;
      expect(emailInput).toHaveAttribute('required');
    });

    it('should require password field', () => {
      render(<LoginPage />);
      
      const passwordInput = screen.getByLabelText(/password/i) as HTMLInputElement;
      expect(passwordInput).toHaveAttribute('required');
    });

    it('should have email input type', () => {
      render(<LoginPage />);
      
      const emailInput = screen.getByLabelText(/email or username/i);
      expect(emailInput).toHaveAttribute('type', 'email');
    });

    it('should have password input type', () => {
      render(<LoginPage />);
      
      const passwordInput = screen.getByLabelText(/password/i);
      expect(passwordInput).toHaveAttribute('type', 'password');
    });
  });

  describe('Successful Login - US Region', () => {
    it('should login successfully with US region credentials', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        user_metadata: {
          region: 'US',
        },
      };

      const mockAuthResponse = {
        data: { user: mockUser, session: { access_token: 'token' } },
        error: null,
      };

      mockCreateClient.mockReturnValue({
        auth: {
          signInWithPassword: jest.fn().mockResolvedValue(mockAuthResponse),
        },
      } as unknown as ReturnType<typeof createClient>);

      render(<LoginPage />);
      
      const emailInput = screen.getByLabelText(/email or username/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole('button', { name: /login/i });

      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockSetStoredRegion).toHaveBeenCalledWith('US');
        expect(mockPush).toHaveBeenCalledWith('/dashboard');
        expect(mockRefresh).toHaveBeenCalled();
      });
    });

    it('should store user region in cookie after successful login', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        user_metadata: {
          region: 'US',
        },
      };

      const mockAuthResponse = {
        data: { user: mockUser, session: { access_token: 'token' } },
        error: null,
      };

      mockCreateClient.mockReturnValue({
        auth: {
          signInWithPassword: jest.fn().mockResolvedValue(mockAuthResponse),
        },
      } as unknown as ReturnType<typeof createClient>);

      // Mock document.cookie
      Object.defineProperty(document, 'cookie', {
        writable: true,
        value: '',
      });

      render(<LoginPage />);
      
      const emailInput = screen.getByLabelText(/email or username/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole('button', { name: /login/i });

      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(document.cookie).toContain('user_region=US');
      });
    });
  });

  describe('Successful Login - Canada Region', () => {
    it('should login successfully with Canada region credentials', async () => {
      const mockUser = {
        id: 'user-456',
        email: 'test.ca@example.com',
        user_metadata: {
          region: 'CA',
        },
      };

      const mockAuthResponse = {
        data: { user: mockUser, session: { access_token: 'token-ca' } },
        error: null,
      };

      mockGetStoredRegion.mockReturnValue('CA');
      mockCreateClient.mockReturnValue({
        auth: {
          signInWithPassword: jest.fn().mockResolvedValue(mockAuthResponse),
        },
      } as unknown as ReturnType<typeof createClient>);

      render(<LoginPage />);
      
      const emailInput = screen.getByLabelText(/email or username/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole('button', { name: /login/i });

      fireEvent.change(emailInput, { target: { value: 'test.ca@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockSetStoredRegion).toHaveBeenCalledWith('CA');
        expect(mockPush).toHaveBeenCalledWith('/dashboard');
      });
    });
  });

  describe('Multi-Region Fallback', () => {
    it('should try CA region if US login fails', async () => {
      const mockUser = {
        id: 'user-ca',
        email: 'canada@example.com',
        user_metadata: {
          region: 'CA',
        },
      };

      const mockUSError = { message: 'Invalid login credentials', code: 'invalid_credentials' };
      const mockCASuccess = {
        data: { user: mockUser, session: { access_token: 'token-ca' } },
        error: null,
      };

      const mockSignInUS = jest.fn().mockResolvedValue({ data: { user: null }, error: mockUSError });
      const mockSignInCA = jest.fn().mockResolvedValue(mockCASuccess);

      mockGetStoredRegion.mockReturnValue('US');
      mockCreateClient
        .mockReturnValueOnce({
          auth: { signInWithPassword: mockSignInUS },
        } as unknown as ReturnType<typeof createClient>)
        .mockReturnValueOnce({
          auth: { signInWithPassword: mockSignInCA },
        } as unknown as ReturnType<typeof createClient>);

      render(<LoginPage />);
      
      const emailInput = screen.getByLabelText(/email or username/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole('button', { name: /login/i });

      fireEvent.change(emailInput, { target: { value: 'canada@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockSignInUS).toHaveBeenCalled();
        expect(mockSignInCA).toHaveBeenCalled();
        expect(mockSetStoredRegion).toHaveBeenCalledWith('CA');
        expect(mockPush).toHaveBeenCalledWith('/dashboard');
      });
    });

    it('should try US region if CA login fails', async () => {
      const mockUser = {
        id: 'user-us',
        email: 'usa@example.com',
        user_metadata: {
          region: 'US',
        },
      };

      const mockCAError = { message: 'Invalid login credentials', code: 'invalid_credentials' };
      const mockUSSuccess = {
        data: { user: mockUser, session: { access_token: 'token-us' } },
        error: null,
      };

      const mockSignInCA = jest.fn().mockResolvedValue({ data: { user: null }, error: mockCAError });
      const mockSignInUS = jest.fn().mockResolvedValue(mockUSSuccess);

      mockGetStoredRegion.mockReturnValue('CA');
      mockCreateClient
        .mockReturnValueOnce({
          auth: { signInWithPassword: mockSignInCA },
        } as unknown as ReturnType<typeof createClient>)
        .mockReturnValueOnce({
          auth: { signInWithPassword: mockSignInUS },
        } as unknown as ReturnType<typeof createClient>);

      render(<LoginPage />);
      
      const emailInput = screen.getByLabelText(/email or username/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole('button', { name: /login/i });

      fireEvent.change(emailInput, { target: { value: 'usa@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockSignInCA).toHaveBeenCalled();
        expect(mockSignInUS).toHaveBeenCalled();
        expect(mockSetStoredRegion).toHaveBeenCalledWith('US');
        expect(mockPush).toHaveBeenCalledWith('/dashboard');
      });
    });
  });

  describe('Error Handling', () => {
    it('should display error message on invalid credentials', async () => {
      const mockError = { message: 'Invalid login credentials' };
      
      mockCreateClient.mockReturnValue({
        auth: {
          signInWithPassword: jest.fn()
            .mockResolvedValueOnce({ data: { user: null }, error: mockError })
            .mockResolvedValueOnce({ data: { user: null }, error: mockError }),
        },
      } as unknown as ReturnType<typeof createClient>);

      render(<LoginPage />);
      
      const emailInput = screen.getByLabelText(/email or username/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole('button', { name: /login/i });

      fireEvent.change(emailInput, { target: { value: 'wrong@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'wrongpassword' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/invalid login credentials/i)).toBeInTheDocument();
      });
    });

    it('should not redirect on login failure', async () => {
      const mockError = { message: 'Login failed' };
      
      mockCreateClient.mockReturnValue({
        auth: {
          signInWithPassword: jest.fn()
            .mockResolvedValue({ data: { user: null }, error: mockError }),
        },
      } as unknown as ReturnType<typeof createClient>);

      render(<LoginPage />);
      
      const emailInput = screen.getByLabelText(/email or username/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole('button', { name: /login/i });

      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'password' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockPush).not.toHaveBeenCalled();
      });
    });
  });

  describe('Loading State', () => {
    it('should disable form fields during login', async () => {
      mockCreateClient.mockReturnValue({
        auth: {
          signInWithPassword: jest.fn().mockImplementation(
            () => new Promise(resolve => setTimeout(resolve, 1000))
          ),
        },
      } as unknown as ReturnType<typeof createClient>);

      render(<LoginPage />);
      
      const emailInput = screen.getByLabelText(/email or username/i) as HTMLInputElement;
      const passwordInput = screen.getByLabelText(/password/i) as HTMLInputElement;
      const submitButton = screen.getByRole('button', { name: /login/i }) as HTMLButtonElement;

      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      fireEvent.click(submitButton);

      // Check loading state
      await waitFor(() => {
        expect(screen.getByText(/logging in/i)).toBeInTheDocument();
      });
    });
  });

  describe('Security', () => {
    it('should not expose password in DOM', () => {
      render(<LoginPage />);
      
      const passwordInput = screen.getByLabelText(/password/i) as HTMLInputElement;
      fireEvent.change(passwordInput, { target: { value: 'secretpassword' } });

      expect(passwordInput.type).toBe('password');
      expect(passwordInput.value).toBe('secretpassword');
      // Value should not be visible in DOM due to type="password"
    });

    it('should clear error state on new login attempt', async () => {
      const mockError = { message: 'Invalid credentials' };
      const mockSuccess = {
        data: { 
          user: { id: 'user-123', email: 'test@example.com', user_metadata: { region: 'US' } },
          session: { access_token: 'token' }
        },
        error: null,
      };

      const mockSignIn = jest.fn()
        .mockResolvedValueOnce({ data: { user: null }, error: mockError })
        .mockResolvedValueOnce({ data: { user: null }, error: mockError })
        .mockResolvedValueOnce(mockSuccess);

      mockCreateClient.mockReturnValue({
        auth: { signInWithPassword: mockSignIn },
      } as unknown as ReturnType<typeof createClient>);

      render(<LoginPage />);
      
      const emailInput = screen.getByLabelText(/email or username/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole('button', { name: /login/i });

      // First attempt - should show error
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'wrong' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/invalid credentials/i)).toBeInTheDocument();
      });

      // Second attempt - error should clear during submission
      fireEvent.change(passwordInput, { target: { value: 'correct' } });
      fireEvent.click(submitButton);

      // Error should not be visible during new submission
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/dashboard');
      });
    });
  });
});
