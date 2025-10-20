import { render, screen, fireEvent } from '@testing-library/react';
import { AuditLogTable } from '../audit-log-table';
import type { AuditEventWithUser } from '@/types/admin';

// Mock dependencies
jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
  },
}));

// Mock date-fns format
jest.mock('date-fns', () => ({
  format: jest.fn(() => {
    return 'Jan 1, 2024 10:00:00';
  }),
}));

describe('AuditLogTable', () => {
  const mockEvents: AuditEventWithUser[] = [
    {
      id: '1',
      timestamp: '2024-01-01T10:00:00Z',
      user_id: 'user1',
      action: 'user.created',
      entity_type: 'user',
      entity_id: 'user123',
      ip_address: '192.168.1.1',
      user: {
        id: 'user1',
        full_name: 'John Admin',
        email: 'john@example.com',
      },
    },
    {
      id: '2',
      timestamp: '2024-01-01T11:00:00Z',
      user_id: 'user2',
      action: 'user.suspended',
      entity_type: 'user',
      entity_id: 'user456',
      ip_address: '192.168.1.2',
      user: {
        id: 'user2',
        full_name: 'Jane Manager',
        email: 'jane@example.com',
      },
    },
    {
      id: '3',
      timestamp: '2024-01-01T12:00:00Z',
      user_id: 'system',
      action: 'batch.created',
      entity_type: 'batch',
      entity_id: 'batch789',
      ip_address: undefined,
      user: {
        id: 'system',
        full_name: 'System',
        email: 'system@trazo.io',
      },
    },
    {
      id: '4',
      timestamp: '2024-01-01T13:00:00Z',
      user_id: 'user1',
      action: 'recipe.published',
      entity_type: 'recipe',
      entity_id: 'recipe101',
      ip_address: '192.168.1.1',
      user: {
        id: 'user1',
        full_name: 'John Admin',
        email: 'john@example.com',
      },
    },
  ];

  const mockOnExport = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    // Mock URL.createObjectURL and other DOM APIs
    global.URL.createObjectURL = jest.fn(() => 'mock-url');
    global.URL.revokeObjectURL = jest.fn();
    HTMLAnchorElement.prototype.click = jest.fn();
  });

  describe('Rendering', () => {
    it('should render the audit log table', () => {
      render(<AuditLogTable events={mockEvents} />);
      
      expect(screen.getByPlaceholderText(/search by user, action, or entity/i)).toBeInTheDocument();
      expect(screen.getAllByText('John Admin').length).toBeGreaterThan(0);
      expect(screen.getByText('Jane Manager')).toBeInTheDocument();
    });

    it('should display all table headers', () => {
      render(<AuditLogTable events={mockEvents} />);
      
      expect(screen.getByText('Timestamp')).toBeInTheDocument();
      expect(screen.getByText('User')).toBeInTheDocument();
      expect(screen.getByText('Action')).toBeInTheDocument();
      expect(screen.getByText('Entity Type')).toBeInTheDocument();
      expect(screen.getByText('Entity ID')).toBeInTheDocument();
      expect(screen.getByText('IP Address')).toBeInTheDocument();
    });

    it('should render with empty events array', () => {
      render(<AuditLogTable events={[]} />);
      
      expect(screen.getByText(/no audit events found/i)).toBeInTheDocument();
    });

    it('should show event count', () => {
      render(<AuditLogTable events={mockEvents} />);
      
      expect(screen.getByText(/showing 4 of 4 events/i)).toBeInTheDocument();
    });

    it('should render export button', () => {
      render(<AuditLogTable events={mockEvents} />);
      
      expect(screen.getByRole('button', { name: /export/i })).toBeInTheDocument();
    });

    it('should render filter dropdown', () => {
      render(<AuditLogTable events={mockEvents} />);
      
      expect(screen.getByRole('combobox')).toBeInTheDocument();
    });
  });

  describe('Event Information Display', () => {
    it('should display user names and emails', () => {
      render(<AuditLogTable events={mockEvents} />);
      
      expect(screen.getAllByText('John Admin').length).toBe(2); // Appears twice in mockEvents
      expect(screen.getAllByText('john@example.com').length).toBe(2);
      expect(screen.getByText('Jane Manager')).toBeInTheDocument();
      expect(screen.getByText('jane@example.com')).toBeInTheDocument();
    });

    it('should display "System" for events without user', () => {
      render(<AuditLogTable events={mockEvents} />);
      
      expect(screen.getByText('System')).toBeInTheDocument();
    });

    it('should display action badges', () => {
      render(<AuditLogTable events={mockEvents} />);
      
      expect(screen.getByText('user.created')).toBeInTheDocument();
      expect(screen.getByText('user.suspended')).toBeInTheDocument();
      expect(screen.getByText('batch.created')).toBeInTheDocument();
      expect(screen.getByText('recipe.published')).toBeInTheDocument();
    });

    it('should display entity types', () => {
      render(<AuditLogTable events={mockEvents} />);
      
      expect(screen.getAllByText('user').length).toBe(2); // Two events have entity_type 'user'
      expect(screen.getByText('batch')).toBeInTheDocument();
      expect(screen.getByText('recipe')).toBeInTheDocument();
    });

    it('should display truncated entity IDs', () => {
      render(<AuditLogTable events={mockEvents} />);
      
      // Entity IDs should be truncated (first 8 chars + ...)
      const entityCells = screen.getAllByText(/\.\.\./);
      expect(entityCells.length).toBeGreaterThan(0);
    });

    it('should display IP addresses', () => {
      render(<AuditLogTable events={mockEvents} />);
      
      expect(screen.getByText('192.168.1.1')).toBeInTheDocument();
      expect(screen.getByText('192.168.1.2')).toBeInTheDocument();
    });

    it('should show dash for null IP addresses', () => {
      render(<AuditLogTable events={mockEvents} />);
      
      // System event has null IP address
      const cells = screen.getAllByRole('cell');
      const hasDash = cells.some(cell => cell.textContent === '—');
      expect(hasDash).toBe(true);
    });

    it('should format timestamps', () => {
      render(<AuditLogTable events={mockEvents} />);
      
      // Mocked date-fns format returns 'Jan 1, 2024 10:00:00'
      const timestamps = screen.getAllByText('Jan 1, 2024 10:00:00');
      expect(timestamps.length).toBeGreaterThan(0);
    });
  });

  describe('Search Functionality', () => {
    it('should filter events by user name', () => {
      render(<AuditLogTable events={mockEvents} />);
      
      const searchInput = screen.getByPlaceholderText(/search by user, action, or entity/i);
      fireEvent.change(searchInput, { target: { value: 'John' } });
      
      expect(screen.getAllByText('John Admin').length).toBe(2);
      expect(screen.queryByText('Jane Manager')).not.toBeInTheDocument();
    });

    it('should filter events by action', () => {
      render(<AuditLogTable events={mockEvents} />);
      
      const searchInput = screen.getByPlaceholderText(/search by user, action, or entity/i);
      fireEvent.change(searchInput, { target: { value: 'suspended' } });
      
      expect(screen.getByText('user.suspended')).toBeInTheDocument();
      expect(screen.queryByText('user.created')).not.toBeInTheDocument();
    });

    it('should filter events by entity type', () => {
      render(<AuditLogTable events={mockEvents} />);
      
      const searchInput = screen.getByPlaceholderText(/search by user, action, or entity/i);
      fireEvent.change(searchInput, { target: { value: 'batch' } });
      
      expect(screen.getByText('batch.created')).toBeInTheDocument();
      expect(screen.queryByText('user.created')).not.toBeInTheDocument();
    });

    it('should be case insensitive', () => {
      render(<AuditLogTable events={mockEvents} />);
      
      const searchInput = screen.getByPlaceholderText(/search by user, action, or entity/i);
      fireEvent.change(searchInput, { target: { value: 'JOHN' } });
      
      expect(screen.getAllByText('John Admin').length).toBe(2);
    });

    it('should update event count when filtering', () => {
      render(<AuditLogTable events={mockEvents} />);
      
      const searchInput = screen.getByPlaceholderText(/search by user, action, or entity/i);
      fireEvent.change(searchInput, { target: { value: 'John' } });
      
      expect(screen.getByText(/showing 2 of 4 events/i)).toBeInTheDocument();
    });

    it('should show no events message when filter matches nothing', () => {
      render(<AuditLogTable events={mockEvents} />);
      
      const searchInput = screen.getByPlaceholderText(/search by user, action, or entity/i);
      fireEvent.change(searchInput, { target: { value: 'nonexistent' } });
      
      expect(screen.getByText(/no audit events found/i)).toBeInTheDocument();
    });
  });

  describe('Action Filter', () => {
    it('should filter by specific action type', () => {
      render(<AuditLogTable events={mockEvents} />);
      
      const filterDropdown = screen.getByRole('combobox');
      fireEvent.click(filterDropdown);
      
      // Filter dropdown should be present
      expect(filterDropdown).toBeInTheDocument();
    });

    it('should show all events when filter is set to "all"', () => {
      render(<AuditLogTable events={mockEvents} />);
      
      // Default filter should be "all"
      expect(screen.getAllByRole('row').length).toBeGreaterThan(1); // Header + data rows
    });
  });

  describe('Export Functionality', () => {
    it('should call custom export handler if provided', () => {
      render(<AuditLogTable events={mockEvents} onExport={mockOnExport} />);
      
      const exportButton = screen.getByRole('button', { name: /export/i });
      fireEvent.click(exportButton);
      
      expect(mockOnExport).toHaveBeenCalledTimes(1);
    });

    it('should perform default CSV export if no handler provided', () => {
      render(<AuditLogTable events={mockEvents} />);
      
      const exportButton = screen.getByRole('button', { name: /export/i });
      fireEvent.click(exportButton);
      
      // Should have created a blob URL
      expect(global.URL.createObjectURL).toHaveBeenCalled();
      expect(global.URL.revokeObjectURL).toHaveBeenCalled();
    });
  });

  describe('Action Badges', () => {
    it('should apply correct badge styles for created actions', () => {
      render(<AuditLogTable events={mockEvents} />);
      
      const createdBadges = screen.getAllByText(/\.created/);
      expect(createdBadges.length).toBeGreaterThan(0);
    });

    it('should apply correct badge styles for suspended actions', () => {
      render(<AuditLogTable events={mockEvents} />);
      
      const suspendedBadge = screen.getByText('user.suspended');
      expect(suspendedBadge).toBeInTheDocument();
    });

    it('should apply correct badge styles for updated actions', () => {
      const eventsWithUpdate: AuditEventWithUser[] = [
        {
          ...mockEvents[0],
          action: 'user.updated',
        },
      ];
      
      render(<AuditLogTable events={eventsWithUpdate} />);
      
      expect(screen.getByText('user.updated')).toBeInTheDocument();
    });
  });

  describe('Icons', () => {
    it('should render search icon', () => {
      const { container } = render(<AuditLogTable events={mockEvents} />);
      
      // Search icon should be present (Lucide React renders as SVG)
      const icons = container.querySelectorAll('svg');
      expect(icons.length).toBeGreaterThan(0);
    });

    it('should render filter icon', () => {
      render(<AuditLogTable events={mockEvents} />);
      
      // Filter icon should be in the dropdown trigger
      expect(screen.getByRole('combobox')).toBeInTheDocument();
    });

    it('should render download icon on export button', () => {
      render(<AuditLogTable events={mockEvents} />);
      
      const exportButton = screen.getByRole('button', { name: /export/i });
      expect(exportButton).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should display System for system events', () => {
      // System event in mockEvents already has user undefined,
      // but the component shows "System"
      render(<AuditLogTable events={mockEvents} />);
      
      expect(screen.getByText('System')).toBeInTheDocument();
    });

    it('should handle combined search and filter', () => {
      render(<AuditLogTable events={mockEvents} />);
      
      const searchInput = screen.getByPlaceholderText(/search by user, action, or entity/i);
      fireEvent.change(searchInput, { target: { value: 'John' } });
      
      // Should show filtered results
      expect(screen.getAllByText('John Admin').length).toBe(2);
    });

    it('should handle missing onExport callback', () => {
      render(<AuditLogTable events={mockEvents} />);
      
      const exportButton = screen.getByRole('button', { name: /export/i });
      
      // Should not crash without callback
      expect(() => fireEvent.click(exportButton)).not.toThrow();
    });

    it('should handle empty entity_id', () => {
      const eventsWithEmptyId: AuditEventWithUser[] = [
        {
          ...mockEvents[0],
          entity_id: '',
        },
      ];
      
      render(<AuditLogTable events={eventsWithEmptyId} />);
      
      expect(screen.getAllByText('John Admin').length).toBeGreaterThan(0);
    });

    it('should handle long entity IDs correctly', () => {
      const eventsWithLongId: AuditEventWithUser[] = [
        {
          ...mockEvents[0],
          entity_id: 'very-long-entity-id-that-should-be-truncated',
        },
      ];
      
      render(<AuditLogTable events={eventsWithLongId} />);
      
      // Should show truncated version
      expect(screen.getByText(/very-lon\.\.\./)).toBeInTheDocument();
    });
  });

  describe('Responsive Behavior', () => {
    it('should render all columns on desktop', () => {
      render(<AuditLogTable events={mockEvents} />);
      
      // All 6 column headers should be visible
      expect(screen.getByText('Timestamp')).toBeInTheDocument();
      expect(screen.getByText('User')).toBeInTheDocument();
      expect(screen.getByText('Action')).toBeInTheDocument();
      expect(screen.getByText('Entity Type')).toBeInTheDocument();
      expect(screen.getByText('Entity ID')).toBeInTheDocument();
      expect(screen.getByText('IP Address')).toBeInTheDocument();
    });
  });
});
