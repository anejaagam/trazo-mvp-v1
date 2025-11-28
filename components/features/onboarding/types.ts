// Types for persisting step data
export interface InvitedUserData {
  id: string;
  email: string;
  role: string;
  status: 'pending' | 'sent' | 'error';
}

export interface OnboardingStepData {
  invitedUsers: InvitedUserData[];
  selectedSOPs: string[];
  selectedCategories: string[];
  selectedCultivars: string[];
  customCultivars: Array<{ name: string; type: string }>;
  selectedRecipes: string[];
}

export interface OnboardingStepProps {
  organization: {
    id: string;
    name: string;
    plant_type: string;
    onboarding_step: number;
    onboarding_completed: boolean;
  };
  onComplete: () => void;
  onSkip: () => void;
  stepData: OnboardingStepData;
  updateStepData: (updates: Partial<OnboardingStepData>) => void;
}
