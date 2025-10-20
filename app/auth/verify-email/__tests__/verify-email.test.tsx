import { render, screen } from '@testing-library/react';
import VerifyEmailPage from '../page';
import { useSearchParams } from 'next/navigation';

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useSearchParams: jest.fn(),
}));

describe('Verify Email Page', () => {
  const mockSearchParams = {
    get: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useSearchParams as jest.Mock).mockReturnValue(mockSearchParams);
  });

  describe('Rendering', () => {
    it('should render verify email page', () => {
      mockSearchParams.get.mockReturnValue(null);
      
      render(<VerifyEmailPage />);
      
      expect(screen.getByText('Check your email')).toBeInTheDocument();
    });

    it('should render mail icon', () => {
      mockSearchParams.get.mockReturnValue(null);
      
      render(<VerifyEmailPage />);
      
      const icon = document.querySelector('svg.lucide-mail');
      expect(icon).toBeInTheDocument();
    });

    it('should render main description', () => {
      mockSearchParams.get.mockReturnValue(null);
      
      render(<VerifyEmailPage />);
      
      expect(screen.getByText(/We've sent a verification link to/i)).toBeInTheDocument();
    });

    it('should render verification instructions', () => {
      mockSearchParams.get.mockReturnValue(null);
      
      render(<VerifyEmailPage />);
      
      expect(screen.getByText(/Click the link in the email to verify your account/i)).toBeInTheDocument();
    });

    it('should render expiration notice', () => {
      mockSearchParams.get.mockReturnValue(null);
      
      render(<VerifyEmailPage />);
      
      expect(screen.getByText(/The link will expire in 24 hours/i)).toBeInTheDocument();
    });
  });

  describe('Email Display', () => {
    it('should display email when provided in URL params', () => {
      mockSearchParams.get.mockReturnValue('test@example.com');
      
      render(<VerifyEmailPage />);
      
      expect(screen.getByText('test@example.com')).toBeInTheDocument();
    });

    it('should not show email when not provided', () => {
      mockSearchParams.get.mockReturnValue(null);
      
      render(<VerifyEmailPage />);
      
      const description = screen.getByText(/We've sent a verification link to/i);
      expect(description).toBeInTheDocument();
      // Should not have the email displayed
      expect(screen.queryByText(/@/)).not.toBeInTheDocument();
    });

    it('should bold the email address', () => {
      mockSearchParams.get.mockReturnValue('user@test.com');
      
      render(<VerifyEmailPage />);
      
      const emailElement = screen.getByText('user@test.com');
      expect(emailElement.tagName).toBe('STRONG');
    });
  });

  describe('Help Content', () => {
    it('should show help section title', () => {
      mockSearchParams.get.mockReturnValue(null);
      
      render(<VerifyEmailPage />);
      
      expect(screen.getByText(/Didn't receive the email?/i)).toBeInTheDocument();
    });

    it('should show spam folder reminder', () => {
      mockSearchParams.get.mockReturnValue(null);
      
      render(<VerifyEmailPage />);
      
      expect(screen.getByText(/Check your spam or junk folder/i)).toBeInTheDocument();
    });

    it('should show correct email reminder', () => {
      mockSearchParams.get.mockReturnValue(null);
      
      render(<VerifyEmailPage />);
      
      expect(screen.getByText(/Make sure you entered the correct email address/i)).toBeInTheDocument();
    });

    it('should show wait reminder', () => {
      mockSearchParams.get.mockReturnValue(null);
      
      render(<VerifyEmailPage />);
      
      expect(screen.getByText(/Wait a few minutes and check again/i)).toBeInTheDocument();
    });
  });

  describe('Navigation', () => {
    it('should render back to login link', () => {
      mockSearchParams.get.mockReturnValue(null);
      
      render(<VerifyEmailPage />);
      
      const loginLink = screen.getByRole('link', { name: /back to login/i });
      expect(loginLink).toBeInTheDocument();
    });

    it('should have correct login link href', () => {
      mockSearchParams.get.mockReturnValue(null);
      
      render(<VerifyEmailPage />);
      
      const loginLink = screen.getByRole('link', { name: /back to login/i });
      expect(loginLink).toHaveAttribute('href', '/auth/login');
    });
  });

  describe('UI/UX', () => {
    it('should render card structure', () => {
      mockSearchParams.get.mockReturnValue(null);
      
      render(<VerifyEmailPage />);
      
      expect(screen.getByText('Check your email')).toBeInTheDocument();
    });

    it('should display icon with correct styling', () => {
      mockSearchParams.get.mockReturnValue(null);
      
      render(<VerifyEmailPage />);
      
      const iconContainer = document.querySelector('.rounded-full.bg-blue-100');
      expect(iconContainer).toBeInTheDocument();
    });

    it('should render help list with bullet points', () => {
      mockSearchParams.get.mockReturnValue(null);
      
      render(<VerifyEmailPage />);
      
      const list = screen.getByText(/Check your spam/i).closest('ul');
      expect(list).toHaveClass('list-disc');
    });
  });
});
