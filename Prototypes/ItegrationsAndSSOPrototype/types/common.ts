// Common shared types across the application

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  facilityId?: string;
  createdAt: string;
  lastLogin?: string;
}

export type UserRole = "admin" | "manager" | "operator" | "viewer";

export interface Facility {
  id: string;
  name: string;
  licenseNumber: string;
  state: string;
  type: FacilityType;
  address: {
    street: string;
    city: string;
    state: string;
    zip: string;
  };
  contact: {
    phone: string;
    email: string;
  };
}

export type FacilityType = 
  | "cultivation" 
  | "manufacturing" 
  | "retail" 
  | "testing-lab" 
  | "distribution";

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
  };
}

export interface PaginationParams {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface DateRange {
  start: string;
  end: string;
}

export type NotificationType = 
  | "alert" 
  | "warning" 
  | "info" 
  | "success" 
  | "task-reminder"
  | "compliance-deadline";

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  actionUrl?: string;
  metadata?: Record<string, any>;
}
