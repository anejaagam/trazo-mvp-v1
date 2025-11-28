"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { ProgressIndicator } from "@/components/ui/progress-indicator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Building2, Globe, MapPin } from "lucide-react";

export default function SignUpStep2() {
  const [formData, setFormData] = useState({
    companyName: "",
    companyWebsite: "",
    farmLocation: "",
    dataRegion: "" // us or canada
  });

  useEffect(() => {
    // Check if user completed step 1
    const step1Data = localStorage.getItem('signupStep1');
    if (!step1Data) {
      window.location.href = '/auth/sign-up';
    }

    // Load existing step 2 data if returning from later steps
    const savedStep2Data = localStorage.getItem('signupStep2');
    if (savedStep2Data) {
      try {
        const parsedData = JSON.parse(savedStep2Data);
        setFormData(parsedData);
      } catch (error) {
        console.error('Error loading step 2 data:', error);
      }
    }
  }, []);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleNext = () => {
    // Store form data and navigate to step 3
    localStorage.setItem('signupStep2', JSON.stringify(formData));
    window.location.href = '/auth/sign-up/step-3';
  };

  const handleBack = () => {
    window.location.href = '/auth/sign-up';
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
              Your <br />
              <span className="text-brand-lightest-green-500">Organization</span>
            </h1>
            <p className="text-brand-cream/80 text-lg max-w-md leading-relaxed">
              Tell us about your company so we can tailor our platform to your specific needs and location.
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
              <ProgressIndicator currentStep={2} totalSteps={4} />
            </div>

            {/* Title */}
            <div className="text-center mb-8">
              <h2 className="font-display font-bold text-3xl text-secondary-800 mb-2">
                Company Details
              </h2>
              <p className="text-secondary-500 text-sm">
                Step 2 of 4 - Tell us about your organization
              </p>
            </div>

            {/* Form */}
            <div className="space-y-5">
              {/* Company Name Input */}
              <div className="space-y-2">
                <label htmlFor="companyName" className="block text-sm font-medium text-secondary-700">
                  Company Name <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Building2 className="h-5 w-5 text-secondary-400" />
                  </div>
                  <input
                    id="companyName"
                    type="text"
                    value={formData.companyName}
                    onChange={(e) => handleInputChange('companyName', e.target.value)}
                    required
                    autoComplete="off"
                    className="w-full pl-10 pr-4 py-3 bg-white border-2 border-secondary-200 rounded-xl text-secondary-800 placeholder:text-secondary-400 focus:outline-none focus:border-brand-lighter-green-500 focus:ring-2 focus:ring-brand-lighter-green-500/20 transition-all duration-200"
                    placeholder="Acme Farms Inc."
                  />
                </div>
                <p className="text-xs text-secondary-500">This will be used for official communications and reports.</p>
              </div>

              {/* Company Website Input */}
              <div className="space-y-2">
                <label htmlFor="companyWebsite" className="block text-sm font-medium text-secondary-700">
                  Company Website <span className="text-secondary-400">(Optional)</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Globe className="h-5 w-5 text-secondary-400" />
                  </div>
                  <input
                    id="companyWebsite"
                    type="url"
                    value={formData.companyWebsite}
                    onChange={(e) => handleInputChange('companyWebsite', e.target.value)}
                    autoComplete="off"
                    className="w-full pl-10 pr-4 py-3 bg-white border-2 border-secondary-200 rounded-xl text-secondary-800 placeholder:text-secondary-400 focus:outline-none focus:border-brand-lighter-green-500 focus:ring-2 focus:ring-brand-lighter-green-500/20 transition-all duration-200"
                    placeholder="https://www.example.com"
                  />
                </div>
              </div>

              {/* Farm Location Input */}
              <div className="space-y-2">
                <label htmlFor="farmLocation" className="block text-sm font-medium text-secondary-700">
                  Farm Location <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <MapPin className="h-5 w-5 text-secondary-400" />
                  </div>
                  <input
                    id="farmLocation"
                    type="text"
                    value={formData.farmLocation}
                    onChange={(e) => handleInputChange('farmLocation', e.target.value)}
                    required
                    autoComplete="off"
                    className="w-full pl-10 pr-4 py-3 bg-white border-2 border-secondary-200 rounded-xl text-secondary-800 placeholder:text-secondary-400 focus:outline-none focus:border-brand-lighter-green-500 focus:ring-2 focus:ring-brand-lighter-green-500/20 transition-all duration-200"
                    placeholder="123 Farm Road, City, State"
                  />
                </div>
                <p className="text-xs text-secondary-500">Full address helps us tailor services to your geographic needs.</p>
              </div>

              {/* Data Region Selection */}
              <div className="space-y-2">
                <label htmlFor="dataRegion" className="block text-sm font-medium text-secondary-700">
                  Data Region <span className="text-red-500">*</span>
                </label>
                <Select
                  value={formData.dataRegion}
                  onValueChange={(value) => handleInputChange('dataRegion', value)}
                >
                  <SelectTrigger className="w-full h-12 px-4 bg-white border-2 border-secondary-200 rounded-xl text-secondary-800 focus:outline-none focus:border-brand-lighter-green-500 focus:ring-2 focus:ring-brand-lighter-green-500/20">
                    <SelectValue placeholder="Select Data Region" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="us">United States</SelectItem>
                    <SelectItem value="canada">Canada</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-secondary-500">Your data will remain in the selected region for compliance.</p>
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
                  disabled={!formData.companyName || !formData.farmLocation || !formData.dataRegion}
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