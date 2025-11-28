"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { ProgressIndicator } from "@/components/ui/progress-indicator";
import { User, Mail, Lock, Phone, AlertCircle } from "lucide-react";

export default function SignUpStep1() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    phoneNumber: "",
    role: "org_admin" // First user is always org_admin
  });
  const [passwordError, setPasswordError] = useState("");

  useEffect(() => {
    // Load existing step 1 data if returning from later steps
    const savedStep1Data = localStorage.getItem('signupStep1');
    if (savedStep1Data) {
      try {
        const parsedData = JSON.parse(savedStep1Data);
        setFormData(parsedData);
      } catch (error) {
        console.error('Error loading step 1 data:', error);
      }
    }
  }, []);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear password error when user types
    if (field === 'password' || field === 'confirmPassword') {
      setPasswordError("");
    }
  };

  const handleNext = () => {
    // Validate passwords
    if (formData.password.length < 6) {
      setPasswordError("Password must be at least 6 characters long");
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      setPasswordError("Passwords do not match");
      return;
    }
    
    // Store form data and navigate to step 2
    localStorage.setItem('signupStep1', JSON.stringify(formData));
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
              Join the <br />
              <span className="text-brand-lightest-green-500">Future of Farming</span>
            </h1>
            <p className="text-brand-cream/80 text-lg max-w-md leading-relaxed">
              Create your account and start optimizing your cultivation operations with intelligent tools and real-time insights.
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
              <ProgressIndicator currentStep={1} totalSteps={4} />
            </div>

            {/* Title */}
            <div className="text-center mb-8">
              <h2 className="font-display font-bold text-3xl text-secondary-800 mb-2">
                User Details
              </h2>
              <p className="text-secondary-500 text-sm">
                Step 1 of 4 - Tell us about yourself
              </p>
            </div>

            {/* Form */}
            <div className="space-y-5">
              {/* Name Input */}
              <div className="space-y-2">
                <label htmlFor="name" className="block text-sm font-medium text-secondary-700">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-secondary-400" />
                  </div>
                  <input
                    id="name"
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    required
                    className="w-full pl-10 pr-4 py-3 bg-white border-2 border-secondary-200 rounded-xl text-secondary-800 placeholder:text-secondary-400 focus:outline-none focus:border-brand-lighter-green-500 focus:ring-2 focus:ring-brand-lighter-green-500/20 transition-all duration-200"
                    placeholder="John Doe"
                  />
                </div>
              </div>

              {/* Email Input */}
              <div className="space-y-2">
                <label htmlFor="email" className="block text-sm font-medium text-secondary-700">
                  Email Address <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-secondary-400" />
                  </div>
                  <input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    required
                    className="w-full pl-10 pr-4 py-3 bg-white border-2 border-secondary-200 rounded-xl text-secondary-800 placeholder:text-secondary-400 focus:outline-none focus:border-brand-lighter-green-500 focus:ring-2 focus:ring-brand-lighter-green-500/20 transition-all duration-200"
                    placeholder="you@example.com"
                  />
                </div>
              </div>

              {/* Password Input */}
              <div className="space-y-2">
                <label htmlFor="password" className="block text-sm font-medium text-secondary-700">
                  Password <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-secondary-400" />
                  </div>
                  <input
                    id="password"
                    type="password"
                    value={formData.password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                    required
                    autoComplete="new-password"
                    className="w-full pl-10 pr-4 py-3 bg-white border-2 border-secondary-200 rounded-xl text-secondary-800 placeholder:text-secondary-400 focus:outline-none focus:border-brand-lighter-green-500 focus:ring-2 focus:ring-brand-lighter-green-500/20 transition-all duration-200"
                    placeholder="Create a secure password"
                  />
                </div>
                <p className="text-xs text-secondary-500">Must be at least 6 characters long</p>
              </div>

              {/* Confirm Password Input */}
              <div className="space-y-2">
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-secondary-700">
                  Confirm Password <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-secondary-400" />
                  </div>
                  <input
                    id="confirmPassword"
                    type="password"
                    value={formData.confirmPassword}
                    onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                    required
                    autoComplete="new-password"
                    className="w-full pl-10 pr-4 py-3 bg-white border-2 border-secondary-200 rounded-xl text-secondary-800 placeholder:text-secondary-400 focus:outline-none focus:border-brand-lighter-green-500 focus:ring-2 focus:ring-brand-lighter-green-500/20 transition-all duration-200"
                    placeholder="Re-enter your password"
                  />
                </div>
                {passwordError && (
                  <div className="flex items-center gap-2 text-red-600 text-sm">
                    <AlertCircle className="w-4 h-4" />
                    <span>{passwordError}</span>
                  </div>
                )}
              </div>

              {/* Phone Number Input */}
              <div className="space-y-2">
                <label htmlFor="phoneNumber" className="block text-sm font-medium text-secondary-700">
                  Phone Number <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Phone className="h-5 w-5 text-secondary-400" />
                  </div>
                  <input
                    id="phoneNumber"
                    type="tel"
                    value={formData.phoneNumber}
                    onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
                    required
                    className="w-full pl-10 pr-4 py-3 bg-white border-2 border-secondary-200 rounded-xl text-secondary-800 placeholder:text-secondary-400 focus:outline-none focus:border-brand-lighter-green-500 focus:ring-2 focus:ring-brand-lighter-green-500/20 transition-all duration-200"
                    placeholder="+1 (555) 123-4567"
                  />
                </div>
              </div>

              {/* Info Note */}
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <p className="text-sm text-blue-800">
                  <strong>Note:</strong> As the first person to sign up, you will be the <strong>Organization Admin</strong> with full access to manage your organization.
                </p>
              </div>

              {/* Next Button */}
              <Button 
                onClick={handleNext}
                disabled={!formData.name || !formData.email || !formData.password || !formData.confirmPassword || !formData.phoneNumber}
                className="w-full h-12 text-base font-semibold"
                size="lg"
              >
                Continue
              </Button>

              {/* Sign in link */}
              <div className="text-center pt-2">
                <p className="text-sm text-secondary-600">
                  Already have an account?{" "}
                  <Link 
                    href="/auth/login" 
                    className="text-brand-lighter-green-700 hover:text-brand-lighter-green-800 font-medium"
                  >
                    Sign in
                  </Link>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
