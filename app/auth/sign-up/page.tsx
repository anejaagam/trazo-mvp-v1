"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Label } from "@/components/ui/form-label";
import { Header } from "@/components/header";
import { ProgressIndicator } from "@/components/ui/progress-indicator";
import { User } from "lucide-react";

export default function SignUpStep1() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phoneNumber: "",
    role: "org_admin" // First user is always org_admin
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleNext = () => {
    // Store form data and navigate to step 2
    localStorage.setItem('signupStep1', JSON.stringify(formData));
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
              <ProgressIndicator currentStep={1} totalSteps={4} />
            </div>

            {/* Title Section */}
            <div className="text-center mb-8">
              <h1 className="font-body font-bold text-display-1 text-secondary-800">
                User Details
              </h1>
            </div>

            {/* Sign-up Form */}
            <div className="max-w-lg mx-auto space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name" required>Name</Label>
                <Field
                  id="name"
                  type="text"
                  placeholder="Name"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  rightIcon={<User className="w-4 h-4" />}
                  className="bg-brand-lighter-green-50/60"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" required>Email</Label>
                <Field
                  id="email"
                  type="email"
                  placeholder="Email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  rightIcon={<User className="w-4 h-4" />}
                  className="bg-brand-lighter-green-50/60"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phoneNumber" required>Phone Number</Label>
                <Field
                  id="phoneNumber"
                  type="tel"
                  placeholder="Phone Number"
                  value={formData.phoneNumber}
                  onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
                  rightIcon={<User className="w-4 h-4" />}
                  className="bg-brand-lighter-green-50/60"
                />
              </div>

              {/* Note about role assignment */}
              <div className="bg-information-50 border border-information-200 rounded-lg p-4">
                <p className="text-sm text-information-800">
                  <strong>Note:</strong> As the first person to sign up, you will be assigned the <strong>Organization Admin</strong> role with full access to manage your organization, users, and all features.
                </p>
              </div>

              {/* Next Button */}
              <div className="flex justify-center pt-12">
                <Button 
                  variant="default"
                  size="lg"
                  onClick={handleNext}
                  disabled={!formData.name || !formData.email || !formData.phoneNumber}
                  className="bg-brand-lightest-green-800 text-secondary-800 hover:bg-brand-lightest-green-700 px-8"
                >
                  Next
                </Button>
              </div>

              {/* Sign in link */}
              <div className="text-center pt-4">
                <p className="text-sm text-neutral-600">
                  Already have an account?{" "}
                  <Link 
                    href="/auth/login" 
                    className="text-information-600 hover:text-information-800 font-medium"
                  >
                    Sign in
                  </Link>
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
