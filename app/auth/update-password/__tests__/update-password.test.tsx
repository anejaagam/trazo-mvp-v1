import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { UpdatePasswordForm } from '@/components/auth/update-password-form';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

// Mock Supabase client
jest.mock('@/lib/supabase/client', () => ({
  createClient: jest.fn(),
}));

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

describe('Update Password', () => {
  const mockUpdateUser = jest.fn();
  const mockPush = jest.fn();
  const mockSupabaseClient = {
    auth: {
      updateUser: mockUpdateUser,
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (createClient as jest.Mock).mockReturnValue(mockSupabaseClient);
    (useRouter as jest.Mock).mockReturnValue({ push: mockPush });
    mockUpdateUser.mockResolvedValue({ error: null });
  });

  describe('Rendering', () => {
    it('should render update password form', () => {
      render(<UpdatePasswordForm />);
      
      expect(screen.getByText('Reset Your Password')).toBeInTheDocument();
      expect(screen.getByLabelText(/new password/i)).toBeInTheDocument();
    });

    it('should render form title and description', () => {
      render(<UpdatePasswordForm />);
      
      expect(screen.getByText('Reset Your Password')).toBeInTheDocument();
      expect(screen.getByText(/Please enter your new password below/i)).toBeInTheDocument();
    });

    it('should render submit button', () => {
      render(<UpdatePasswordForm />);
      
      expect(screen.getByRole('button', { name: /save new password/i })).toBeInTheDocument();
    });

    it('should have password input with placeholder', () => {
      render(<UpdatePasswordForm />);
      
      const passwordInput = screen.getByLabelText(/new password/i);
      expect(passwordInput).toHaveAttribute('placeholder', 'New password');
    });
  });

  describe('Form Validation', () => {
    it('should require password field', () => {
      render(<UpdatePasswordForm />);
      
      const passwordInput = screen.getByLabelText(/new password/i);
      expect(passwordInput).toBeRequired();
    });

    it('should have password type for password input', () => {
      render(<UpdatePasswordForm />);
      
      const passwordInput = screen.getByLabelText(/new password/i);
      expect(passwordInput).toHaveAttribute('type', 'password');
    });
  });

  describe('Form Input', () => {
    it('should update password value when typing', () => {
      render(<UpdatePasswordForm />);
      
      const passwordInput = screen.getByLabelText(/new password/i) as HTMLInputElement;
      fireEvent.change(passwordInput, { target: { value: 'newPassword123!' } });
      
      expect(passwordInput.value).toBe('newPassword123!');
    });

    it('should accept strong passwords', () => {
      render(<UpdatePasswordForm />);
      
      const passwordInput = screen.getByLabelText(/new password/i) as HTMLInputElement;
      fireEvent.change(passwordInput, { target: { value: 'StrongP@ssw0rd!' } });
      
      expect(passwordInput.value).toBe('StrongP@ssw0rd!');
    });

    it('should mask password input', () => {
      render(<UpdatePasswordForm />);
      
      const passwordInput = screen.getByLabelText(/new password/i);
      expect(passwordInput).toHaveAttribute('type', 'password');
    });
  });

  describe('Form Submission', () => {
    it('should call updateUser with new password', async () => {
      render(<UpdatePasswordForm />);
      
      const passwordInput = screen.getByLabelText(/new password/i);
      fireEvent.change(passwordInput, { target: { value: 'newPassword123!' } });
      
      const submitButton = screen.getByRole('button', { name: /save new password/i });
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(mockUpdateUser).toHaveBeenCalledWith({ password: 'newPassword123!' });
      });
    });

    it('should show loading state during submission', async () => {
      mockUpdateUser.mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve({ error: null }), 100))
      );
      
      render(<UpdatePasswordForm />);
      
      const passwordInput = screen.getByLabelText(/new password/i);
      fireEvent.change(passwordInput, { target: { value: 'newPassword123!' } });
      
      const submitButton = screen.getByRole('button', { name: /save new password/i });
      fireEvent.click(submitButton);
      
      expect(screen.getByText('Saving...')).toBeInTheDocument();
      expect(submitButton).toBeDisabled();
      
      await waitFor(() => {
        expect(screen.queryByText('Saving...')).not.toBeInTheDocument();
      });
    });

    it('should redirect to /protected after successful update', async () => {
      render(<UpdatePasswordForm />);
      
      const passwordInput = screen.getByLabelText(/new password/i);
      fireEvent.change(passwordInput, { target: { value: 'newPassword123!' } });
      
      const submitButton = screen.getByRole('button', { name: /save new password/i });
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/protected');
      });
    });

    it('should not redirect on error', async () => {
      mockUpdateUser.mockResolvedValue({
        error: new Error('Password too weak'),
      });
      
      render(<UpdatePasswordForm />);
      
      const passwordInput = screen.getByLabelText(/new password/i);
      fireEvent.change(passwordInput, { target: { value: 'weak' } });
      
      const submitButton = screen.getByRole('button', { name: /save new password/i });
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(mockPush).not.toHaveBeenCalled();
      });
    });
  });

  describe('Error Handling', () => {
    it('should display error message on API failure', async () => {
      const errorMessage = 'Password too weak';
      mockUpdateUser.mockResolvedValue({
        error: new Error(errorMessage),
      });
      
      render(<UpdatePasswordForm />);
      
      const passwordInput = screen.getByLabelText(/new password/i);
      fireEvent.change(passwordInput, { target: { value: 'weak' } });
      
      const submitButton = screen.getByRole('button', { name: /save new password/i });
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText(errorMessage)).toBeInTheDocument();
      });
    });

    it('should handle network errors', async () => {
      mockUpdateUser.mockRejectedValue(new Error('Network error'));
      
      render(<UpdatePasswordForm />);
      
      const passwordInput = screen.getByLabelText(/new password/i);
      fireEvent.change(passwordInput, { target: { value: 'newPassword123!' } });
      
      const submitButton = screen.getByRole('button', { name: /save new password/i });
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText('Network error')).toBeInTheDocument();
      });
    });

    it('should clear previous error on new submission', async () => {
      mockUpdateUser.mockResolvedValue({
        error: new Error('First error'),
      });
      
      render(<UpdatePasswordForm />);
      
      const passwordInput = screen.getByLabelText(/new password/i);
      fireEvent.change(passwordInput, { target: { value: 'password1' } });
      
      const submitButton = screen.getByRole('button', { name: /save new password/i });
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText('First error')).toBeInTheDocument();
      });
      
      mockUpdateUser.mockResolvedValue({ error: null });
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(screen.queryByText('First error')).not.toBeInTheDocument();
      });
    });

    it('should re-enable button after error', async () => {
      mockUpdateUser.mockResolvedValue({
        error: new Error('Error occurred'),
      });
      
      render(<UpdatePasswordForm />);
      
      const passwordInput = screen.getByLabelText(/new password/i);
      fireEvent.change(passwordInput, { target: { value: 'password' } });
      
      const submitButton = screen.getByRole('button', { name: /save new password/i });
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText('Error occurred')).toBeInTheDocument();
        expect(submitButton).not.toBeDisabled();
      });
    });
  });

  describe('Security', () => {
    it('should prevent form submission while loading', async () => {
      mockUpdateUser.mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve({ error: null }), 100))
      );
      
      render(<UpdatePasswordForm />);
      
      const passwordInput = screen.getByLabelText(/new password/i);
      fireEvent.change(passwordInput, { target: { value: 'newPassword123!' } });
      
      const submitButton = screen.getByRole('button', { name: /save new password/i });
      fireEvent.click(submitButton);
      fireEvent.click(submitButton); // Try to submit again
      
      await waitFor(() => {
        expect(mockUpdateUser).toHaveBeenCalledTimes(1);
      });
    });

    it('should hide password text', () => {
      render(<UpdatePasswordForm />);
      
      const passwordInput = screen.getByLabelText(/new password/i) as HTMLInputElement;
      fireEvent.change(passwordInput, { target: { value: 'secretPassword' } });
      
      expect(passwordInput.type).toBe('password');
    });
  });

  describe('UI/UX', () => {
    it('should have proper text styles for error messages', async () => {
      mockUpdateUser.mockResolvedValue({
        error: new Error('Test error'),
      });
      
      render(<UpdatePasswordForm />);
      
      const passwordInput = screen.getByLabelText(/new password/i);
      fireEvent.change(passwordInput, { target: { value: 'test' } });
      
      const submitButton = screen.getByRole('button', { name: /save new password/i });
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        const errorElement = screen.getByText('Test error');
        expect(errorElement).toHaveClass('text-red-500');
      });
    });

    it('should render card structure', () => {
      render(<UpdatePasswordForm />);
      
      expect(screen.getByText('Reset Your Password')).toBeInTheDocument();
      expect(screen.getByRole('button')).toBeInTheDocument();
    });
  });
});
