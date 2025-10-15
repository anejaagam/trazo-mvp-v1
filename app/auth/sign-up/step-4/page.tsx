"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Label } from "@/components/ui/form-label";
import { Header } from "@/components/header";
import { ProgressIndicator } from "@/components/ui/progress-indicator";
import { Checkbox } from "@/components/ui/checkbox";
import { Package } from "lucide-react";

export default function SignUpStep4() {
  const [formData, setFormData] = useState({
    numberOfContainers: "",
    cropType: "produce", // produce or cannabis
    growingEnvironment: "indoor" // indoor or outdoor
  });

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

  const handleComplete = () => {
    // Store final form data and complete signup
    localStorage.setItem('signupStep4', JSON.stringify(formData));
    
    // Combine all form data
    const allFormData = {
      step1: JSON.parse(localStorage.getItem('signupStep1') || '{}'),
      step2: JSON.parse(localStorage.getItem('signupStep2') || '{}'),
      step3: JSON.parse(localStorage.getItem('signupStep3') || '{}'),
      step4: formData
    };
    
    console.log('Complete signup data:', allFormData);
    
    // Here you would typically submit to your API
    // For now, redirect to success page
    window.location.href = '/auth/sign-up-success';
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
                <div className="flex gap-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="produce"
                      checked={formData.cropType === 'produce'}
                      onCheckedChange={() => handleInputChange('cropType', 'produce')}
                    />
                    <Label htmlFor="produce" className="text-sm">Produce</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="cannabis"
                      checked={formData.cropType === 'cannabis'}
                      onCheckedChange={() => handleInputChange('cropType', 'cannabis')}
                    />
                    <Label htmlFor="cannabis" className="text-sm">Cannabis</Label>
                  </div>
                </div>
                <p className="text-sm text-neutral-600">
                  Select the primary type of crop you cultivate. This helps us customize our tools and recommendations for your specific needs.
                </p>
              </div>

              {/* Growing Environment Selection */}
              <div className="space-y-3">
                <Label>Growing Environment</Label>
                <div className="flex gap-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="indoor"
                      checked={formData.growingEnvironment === 'indoor'}
                      onCheckedChange={() => handleInputChange('growingEnvironment', 'indoor')}
                    />
                    <Label htmlFor="indoor" className="text-sm">Indoor</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="outdoor"
                      checked={formData.growingEnvironment === 'outdoor'}
                      onCheckedChange={() => handleInputChange('growingEnvironment', 'outdoor')}
                    />
                    <Label htmlFor="outdoor" className="text-sm">Outdoor</Label>
                  </div>
                </div>
                <p className="text-sm text-neutral-600">
                  Indicate whether your farm operates indoors or outdoors. This affects the types of environmental controls and monitoring systems you may require.
                </p>
              </div>

              {/* Navigation Buttons */}
              <div className="flex justify-center gap-4 pt-12">
                <Button 
                  variant="outline"
                  size="lg"
                  onClick={handleBack}
                  className="px-8"
                >
                  Back
                </Button>
                <Button 
                  variant="default"
                  size="lg"
                  onClick={handleComplete}
                  disabled={!formData.numberOfContainers}
                  className="bg-brand-lightest-green-800 text-secondary-800 hover:bg-brand-lightest-green-700 px-8"
                >
                  Complete Setup
                </Button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}