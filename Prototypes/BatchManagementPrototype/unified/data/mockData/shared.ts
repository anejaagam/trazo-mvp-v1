/**
 * Shared Mock Data
 * 
 * Data shared across all domains (users, roles, etc.)
 */

/**
 * Mock Users
 */
export interface IUser {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'manager' | 'grower' | 'technician' | 'compliance';
  createdAt: string;
}

export const mockUsers: IUser[] = [
  {
    id: 'user-1',
    name: 'John Grower',
    email: 'john@example.com',
    role: 'grower',
    createdAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'user-2',
    name: 'Sarah Manager',
    email: 'sarah@example.com',
    role: 'manager',
    createdAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'user-3',
    name: 'Mike Compliance',
    email: 'mike@example.com',
    role: 'compliance',
    createdAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'user-4',
    name: 'Lisa Tech',
    email: 'lisa@example.com',
    role: 'technician',
    createdAt: '2024-01-01T00:00:00Z',
  },
];

/**
 * Mock Facility Info
 */
export interface IFacility {
  id: string;
  name: string;
  license: string;
  address: string;
  phone: string;
  email: string;
}

export const mockFacility: IFacility = {
  id: 'facility-1',
  name: 'TRAZO Demo Facility',
  license: 'LIC-2024-001',
  address: '123 Farm Road, City, State 12345',
  phone: '(555) 123-4567',
  email: 'contact@trazofacility.com',
};
