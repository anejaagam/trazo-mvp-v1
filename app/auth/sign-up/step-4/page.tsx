"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { ProgressIndicator } from "@/components/ui/progress-indicator";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Package, AlertCircle } from "lucide-react";
import { completeSignup } from "../actions";

export default function SignUpStep4() {
  const [formData, setFormData] = useState({
    numberOfContainers: "",
    growingEnvironment: "indoor", // indoor or outdoor
    plantType: "", // cannabis or produce
    jurisdiction: "" // regulatory jurisdiction
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

    // Load existing step 4 data if returning (back button)
    const savedStep4Data = localStorage.getItem('signupStep4');
    if (savedStep4Data) {
      try {
        const parsedData = JSON.parse(savedStep4Data);
        setFormData(parsedData);
      } catch (error) {
        console.error('Error loading step 4 data:', error);
      }
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
              Almost <br />
              <span className="text-brand-lightest-green-500">There!</span>
            </h1>
            <p className="text-brand-cream/80 text-lg max-w-md leading-relaxed">
              Final step! Tell us about your farm setup so we can configure the right compliance and monitoring tools for you.
            </p>
          </div>

          {/* Footer */}
          <div className="text-brand-cream/50 text-sm text-left">
            © {new Date().getFullYear()} Trazo Global. All rights reserved.
          </div>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="flex-1 flex flex-col bg-gradient-to-b from-brand-lighter-green-50/30 to-white">
        {/* Mobile Header */}
        <div className="lg:hidden bg-secondary-800 p-4">
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
        <div className="flex-1 flex items-center justify-center p-6 sm:p-12">
          <div className="w-full max-w-md">
            {/* Progress Indicator */}
            <div className="mb-8">
              <ProgressIndicator currentStep={4} totalSteps={4} />
            </div>

            {/* Title */}
            <div className="text-center mb-8">
              <h2 className="font-display font-bold text-3xl text-secondary-800 mb-2">
                Farm Details
              </h2>
              <p className="text-secondary-500 text-sm">
                Step 4 of 4 - Configure your farm setup
              </p>
            </div>

            {/* Form */}
            <div className="space-y-5">
              {/* Number of Containers */}
              <div className="space-y-2">
                <label htmlFor="numberOfContainers" className="block text-sm font-medium text-secondary-700">
                  Number of Containers <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Package className="h-5 w-5 text-secondary-400" />
                  </div>
                  <input
                    id="numberOfContainers"
                    type="number"
                    value={formData.numberOfContainers}
                    onChange={(e) => handleInputChange('numberOfContainers', e.target.value)}
                    required
                    min="1"
                    className="w-full pl-10 pr-4 py-3 bg-white border-2 border-secondary-200 rounded-xl text-secondary-800 placeholder:text-secondary-400 focus:outline-none focus:border-brand-lighter-green-500 focus:ring-2 focus:ring-brand-lighter-green-500/20 transition-all duration-200"
                    placeholder="10"
                  />
                </div>
                <p className="text-xs text-secondary-500">Total containers you manage for resource planning.</p>
              </div>

              {/* Plant Type Selection */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-secondary-700">
                  Plant Type <span className="text-red-500">*</span>
                </label>
                <Select
                  value={formData.plantType}
                  onValueChange={(value) => handleInputChange('plantType', value)}
                >
                  <SelectTrigger className="w-full h-12 px-4 bg-white border-2 border-secondary-200 rounded-xl text-secondary-800 focus:outline-none focus:border-brand-lighter-green-500 focus:ring-2 focus:ring-brand-lighter-green-500/20">
                    <SelectValue placeholder="Select Plant Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cannabis">Cannabis</SelectItem>
                    <SelectItem value="produce">Produce</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-secondary-500">Determines compliance requirements and features.</p>
              </div>

              {/* Jurisdiction Selection */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-secondary-700">
                  Regulatory Jurisdiction <span className="text-red-500">*</span>
                </label>
                <Select
                  value={formData.jurisdiction}
                  onValueChange={(value) => handleInputChange('jurisdiction', value)}
                  disabled={!formData.plantType}
                >
                  <SelectTrigger className="w-full h-12 px-4 bg-white border-2 border-secondary-200 rounded-xl text-secondary-800 focus:outline-none focus:border-brand-lighter-green-500 focus:ring-2 focus:ring-brand-lighter-green-500/20 disabled:opacity-50">
                    <SelectValue placeholder={!formData.plantType ? "Select plant type first" : "Select Jurisdiction"} />
                  </SelectTrigger>
                  <SelectContent>
                    {formData.plantType === 'cannabis' && (
                      <>
                        <SelectItem value="metrc-alaska">Alaska (Metrc)</SelectItem>
                        <SelectItem value="metrc-california">California (Metrc)</SelectItem>
                        <SelectItem value="metrc-colorado">Colorado (Metrc)</SelectItem>
                        <SelectItem value="metrc-dc">Washington D.C. (Metrc)</SelectItem>
                        <SelectItem value="metrc-louisiana">Louisiana (Metrc)</SelectItem>
                        <SelectItem value="metrc-maine">Maine (Metrc)</SelectItem>
                        <SelectItem value="metrc-maryland">Maryland (Metrc)</SelectItem>
                        <SelectItem value="metrc-massachusetts">Massachusetts (Metrc)</SelectItem>
                        <SelectItem value="metrc-michigan">Michigan (Metrc)</SelectItem>
                        <SelectItem value="metrc-minnesota">Minnesota (Metrc)</SelectItem>
                        <SelectItem value="metrc-missouri">Missouri (Metrc)</SelectItem>
                        <SelectItem value="metrc-montana">Montana (Metrc)</SelectItem>
                        <SelectItem value="metrc-nevada">Nevada (Metrc)</SelectItem>
                        <SelectItem value="metrc-new-jersey">New Jersey (Metrc)</SelectItem>
                        <SelectItem value="metrc-ohio">Ohio (Metrc)</SelectItem>
                        <SelectItem value="metrc-oklahoma">Oklahoma (Metrc)</SelectItem>
                        <SelectItem value="metrc-oregon">Oregon (Metrc)</SelectItem>
                        <SelectItem value="metrc-west-virginia">West Virginia (Metrc)</SelectItem>
                        <SelectItem value="ctls-canada">Canada (CTLS)</SelectItem>
                      </>
                    )}
                    {formData.plantType === 'produce' && (
                      <>
                        <SelectItem value="primus-gfs">PrimusGFS Certification</SelectItem>
                        <SelectItem value="gap">Good Agricultural Practices (GAP)</SelectItem>
                      </>
                    )}
                  </SelectContent>
                </Select>
                <p className="text-xs text-secondary-500">Configures compliance rules and reporting.</p>
              </div>

              {/* Growing Environment Selection */}
              <div className="space-y-3">
                <label className="block text-sm font-medium text-secondary-700">
                  Growing Environment
                </label>
                <RadioGroup
                  value={formData.growingEnvironment}
                  onValueChange={(value) => handleInputChange('growingEnvironment', value)}
                  className="flex gap-6"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="indoor" id="indoor" />
                    <label htmlFor="indoor" className="text-sm text-secondary-700 cursor-pointer">Indoor</label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="outdoor" id="outdoor" />
                    <label htmlFor="outdoor" className="text-sm text-secondary-700 cursor-pointer">Outdoor</label>
                  </div>
                </RadioGroup>
              </div>

              {/* Error Message */}
              {error && (
                <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-xl">
                  <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                  <p className="text-red-700 text-sm">{error}</p>
                </div>
              )}

              {/* Navigation Buttons */}
              <div className="flex gap-4 pt-4">
                <Button 
                  variant="outline"
                  onClick={handleBack}
                  disabled={isSubmitting}
                  className="flex-1 h-12 text-base font-semibold border-2 border-secondary-300 rounded-3xl"
                >
                  Back
                </Button>
                <Button 
                  onClick={handleComplete}
                  disabled={!formData.numberOfContainers || !formData.plantType || !formData.jurisdiction || isSubmitting}
                  loading={isSubmitting}
                  className="flex-1 h-12 text-base font-semibold"
                  size="lg"
                >
                  {isSubmitting ? 'Creating...' : 'Complete Setup'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}