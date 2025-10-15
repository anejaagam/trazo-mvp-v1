"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/header";
import { CheckCircle } from "lucide-react";

export default function SignUpSuccessPage() {
  useEffect(() => {
    // Clear signup data from localStorage
    localStorage.removeItem('signupStep1');
    localStorage.removeItem('signupStep2');
    localStorage.removeItem('signupStep3');
    localStorage.removeItem('signupStep4');
  }, []);

  return (
    <div className="min-h-screen bg-brand-lighter-green-50/20">
      <Header variant="auth" showNavigation={false} />
      
      <main className="flex-1">
        <div className="container mx-auto px-40 py-20">
          <div className="max-w-2xl mx-auto text-center">
            {/* Success Icon */}
            <div className="flex justify-center mb-8">
              <div className="w-24 h-24 bg-success rounded-full flex items-center justify-center">
                <CheckCircle className="w-12 h-12 text-white" />
              </div>
            </div>

            {/* Title Section */}
            <div className="mb-6">
              <h1 className="font-display font-bold text-display-1 text-secondary-800 mb-4">
                Welcome to{" "}
                <span className="font-display font-bold">TRAZO</span>!
              </h1>
              <p className="text-body-lg text-secondary-600">
                Thank you for signing up
              </p>
            </div>

            {/* Success Message */}
            <div className="mb-8">
              <p className="text-body-base text-secondary-800 max-w-lg mx-auto">
                You&apos;ve successfully completed your registration. Please check your email to confirm your account before signing in.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-center gap-4">
              <Button 
                variant="outline"
                size="lg"
                className="px-8"
                asChild
              >
                <Link href="/landing">Back to Home</Link>
              </Button>
              <Button 
                variant="default"
                size="lg"
                className="bg-brand-lightest-green-800 text-secondary-800 hover:bg-brand-lightest-green-700 px-8"
                asChild
              >
                <Link href="/auth/login">Sign In</Link>
              </Button>
            </div>

            {/* Additional Info */}
            <div className="mt-12 pt-8 border-t border-neutral-200">
              <p className="text-sm text-neutral-600">
                Need help? Contact our support team at{" "}
                <a 
                  href="mailto:support@trazo.com" 
                  className="text-information-600 hover:text-information-800 font-medium"
                >
                  support@trazo.com
                </a>
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
