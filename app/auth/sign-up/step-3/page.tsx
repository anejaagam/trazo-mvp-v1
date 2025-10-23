"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Label } from "@/components/ui/form-label";
import { Header } from "@/components/header";
import { ProgressIndicator } from "@/components/ui/progress-indicator";
import { Phone } from "lucide-react";

export default function SignUpStep3() {
  const [formData, setFormData] = useState({
    emergencyContactPerson: "",
    emergencyContactEmail: "",
    emergencyContactNumber: ""
  });

  useEffect(() => {
    // Check if user completed previous steps
    const step1Data = localStorage.getItem('signupStep1');
    const step2Data = localStorage.getItem('signupStep2');
    if (!step1Data || !step2Data) {
      window.location.href = '/auth/sign-up';
    }

    // Load existing step 3 data if returning from later steps
    const savedStep3Data = localStorage.getItem('signupStep3');
    if (savedStep3Data) {
      try {
        const parsedData = JSON.parse(savedStep3Data);
        setFormData(parsedData);
      } catch (error) {
        console.error('Error loading step 3 data:', error);
      }
    }
  }, []);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleNext = () => {
    // Store form data and navigate to step 4
    localStorage.setItem('signupStep3', JSON.stringify(formData));
    window.location.href = '/auth/sign-up/step-4';
  };

  const handleBack = () => {
    window.location.href = '/auth/sign-up/step-2';
  };

  return (
    <div className="min-h-screen bg-white">
      <Header variant="auth" showNavigation={false} />
      
      <main className="flex-1">
        <div className="container mx-auto px-40 py-5">
          <div className="max-w-6xl mx-auto">
            {/* Progress Indicator */}
            <div className="mb-8 px-4">
              <ProgressIndicator currentStep={3} totalSteps={4} />
            </div>

            {/* Title Section */}
            <div className="text-center mb-8">
              <h1 className="font-body font-bold text-display-1 text-secondary-800">
                Emergency Contact Details
              </h1>
            </div>

            {/* Sign-up Form */}
            <div className="max-w-lg mx-auto space-y-6">
              <div className="space-y-2">
                <Label htmlFor="emergencyContactPerson" required>Emergency Contact Person</Label>
                <Field
                  id="emergencyContactPerson"
                  type="text"
                  placeholder="Emergency Contact Person"
                  value={formData.emergencyContactPerson}
                  onChange={(e) => handleInputChange('emergencyContactPerson', e.target.value)}
                  rightIcon={<Phone className="w-4 h-4" />}
                  className="bg-brand-lighter-green-50/60"
                />
                <p className="text-sm text-neutral-600">
                  Enter the name of the primary contact person for your farm. This ensures efficient communication.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="emergencyContactEmail" required>Emergency Contact Email</Label>
                <Field
                  id="emergencyContactEmail"
                  type="email"
                  placeholder="Emergency Contact Email"
                  value={formData.emergencyContactEmail}
                  onChange={(e) => handleInputChange('emergencyContactEmail', e.target.value)}
                  rightIcon={<Phone className="w-4 h-4" />}
                  className="bg-brand-lighter-green-50/60"
                />
                <p className="text-sm text-neutral-600">
                  Enter the email of the primary contact person for your farm.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="emergencyContactNumber" required>Emergency Contact Number</Label>
                <Field
                  id="emergencyContactNumber"
                  type="tel"
                  placeholder="Emergency Contact Number"
                  value={formData.emergencyContactNumber}
                  onChange={(e) => handleInputChange('emergencyContactNumber', e.target.value)}
                  rightIcon={<Phone className="w-4 h-4" />}
                  className="bg-brand-lighter-green-50/60"
                />
                <p className="text-sm text-neutral-600">
                  Provide an emergency contact number for urgent situations. This ensures we can reach someone quickly if needed.
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
                  onClick={handleNext}
                  disabled={!formData.emergencyContactPerson || !formData.emergencyContactEmail || !formData.emergencyContactNumber}
                  className="bg-brand-lightest-green-800 text-secondary-800 hover:bg-brand-lightest-green-700 px-8"
                >
                  Next
                </Button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}