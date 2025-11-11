"use client";

import { cn } from "@/lib/utils";

interface ProgressIndicatorProps {
  currentStep: number;
  totalSteps: number;
  className?: string;
}

export function ProgressIndicator({ currentStep, totalSteps, className }: ProgressIndicatorProps) {
  const progressPercentage = (currentStep / totalSteps) * 100;

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex items-center justify-between">
        <p className="text-body-base font-medium text-secondary-800">
          Step {currentStep} of {totalSteps}
        </p>
      </div>
      <div className="w-full bg-brand-lightest-green-100 rounded-sm h-2">
        <div 
          className="bg-success h-2 rounded-sm transition-all duration-300"
          style={{ width: `${progressPercentage}%` }}
        />
      </div>
    </div>
  );
}