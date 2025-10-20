/**
 * Tests for Dashboard Header Component
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { DashboardHeader } from '../header';

// Mock LogoutButton component
jest.mock('@/components/auth/logout-button', () => ({
  LogoutButton: () => <button>Sign Out</button>,
}));

describe('DashboardHeader', () => {
  const mockUser = {
    id: 'user-1',
    full_name: 'John Doe',
    email: 'john@example.com',
    role: 'admin',
    organization: {
      name: 'Test Farm',
      jurisdiction: 'US',
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render the header', () => {
      render(<DashboardHeader user={mockUser} />);

      expect(screen.getByPlaceholderText(/search/i)).toBeInTheDocument();
    });

    it('should apply custom className', () => {
      const { container } = render(
        <DashboardHeader user={mockUser} className="custom-class" />
      );

      expect(container.firstChild).toHaveClass('custom-class');
    });

    it('should render search input on desktop', () => {
      render(<DashboardHeader user={mockUser} />);

      const searchInput = screen.getByPlaceholderText(
        /search batches, inventory, tasks/i
      );
      expect(searchInput).toBeInTheDocument();
      expect(searchInput.parentElement).toHaveClass('hidden', 'md:block');
    });

    it('should render mobile menu button', () => {
      render(<DashboardHeader user={mockUser} />);

      const menuButtons = screen.getAllByRole('button');
      const mobileMenuButton = menuButtons.find(
        (button) => button.querySelector('svg') && button.className.includes('md:hidden')
      );
      expect(mobileMenuButton).toBeInTheDocument();
    });
  });

  describe('User Information', () => {
    it('should display user full name', () => {
      render(<DashboardHeader user={mockUser} />);

      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    it('should display user role', () => {
      render(<DashboardHeader user={mockUser} />);

      expect(screen.getByText(/admin/i)).toBeInTheDocument();
    });

    it('should handle role with underscores', () => {
      const userWithUnderscoredRole = {
        ...mockUser,
        role: 'facility_manager',
      };

      render(<DashboardHeader user={userWithUnderscoredRole} />);

      expect(screen.getByText(/facility manager/i)).toBeInTheDocument();
    });

    it('should handle missing organization gracefully', () => {
      const userWithoutOrg = {
        ...mockUser,
        organization: undefined,
      };

      expect(() => {
        render(<DashboardHeader user={userWithoutOrg} />);
      }).not.toThrow();
    });
  });

  describe('Notifications', () => {
    it('should render notifications button', () => {
      render(<DashboardHeader user={mockUser} />);

      const notificationButtons = screen.getAllByRole('button');
      const notificationButton = notificationButtons.find(
        (button) => button.textContent?.includes('3')
      );
      expect(notificationButton).toBeInTheDocument();
    });

    it('should show notification badge with count', () => {
      render(<DashboardHeader user={mockUser} />);

      expect(screen.getByText('3')).toBeInTheDocument();
    });

    it('should render notification button with dropdown trigger', () => {
      render(<DashboardHeader user={mockUser} />);

      const notificationButtons = screen.getAllByRole('button');
      const notificationButton = notificationButtons.find(
        (button) => button.textContent?.includes('3')
      );

      expect(notificationButton).toHaveAttribute('aria-haspopup', 'menu');
    });
  });

  describe('User Menu', () => {
    it('should render user menu dropdown trigger', () => {
      render(<DashboardHeader user={mockUser} />);

      const userMenuButtons = screen.getAllByRole('button');
      const userMenuButton = userMenuButtons.find(
        (button) => !button.textContent?.includes('3') && button.getAttribute('aria-haspopup')
      );
      expect(userMenuButton).toBeDefined();
    });

    it('should display user avatar placeholder', () => {
      render(<DashboardHeader user={mockUser} />);

      const { container } = render(<DashboardHeader user={mockUser} />);
      const avatar = container.querySelector('.h-8.w-8.rounded-full');
      expect(avatar).toBeInTheDocument();
    });

    it('should have user menu with correct aria attributes', () => {
      render(<DashboardHeader user={mockUser} />);

      const userMenuButtons = screen.getAllByRole('button');
      const userMenuButton = userMenuButtons.find(
        (button) => button.getAttribute('aria-haspopup') === 'menu' && 
                     button.textContent?.includes('John Doe')
      );
      expect(userMenuButton).toBeDefined();
      expect(userMenuButton).toHaveAttribute('aria-expanded', 'false');
    });
  });

  describe('Search Functionality', () => {
    it('should render search input', () => {
      render(<DashboardHeader user={mockUser} />);

      const searchInput = screen.getByPlaceholderText(
        /search batches, inventory, tasks/i
      );
      expect(searchInput).toBeInTheDocument();
    });

    it('should allow typing in search input', () => {
      render(<DashboardHeader user={mockUser} />);

      const searchInput = screen.getByPlaceholderText(
        /search batches, inventory, tasks/i
      ) as HTMLInputElement;
      
      fireEvent.change(searchInput, { target: { value: 'batch 123' } });
      expect(searchInput.value).toBe('batch 123');
    });

    it('should render search icon', () => {
      const { container } = render(<DashboardHeader user={mockUser} />);

      const searchIcons = Array.from(container.querySelectorAll('svg')).filter(
        (svg) => svg.classList.contains('lucide-search')
      );
      expect(searchIcons.length).toBeGreaterThan(0);
    });
  });

  describe('Icons', () => {
    it('should render bell icon for notifications', () => {
      const { container } = render(<DashboardHeader user={mockUser} />);

      const bellIcons = Array.from(container.querySelectorAll('svg')).filter(
        (svg) => svg.getAttribute('class')?.includes('lucide-bell')
      );
      expect(bellIcons.length).toBeGreaterThan(0);
    });

    it('should render user icon', () => {
      const { container } = render(<DashboardHeader user={mockUser} />);

      const userIcons = Array.from(container.querySelectorAll('svg')).filter(
        (svg) => svg.getAttribute('class')?.includes('lucide-user')
      );
      expect(userIcons.length).toBeGreaterThan(0);
    });

    it('should render menu icon for mobile', () => {
      const { container } = render(<DashboardHeader user={mockUser} />);

      const menuIcons = Array.from(container.querySelectorAll('svg')).filter(
        (svg) => svg.getAttribute('class')?.includes('lucide-menu')
      );
      expect(menuIcons.length).toBeGreaterThan(0);
    });
  });

  describe('Responsive Behavior', () => {
    it('should hide search on mobile', () => {
      const { container } = render(<DashboardHeader user={mockUser} />);

      const searchContainer = container.querySelector('.hidden.md\\:block');
      expect(searchContainer).toBeInTheDocument();
    });

    it('should show mobile menu button only on small screens', () => {
      render(<DashboardHeader user={mockUser} />);

      const menuButtons = screen.getAllByRole('button');
      const mobileMenuButton = menuButtons.find(
        (button) => button.className.includes('md:hidden')
      );
      expect(mobileMenuButton).toHaveClass('md:hidden');
    });

    it('should show user info on desktop only', () => {
      render(<DashboardHeader user={mockUser} />);

      const { container } = render(<DashboardHeader user={mockUser} />);
      const userInfo = container.querySelector('.hidden.md\\:block.text-left');
      expect(userInfo).toBeInTheDocument();
    });
  });
});
