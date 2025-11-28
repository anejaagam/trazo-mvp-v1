"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { ProgressIndicator } from "@/components/ui/progress-indicator";
import { User, Mail, Phone } from "lucide-react";

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
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Left Side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-secondary-800 via-secondary-700 to-secondary-600 relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-10 w-72 h-72 bg-brand-lightest-green-500 rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-brand-lighter-green-500 rounded-full blur-3xl" />
        </div>
        
        {/* Content */}
        <div className="relative z-10 flex flex-col justify-between p-12 pb-6 w-full h-full">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3">
            <div className="w-10 h-11 relative">
              <Image
                src="/images/colorLogo.png"
                alt="TRAZO Logo"
                width={40}
                height={44}
                className="w-full h-full object-contain"
              />
            </div>
            <span className="text-brand-cream text-3xl font-display font-semibold tracking-wider">
              TRAZO
            </span>
          </Link>

          {/* Hero Content */}
          <div className="flex-1 flex flex-col justify-center">
            <h1 className="text-brand-cream text-5xl font-display font-bold leading-tight mb-6">
              Stay <br />
              <span className="text-brand-lightest-green-500">Connected</span>
            </h1>
            <p className="text-brand-cream/80 text-lg max-w-md leading-relaxed">
              Emergency contacts ensure we can reach the right person when urgent situations arise at your facility.
            </p>
          </div>

          {/* Footer */}
          <div className="text-brand-cream/50 text-sm text-left">
            © {new Date().getFullYear()} Trazo Global. All rights reserved.
          </div>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="flex-1 flex flex-col bg-gradient-to-b from-brand-lighter-green-50/30 to-white min-h-screen lg:min-h-0 overflow-y-auto">
        {/* Mobile Header */}
        <div className="lg:hidden bg-secondary-800 p-4 flex-shrink-0">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-9 relative">
              <Image
                src="/images/colorLogo.png"
                alt="TRAZO Logo"
                width={32}
                height={36}
                className="w-full h-full object-contain"
              />
            </div>
            <span className="text-brand-cream text-2xl font-display font-semibold tracking-wider">
              TRAZO
            </span>
          </Link>
        </div>

        {/* Form Container */}
        <div className="flex-1 flex items-start lg:items-center justify-center p-6 sm:p-12 py-8">
          <div className="w-full max-w-md">
            {/* Progress Indicator */}
            <div className="mb-8">
              <ProgressIndicator currentStep={3} totalSteps={4} />
            </div>

            {/* Title */}
            <div className="text-center mb-8">
              <h2 className="font-display font-bold text-3xl text-secondary-800 mb-2">
                Emergency Contact
              </h2>
              <p className="text-secondary-500 text-sm">
                Step 3 of 4 - Who should we contact in emergencies?
              </p>
            </div>

            {/* Form */}
            <div className="space-y-5">
              {/* Emergency Contact Person */}
              <div className="space-y-2">
                <label htmlFor="emergencyContactPerson" className="block text-sm font-medium text-secondary-700">
                  Contact Person <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-secondary-400" />
                  </div>
                  <input
                    id="emergencyContactPerson"
                    type="text"
                    value={formData.emergencyContactPerson}
                    onChange={(e) => handleInputChange('emergencyContactPerson', e.target.value)}
                    required
                    className="w-full pl-10 pr-4 py-3 bg-white border-2 border-secondary-200 rounded-xl text-secondary-800 placeholder:text-secondary-400 focus:outline-none focus:border-brand-lighter-green-500 focus:ring-2 focus:ring-brand-lighter-green-500/20 transition-all duration-200"
                    placeholder="Jane Doe"
                  />
                </div>
                <p className="text-xs text-secondary-500">Primary contact person for urgent communications.</p>
              </div>

              {/* Emergency Contact Email */}
              <div className="space-y-2">
                <label htmlFor="emergencyContactEmail" className="block text-sm font-medium text-secondary-700">
                  Contact Email <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-secondary-400" />
                  </div>
                  <input
                    id="emergencyContactEmail"
                    type="email"
                    value={formData.emergencyContactEmail}
                    onChange={(e) => handleInputChange('emergencyContactEmail', e.target.value)}
                    required
                    className="w-full pl-10 pr-4 py-3 bg-white border-2 border-secondary-200 rounded-xl text-secondary-800 placeholder:text-secondary-400 focus:outline-none focus:border-brand-lighter-green-500 focus:ring-2 focus:ring-brand-lighter-green-500/20 transition-all duration-200"
                    placeholder="emergency@example.com"
                  />
                </div>
              </div>

              {/* Emergency Contact Number */}
              <div className="space-y-2">
                <label htmlFor="emergencyContactNumber" className="block text-sm font-medium text-secondary-700">
                  Contact Phone <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Phone className="h-5 w-5 text-secondary-400" />
                  </div>
                  <input
                    id="emergencyContactNumber"
                    type="tel"
                    value={formData.emergencyContactNumber}
                    onChange={(e) => handleInputChange('emergencyContactNumber', e.target.value)}
                    required
                    className="w-full pl-10 pr-4 py-3 bg-white border-2 border-secondary-200 rounded-xl text-secondary-800 placeholder:text-secondary-400 focus:outline-none focus:border-brand-lighter-green-500 focus:ring-2 focus:ring-brand-lighter-green-500/20 transition-all duration-200"
                    placeholder="+1 (555) 123-4567"
                  />
                </div>
                <p className="text-xs text-secondary-500">For urgent situations requiring immediate attention.</p>
              </div>

              {/* Navigation Buttons */}
              <div className="flex gap-4 pt-4">
                <Button 
                  variant="outline"
                  onClick={handleBack}
                  className="flex-1 h-12 text-base font-semibold border-2 border-secondary-300 rounded-3xl"
                >
                  Back
                </Button>
                <Button 
                  onClick={handleNext}
                  disabled={!formData.emergencyContactPerson || !formData.emergencyContactEmail || !formData.emergencyContactNumber}
                  className="flex-1 h-12 text-base font-semibold"
                  size="lg"
                >
                  Continue
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}