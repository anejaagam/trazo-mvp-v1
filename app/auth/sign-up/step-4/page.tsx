"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Label } from "@/components/ui/form-label";
import { Header } from "@/components/header";
import { ProgressIndicator } from "@/components/ui/progress-indicator";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Package } from "lucide-react";
import { completeSignup } from "../actions";

export default function SignUpStep4() {
  const [formData, setFormData] = useState({
    numberOfContainers: "",
    cropType: "produce", // produce or cannabis
    growingEnvironment: "indoor" // indoor or outdoor
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    // Check if user completed previous steps
    const step1Data = localStorage.getItem('signupStep1');
    const step2Data = localStorage.getItem('signupStep2');
    const step3Data = localStorage.getItem('signupStep3');
    if (!step1Data || !step2Data || !step3Data) {
      window.location.href = '/auth/sign-up';
    }
  }, []);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleComplete = async () => {
    setIsSubmitting(true);
    setError("");
    
    try {
      // Store final form data
      localStorage.setItem('signupStep4', JSON.stringify(formData));
      
      // Get all form data from localStorage
      const step1Data = localStorage.getItem('signupStep1');
      const step2Data = localStorage.getItem('signupStep2');
      const step3Data = localStorage.getItem('signupStep3');
      
      if (!step1Data || !step2Data || !step3Data) {
        throw new Error('Missing form data from previous steps');
      }
      
      // Create FormData object for server action
      const submitFormData = new FormData();
      submitFormData.append('step1Data', step1Data);
      submitFormData.append('step2Data', step2Data);
      submitFormData.append('step3Data', step3Data);
      submitFormData.append('step4Data', JSON.stringify(formData));
      
      console.log('Submitting signup data...');
      
      // Call server action
      await completeSignup(submitFormData);
      
      // Clear localStorage after successful signup
      localStorage.removeItem('signupStep1');
      localStorage.removeItem('signupStep2');
      localStorage.removeItem('signupStep3');
      localStorage.removeItem('signupStep4');
      
    } catch (err) {
      console.error('Error completing signup:', err);
      setError(err instanceof Error ? err.message : 'Failed to create account. Please try again.');
      setIsSubmitting(false);
    }
  };

  const handleBack = () => {
    window.location.href = '/auth/sign-up/step-3';
  };

  return (
    <div className="min-h-screen bg-white">
      <Header variant="auth" showNavigation={false} />
      
      <main className="flex-1">
        <div className="container mx-auto px-40 py-5">
          <div className="max-w-6xl mx-auto">
            {/* Progress Indicator */}
            <div className="mb-8 px-4">
              <ProgressIndicator currentStep={4} totalSteps={4} />
            </div>

            {/* Title Section */}
            <div className="text-center mb-8">
              <h1 className="font-body font-bold text-display-1 text-secondary-800">
                Farm Details
              </h1>
            </div>

            {/* Sign-up Form */}
            <div className="max-w-lg mx-auto space-y-6">
              <div className="space-y-2">
                <Label htmlFor="numberOfContainers" required>Number of Containers</Label>
                <Field
                  id="numberOfContainers"
                  type="number"
                  placeholder="Number of Containers"
                  value={formData.numberOfContainers}
                  onChange={(e) => handleInputChange('numberOfContainers', e.target.value)}
                  rightIcon={<Package className="w-4 h-4" />}
                  className="bg-brand-lighter-green-50/60"
                />
                <p className="text-sm text-neutral-600">
                  Specify the total number of containers you manage. This information is crucial for resource allocation and planning.
                </p>
              </div>

              {/* Crop Type Selection */}
              <div className="space-y-3">
                <Label>Type of Crop</Label>
                <RadioGroup
                  value={formData.cropType}
                  onValueChange={(value) => handleInputChange('cropType', value)}
                  className="flex gap-4"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="produce" id="produce" />
                    <Label htmlFor="produce" className="text-sm font-normal">Produce</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="cannabis" id="cannabis" />
                    <Label htmlFor="cannabis" className="text-sm font-normal">Cannabis</Label>
                  </div>
                </RadioGroup>
                <p className="text-sm text-neutral-600">
                  Select the primary type of crop you cultivate. This helps us customize our tools and recommendations for your specific needs.
                </p>
              </div>

              {/* Growing Environment Selection */}
              <div className="space-y-3">
                <Label>Growing Environment</Label>
                <RadioGroup
                  value={formData.growingEnvironment}
                  onValueChange={(value) => handleInputChange('growingEnvironment', value)}
                  className="flex gap-4"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="indoor" id="indoor" />
                    <Label htmlFor="indoor" className="text-sm font-normal">Indoor</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="outdoor" id="outdoor" />
                    <Label htmlFor="outdoor" className="text-sm font-normal">Outdoor</Label>
                  </div>
                </RadioGroup>
                <p className="text-sm text-neutral-600">
                  Indicate whether your farm operates indoors or outdoors. This affects the types of environmental controls and monitoring systems you may require.
                </p>
              </div>

              {/* Error Message */}
              {error && (
                <div className="bg-error/10 border border-error/20 rounded-lg p-4">
                  <p className="text-sm text-error">{error}</p>
                </div>
              )}

              {/* Navigation Buttons */}
              <div className="flex justify-center gap-4 pt-12">
                <Button 
                  variant="outline"
                  size="lg"
                  onClick={handleBack}
                  disabled={isSubmitting}
                  className="px-8"
                >
                  Back
                </Button>
                <Button 
                  variant="default"
                  size="lg"
                  onClick={handleComplete}
                  disabled={!formData.numberOfContainers || isSubmitting}
                  className="bg-brand-lightest-green-800 text-secondary-800 hover:bg-brand-lightest-green-700 px-8"
                >
                  {isSubmitting ? 'Creating Account...' : 'Complete Setup'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}