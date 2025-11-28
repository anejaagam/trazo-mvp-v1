"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ProgressIndicator } from "@/components/ui/progress-indicator";
import { createClient } from "@/lib/supabase/client";
import { 
  Users, 
  FileText, 
  Package, 
  Leaf, 
  ChefHat,
  CheckCircle2,
  Loader2
} from "lucide-react";

// Step components
import { InviteUsersStep } from "@/components/features/onboarding/invite-users-step";
import { SOPTemplatesStep } from "@/components/features/onboarding/sop-templates-step";
import { InventorySetupStep } from "@/components/features/onboarding/inventory-setup-step";
import { CropListStep } from "@/components/features/onboarding/crop-list-step";
import { RecipeTemplatesStep } from "@/components/features/onboarding/recipe-templates-step";

interface OrganizationData {
  id: string;
  name: string;
  plant_type: string;
  onboarding_step: number;
  onboarding_completed: boolean;
}

const STEPS = [
  { 
    id: 1, 
    title: "Team Setup", 
    description: "Invite users and assign roles",
    icon: Users,
    component: InviteUsersStep
  },
  { 
    id: 2, 
    title: "SOPs", 
    description: "Set up standard operating procedures",
    icon: FileText,
    component: SOPTemplatesStep
  },
  { 
    id: 3, 
    title: "Inventory", 
    description: "Configure your inventory categories",
    icon: Package,
    component: InventorySetupStep
  },
  { 
    id: 4, 
    title: "Crops", 
    description: "Build your crop/produce list",
    icon: Leaf,
    component: CropListStep
  },
  { 
    id: 5, 
    title: "Recipes", 
    description: "Set up growing recipes",
    icon: ChefHat,
    component: RecipeTemplatesStep
  },
];

export default function OnboardingPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [organization, setOrganization] = useState<OrganizationData | null>(null);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);

  useEffect(() => {
    loadOrganizationData();
  }, []);

  async function loadOrganizationData() {
    try {
      const supabase = createClient();
      
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/auth/login');
        return;
      }

      // Get user's organization
      const { data: userData } = await supabase
        .from('users')
        .select('organization_id, role')
        .eq('id', user.id)
        .single();

      if (!userData?.organization_id) {
        router.push('/dashboard');
        return;
      }

      // Verify user is org_admin
      if (userData.role !== 'org_admin') {
        router.push('/dashboard');
        return;
      }

      // Get organization data
      const { data: orgData } = await supabase
        .from('organizations')
        .select('id, name, plant_type, onboarding_step, onboarding_completed')
        .eq('id', userData.organization_id)
        .single();

      if (orgData?.onboarding_completed) {
        router.push('/dashboard');
        return;
      }

      setOrganization(orgData);
      setCurrentStep(orgData?.onboarding_step || 1);
      
      // Build completed steps array
      const completed: number[] = [];
      for (let i = 1; i < (orgData?.onboarding_step || 1); i++) {
        completed.push(i);
      }
      setCompletedSteps(completed);

    } catch (error) {
      console.error('Error loading organization data:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleStepComplete() {
    if (!organization) return;
    
    try {
      const supabase = createClient();
      const nextStep = currentStep + 1;
      
      // Update completed steps
      setCompletedSteps([...completedSteps, currentStep]);
      
      if (nextStep > STEPS.length) {
        // All steps completed
        await supabase
          .from('organizations')
          .update({ 
            onboarding_completed: true,
            onboarding_completed_at: new Date().toISOString(),
            onboarding_step: STEPS.length
          })
          .eq('id', organization.id);
        
        router.push('/dashboard');
      } else {
        // Move to next step
        await supabase
          .from('organizations')
          .update({ onboarding_step: nextStep })
          .eq('id', organization.id);
        
        setCurrentStep(nextStep);
      }
    } catch (error) {
      console.error('Error updating step:', error);
    }
  }

  async function handleSkip() {
    await handleStepComplete();
  }

  function goToStep(stepId: number) {
    if (completedSteps.includes(stepId) || stepId === currentStep) {
      setCurrentStep(stepId);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-brand-lighter-green-50/30 to-white">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-brand-lighter-green-600 mx-auto mb-4" />
          <p className="text-secondary-600">Loading your setup wizard...</p>
        </div>
      </div>
    );
  }

  if (!organization) {
    return null;
  }

  const CurrentStepComponent = STEPS[currentStep - 1].component;

  return (
    <div className="h-screen flex flex-col lg:flex-row overflow-hidden">
      {/* Left Sidebar - Steps Navigation */}
      <div className="lg:w-80 bg-secondary-800 relative overflow-hidden flex-shrink-0">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-10 w-48 h-48 bg-brand-lightest-green-500 rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-10 w-64 h-64 bg-brand-lighter-green-500 rounded-full blur-3xl" />
        </div>
        
        {/* Content */}
        <div className="relative z-10 flex flex-col h-full p-6 lg:p-8">
          {/* Logo */}
          <Link href="/dashboard" className="flex items-center gap-3 mb-8">
            <div className="w-10 h-11 relative">
              <Image
                src="/images/colorLogo.png"
                alt="TRAZO Logo"
                width={40}
                height={44}
                className="w-full h-full object-contain"
              />
            </div>
            <span className="text-brand-cream text-2xl font-display font-semibold tracking-wider">
              TRAZO
            </span>
          </Link>

          {/* Welcome Text */}
          <div className="mb-8">
            <h1 className="text-brand-cream text-2xl font-display font-bold mb-2">
              Welcome Aboard!
            </h1>
            <p className="text-brand-cream/70 text-sm">
              Let&apos;s set up <span className="text-brand-lightest-green-400 font-medium">{organization.name}</span> for success.
            </p>
          </div>

          {/* Steps List */}
          <nav className="flex-1 space-y-2">
            {STEPS.map((step) => {
              const isCompleted = completedSteps.includes(step.id);
              const isCurrent = currentStep === step.id;
              const isClickable = isCompleted || isCurrent;
              
              return (
                <button
                  key={step.id}
                  onClick={() => goToStep(step.id)}
                  disabled={!isClickable}
                  className={`w-full flex items-center gap-4 p-3 rounded-xl transition-all duration-200 text-left ${
                    isCurrent 
                      ? 'bg-brand-lighter-green-500/20 border border-brand-lighter-green-500/30' 
                      : isCompleted
                        ? 'hover:bg-secondary-700/50 cursor-pointer'
                        : 'opacity-50 cursor-not-allowed'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    isCompleted 
                      ? 'bg-brand-lighter-green-500 text-white' 
                      : isCurrent
                        ? 'bg-brand-lighter-green-500/20 text-brand-lighter-green-400 border-2 border-brand-lighter-green-500'
                        : 'bg-secondary-700 text-secondary-400'
                  }`}>
                    {isCompleted ? (
                      <CheckCircle2 className="w-5 h-5" />
                    ) : (
                      <step.icon className="w-5 h-5" />
                    )}
                  </div>
                  <div>
                    <p className={`font-medium text-sm ${
                      isCurrent ? 'text-brand-cream' : isCompleted ? 'text-brand-cream/80' : 'text-secondary-400'
                    }`}>
                      {step.title}
                    </p>
                    <p className={`text-xs ${
                      isCurrent ? 'text-brand-cream/60' : 'text-secondary-500'
                    }`}>
                      {step.description}
                    </p>
                  </div>
                </button>
              );
            })}
          </nav>

          {/* Footer */}
          <div className="mt-8 pt-6 border-t border-secondary-700">
            <p className="text-brand-cream/40 text-xs">
              Complete all steps to access your dashboard
            </p>
          </div>
        </div>
      </div>

      {/* Right Side - Step Content */}
      <div className="flex-1 flex flex-col bg-gradient-to-b from-brand-lighter-green-50/30 to-white overflow-hidden">
        {/* Progress Bar (Mobile) */}
        <div className="lg:hidden p-4 bg-white border-b flex-shrink-0">
          <ProgressIndicator currentStep={currentStep} totalSteps={STEPS.length} />
        </div>

        {/* Step Content - Scrollable */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-8 lg:p-12">
          <CurrentStepComponent 
            organization={organization}
            onComplete={handleStepComplete}
            onSkip={handleSkip}
          />
        </div>
      </div>
    </div>
  );
}
