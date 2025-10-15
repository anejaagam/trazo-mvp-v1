"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Label } from "@/components/ui/form-label";
import { Header } from "@/components/header";

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-brand-lighter-green-50/20">
      <Header variant="auth" showNavigation={false} />
      
      <main className="flex-1">
        <div className="container mx-auto px-40 py-5">
          <div className="max-w-6xl mx-auto">
            {/* Hero Image Section */}
            <div className="mb-8">
              <div className="relative h-80 bg-secondary-800 rounded-xl overflow-hidden">
                {/* Placeholder for hero image */}
                <div className="absolute inset-0 bg-gradient-to-r from-secondary-800 to-secondary-600 flex items-center justify-center">
                  <div className="text-brand-cream text-4xl font-display font-bold">
                    TRAZO FARM
                  </div>
                </div>
              </div>
            </div>

            {/* Title Section */}
            <div className="text-center mb-8">
              <h1 className="font-display font-semibold text-display-2 text-secondary-800">
                Log in
              </h1>
            </div>

            {/* Login Form */}
            <div className="max-w-lg mx-auto space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email">Email or Username</Label>
                <Field
                  id="email"
                  type="email"
                  placeholder="Enter your email or username"
                  className="bg-brand-lighter-green-400/40 border-secondary-500"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Field
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  className="bg-brand-lighter-green-400/40 border-secondary-500"
                />
              </div>

              {/* Forgot Password Link */}
              <div className="text-center">
                <Link 
                  href="/auth/forgot-password" 
                  className="text-sm text-neutral-400 hover:text-neutral-600 transition-colors"
                >
                  Forgot Password?
                </Link>
              </div>

              {/* Login Button */}
              <div className="flex justify-center">
                <Button 
                  variant="default"
                  size="lg"
                  className="bg-brand-lightest-green-800 text-secondary-800 hover:bg-brand-lightest-green-700 px-8"
                >
                  Login
                </Button>
              </div>

              {/* Sign up link */}
              <div className="text-center pt-4">
                <p className="text-sm text-neutral-600">
                  Don&apos;t have an account?{" "}
                  <Link 
                    href="/auth/sign-up" 
                    className="text-information-600 hover:text-information-800 font-medium"
                  >
                    Sign up
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
