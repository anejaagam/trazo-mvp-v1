"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Label } from "@/components/ui/form-label";
import { Header } from "@/components/header";
import { ProgressIndicator } from "@/components/ui/progress-indicator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Building2 } from "lucide-react";

export default function SignUpStep2() {
  const [formData, setFormData] = useState({
    companyName: "",
    companyWebsite: "",
    farmLocation: "",
    jurisdiction: "",
    plantType: "",
    dataRegion: "" // us or canada
  });

  useEffect(() => {
    // Check if user completed step 1
    const step1Data = localStorage.getItem('signupStep1');
    if (!step1Data) {
      window.location.href = '/auth/sign-up';
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
    <div className="min-h-screen bg-white">
      <Header variant="auth" showNavigation={false} />
      
      <main className="flex-1">
        <div className="container mx-auto px-40 py-5">
          <div className="max-w-6xl mx-auto">
            {/* Progress Indicator */}
            <div className="mb-8 px-4">
              <ProgressIndicator currentStep={2} totalSteps={4} />
            </div>

            {/* Title Section */}
            <div className="text-center mb-8">
              <h1 className="font-body font-bold text-display-1 text-secondary-800">
                Company Details
              </h1>
            </div>

            {/* Sign-up Form */}
            <div className="max-w-lg mx-auto space-y-6">
              <div className="space-y-2">
                <Label htmlFor="companyName" required>Company Name</Label>
                <Field
                  id="companyName"
                  type="text"
                  placeholder="Company Name"
                  value={formData.companyName}
                  onChange={(e) => handleInputChange('companyName', e.target.value)}
                  rightIcon={<Building2 className="w-4 h-4" />}
                  className="bg-brand-lighter-green-50/60"
                />
                <p className="text-sm text-neutral-600">
                  Enter the official name of your company or farm. This will be used for all official communications and reports.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="companyWebsite">Company Website (Optional)</Label>
                <Field
                  id="companyWebsite"
                  type="url"
                  placeholder="Company Website (Optional)"
                  value={formData.companyWebsite}
                  onChange={(e) => handleInputChange('companyWebsite', e.target.value)}
                  rightIcon={<Building2 className="w-4 h-4" />}
                  className="bg-brand-lighter-green-50/60"
                />
                <p className="text-sm text-neutral-600">
                  Provide your company&apos;s website if available. This helps us understand your online presence and brand.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="farmLocation" required>Farm Location (Address)</Label>
                <Field
                  id="farmLocation"
                  type="text"
                  placeholder="Farm Location (Address)"
                  value={formData.farmLocation}
                  onChange={(e) => handleInputChange('farmLocation', e.target.value)}
                  rightIcon={<Building2 className="w-4 h-4" />}
                  className="bg-brand-lighter-green-50/60"
                />
                <p className="text-sm text-neutral-600">
                  Provide the full address of your farm. This helps us tailor our services to your specific geographic needs.
                </p>
              </div>

              {/* Plant Type Selection */}
              <div className="space-y-2">
                <Label htmlFor="plantType" required>Plant Type</Label>
                <Select
                  value={formData.plantType}
                  onValueChange={(value) => handleInputChange('plantType', value)}
                >
                  <SelectTrigger className="w-full h-14 px-4 bg-brand-lighter-green-50/60 border-2 border-neutral-200 rounded-lg font-display font-medium text-body-lg">
                    <SelectValue placeholder="Select Plant Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cannabis">Cannabis</SelectItem>
                    <SelectItem value="produce">Produce</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-sm text-neutral-600">
                  Select the primary type of plants you will be growing. This determines compliance requirements and available features.
                </p>
              </div>

              {/* Jurisdiction Selection */}
              <div className="space-y-2">
                <Label htmlFor="jurisdiction" required>Regulatory Jurisdiction</Label>
                <Select
                  value={formData.jurisdiction}
                  onValueChange={(value) => handleInputChange('jurisdiction', value)}
                  disabled={!formData.plantType}
                >
                  <SelectTrigger className="w-full h-14 px-4 bg-brand-lighter-green-50/60 border-2 border-neutral-200 rounded-lg font-display font-medium text-body-lg">
                    <SelectValue placeholder={!formData.plantType ? "Please select plant type first" : "Select Jurisdiction"} />
                  </SelectTrigger>
                  <SelectContent>
                    {formData.plantType === 'cannabis' && (
                      <>
                        <SelectItem value="oregon">Oregon (Metrc)</SelectItem>
                        <SelectItem value="maryland">Maryland (Metrc)</SelectItem>
                        <SelectItem value="canada">Canada (CTLS)</SelectItem>
                      </>
                    )}
                    {formData.plantType === 'produce' && (
                      <SelectItem value="primus_gfs">PrimusGFS Certification</SelectItem>
                    )}
                  </SelectContent>
                </Select>
                <p className="text-sm text-neutral-600">
                  Select the regulatory framework that applies to your operation. This configures compliance rules, reporting requirements, and tracking standards.
                </p>
              </div>

              {/* Data Region Selection */}
              <div className="space-y-2">
                <Label htmlFor="dataRegion" required>Data Region</Label>
                <Select
                  value={formData.dataRegion}
                  onValueChange={(value) => handleInputChange('dataRegion', value)}
                >
                  <SelectTrigger className="w-full h-14 px-4 bg-brand-lighter-green-50/60 border-2 border-neutral-200 rounded-lg font-display font-medium text-body-lg">
                    <SelectValue placeholder="Select Data Region" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="us">United States</SelectItem>
                    <SelectItem value="canada">Canada</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-sm text-neutral-600">
                  Choose where your data will be stored. Your data will remain in the selected region to comply with data residency requirements.
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
                  disabled={!formData.companyName || !formData.farmLocation || !formData.plantType || !formData.jurisdiction || !formData.dataRegion}
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