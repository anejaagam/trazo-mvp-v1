import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ForgotPasswordForm } from '@/components/auth/forgot-password-form';
import { createClient } from '@/lib/supabase/client';

// Mock Supabase client
jest.mock('@/lib/supabase/client', () => ({
  createClient: jest.fn(),
}));

// Mock window.location.origin
// eslint-disable-next-line @typescript-eslint/no-explicit-any
delete (window as any).location;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
window.location = { origin: 'http://localhost' } as any;

describe('Forgot Password', () => {
  const mockResetPasswordForEmail = jest.fn();
  const mockSupabaseClient = {
    auth: {
      resetPasswordForEmail: mockResetPasswordForEmail,
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (createClient as jest.Mock).mockReturnValue(mockSupabaseClient);
    mockResetPasswordForEmail.mockResolvedValue({ error: null });
  });

  describe('Rendering', () => {
    it('should render forgot password form', () => {
      render(<ForgotPasswordForm />);
      
      expect(screen.getByText('Reset Your Password')).toBeInTheDocument();
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    });

    it('should render form title and description', () => {
      render(<ForgotPasswordForm />);
      
      expect(screen.getByText('Reset Your Password')).toBeInTheDocument();
      expect(screen.getByText(/Type in your email and we'll send you a link/i)).toBeInTheDocument();
    });

    it('should render submit button', () => {
      render(<ForgotPasswordForm />);
      
      expect(screen.getByRole('button', { name: /send reset email/i })).toBeInTheDocument();
    });

    it('should render login link', () => {
      render(<ForgotPasswordForm />);
      
      const loginLink = screen.getByRole('link', { name: /login/i });
      expect(loginLink).toBeInTheDocument();
      expect(loginLink).toHaveAttribute('href', '/auth/login');
    });

    it('should have email input with placeholder', () => {
      render(<ForgotPasswordForm />);
      
      const emailInput = screen.getByLabelText(/email/i);
      expect(emailInput).toHaveAttribute('placeholder', 'm@example.com');
    });
  });

  describe('Form Validation', () => {
    it('should require email field', () => {
      render(<ForgotPasswordForm />);
      
      const emailInput = screen.getByLabelText(/email/i);
      expect(emailInput).toBeRequired();
    });

    it('should have email type for email input', () => {
      render(<ForgotPasswordForm />);
      
      const emailInput = screen.getByLabelText(/email/i);
      expect(emailInput).toHaveAttribute('type', 'email');
    });
  });

  describe('Form Input', () => {
    it('should update email value when typing', () => {
      render(<ForgotPasswordForm />);
      
      const emailInput = screen.getByLabelText(/email/i) as HTMLInputElement;
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      
      expect(emailInput.value).toBe('test@example.com');
    });

    it('should accept valid email format', () => {
      render(<ForgotPasswordForm />);
      
      const emailInput = screen.getByLabelText(/email/i) as HTMLInputElement;
      fireEvent.change(emailInput, { target: { value: 'user@domain.com' } });
      
      expect(emailInput.value).toBe('user@domain.com');
    });
  });

  describe('Form Submission', () => {
    it('should call resetPasswordForEmail with correct parameters', async () => {
      render(<ForgotPasswordForm />);
      
      const emailInput = screen.getByLabelText(/email/i);
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      
      const submitButton = screen.getByRole('button', { name: /send reset email/i });
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(mockResetPasswordForEmail).toHaveBeenCalledWith('test@example.com', {
          redirectTo: 'http://localhost/auth/update-password',
        });
      });
    });

    it('should show loading state during submission', async () => {
      mockResetPasswordForEmail.mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve({ error: null }), 100))
      );
      
      render(<ForgotPasswordForm />);
      
      const emailInput = screen.getByLabelText(/email/i);
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      
      const submitButton = screen.getByRole('button', { name: /send reset email/i });
      fireEvent.click(submitButton);
      
      expect(screen.getByText('Sending...')).toBeInTheDocument();
      expect(submitButton).toBeDisabled();
      
      await waitFor(() => {
        expect(screen.queryByText('Sending...')).not.toBeInTheDocument();
      });
    });

    it('should display success message after successful submission', async () => {
      render(<ForgotPasswordForm />);
      
      const emailInput = screen.getByLabelText(/email/i);
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      
      const submitButton = screen.getByRole('button', { name: /send reset email/i });
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText('Check Your Email')).toBeInTheDocument();
        expect(screen.getByText('Password reset instructions sent')).toBeInTheDocument();
      });
    });

    it('should show success message content', async () => {
      render(<ForgotPasswordForm />);
      
      const emailInput = screen.getByLabelText(/email/i);
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      
      const submitButton = screen.getByRole('button', { name: /send reset email/i });
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText(/If you registered using your email and password/i)).toBeInTheDocument();
      });
    });

    it('should hide form after successful submission', async () => {
      render(<ForgotPasswordForm />);
      
      const emailInput = screen.getByLabelText(/email/i);
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      
      const submitButton = screen.getByRole('button', { name: /send reset email/i });
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(screen.queryByLabelText(/email/i)).not.toBeInTheDocument();
        expect(screen.queryByRole('button', { name: /send reset email/i })).not.toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    it('should display error message on API failure', async () => {
      const errorMessage = 'Email not found';
      mockResetPasswordForEmail.mockResolvedValue({
        error: new Error(errorMessage),
      });
      
      render(<ForgotPasswordForm />);
      
      const emailInput = screen.getByLabelText(/email/i);
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      
      const submitButton = screen.getByRole('button', { name: /send reset email/i });
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText(errorMessage)).toBeInTheDocument();
      });
    });

    it('should handle network errors', async () => {
      mockResetPasswordForEmail.mockRejectedValue(new Error('Network error'));
      
      render(<ForgotPasswordForm />);
      
      const emailInput = screen.getByLabelText(/email/i);
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      
      const submitButton = screen.getByRole('button', { name: /send reset email/i });
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText('Network error')).toBeInTheDocument();
      });
    });

    it('should clear previous error on new submission', async () => {
      mockResetPasswordForEmail.mockResolvedValue({
        error: new Error('First error'),
      });
      
      render(<ForgotPasswordForm />);
      
      const emailInput = screen.getByLabelText(/email/i);
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      
      const submitButton = screen.getByRole('button', { name: /send reset email/i });
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText('First error')).toBeInTheDocument();
      });
      
      mockResetPasswordForEmail.mockResolvedValue({ error: null });
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(screen.queryByText('First error')).not.toBeInTheDocument();
      });
    });

    it('should re-enable button after error', async () => {
      mockResetPasswordForEmail.mockResolvedValue({
        error: new Error('Error occurred'),
      });
      
      render(<ForgotPasswordForm />);
      
      const emailInput = screen.getByLabelText(/email/i);
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      
      const submitButton = screen.getByRole('button', { name: /send reset email/i });
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText('Error occurred')).toBeInTheDocument();
        expect(submitButton).not.toBeDisabled();
      });
    });
  });

  describe('Security', () => {
    it('should use correct redirect URL for password reset', async () => {
      render(<ForgotPasswordForm />);
      
      const emailInput = screen.getByLabelText(/email/i);
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      
      const submitButton = screen.getByRole('button', { name: /send reset email/i });
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(mockResetPasswordForEmail).toHaveBeenCalledWith(
          expect.any(String),
          expect.objectContaining({
            redirectTo: expect.stringContaining('/auth/update-password'),
          })
        );
      });
    });

    it('should prevent form submission while loading', async () => {
      mockResetPasswordForEmail.mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve({ error: null }), 100))
      );
      
      render(<ForgotPasswordForm />);
      
      const emailInput = screen.getByLabelText(/email/i);
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      
      const submitButton = screen.getByRole('button', { name: /send reset email/i });
      fireEvent.click(submitButton);
      fireEvent.click(submitButton); // Try to submit again
      
      await waitFor(() => {
        expect(mockResetPasswordForEmail).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe('UI/UX', () => {
    it('should have proper text styles for error messages', async () => {
      mockResetPasswordForEmail.mockResolvedValue({
        error: new Error('Test error'),
      });
      
      render(<ForgotPasswordForm />);
      
      const emailInput = screen.getByLabelText(/email/i);
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      
      const submitButton = screen.getByRole('button', { name: /send reset email/i });
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        const errorElement = screen.getByText('Test error');
        expect(errorElement).toHaveClass('text-red-500');
      });
    });

    it('should show login link text correctly', () => {
      render(<ForgotPasswordForm />);
      
      expect(screen.getByText(/Already have an account?/i)).toBeInTheDocument();
    });

    it('should render card structure', () => {
      render(<ForgotPasswordForm />);
      
      expect(screen.getByText('Reset Your Password')).toBeInTheDocument();
      expect(screen.getByRole('button')).toBeInTheDocument();
    });
  });
});
