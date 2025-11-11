// Form Data Types
export interface FormData {
  // Step 1 - User Details
  name: string;
  email: string;
  phoneNumber: string;
  role: string;
  
  // Step 2 - Company Details
  companyName: string;
  companyWebsite: string;
  farmLocation: string;
  
  // Step 3 - Emergency Contact
  emergencyContactPerson: string;
  emergencyContactEmail: string;
  emergencyContactNumber: string;
  
  // Step 4 - Farm Details
  numberOfContainers: string;
  cropType: string;
  growingEnvironment: string;
}

// Step Component Props
export interface StepProps<T extends Partial<FormData>> {
  formData: T;
  updateFormData: (field: keyof FormData, value: string) => void;
  onNext: () => void;
}

export interface SuccessStepProps {
  formData: FormData;
  onStartOver: () => void;
}

// Dropdown Options
export const ROLE_OPTIONS = [
  'Farm Manager',
  'Administrator',
  'Technician',
  'Operator',
  'Owner',
] as const;

export const CROP_TYPES = [
  'Produce',
  'Cannabis',
] as const;

export const GROWING_ENVIRONMENTS = [
  'Indoor',
  'Outdoor',
] as const;

export type RoleOption = typeof ROLE_OPTIONS[number];
export type CropType = typeof CROP_TYPES[number];
export type GrowingEnvironment = typeof GROWING_ENVIRONMENTS[number];
