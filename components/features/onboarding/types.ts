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
}
