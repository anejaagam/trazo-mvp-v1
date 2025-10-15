"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/header";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-brand-lighter-green-50/20 to-white">
      <Header variant="landing" />
      
      <main className="flex-1">
        <div className="container mx-auto px-40 py-5">
          <div className="max-w-6xl mx-auto">
            {/* Hero Image Section */}
            <div className="mb-8">
              <div className="relative h-80 bg-secondary-800 rounded-xl overflow-hidden">
                {/* Placeholder for hero image */}
                <div className="absolute inset-0 bg-gradient-to-r from-secondary-800 to-secondary-600 flex items-center justify-center">
                  <div className="text-brand-cream text-6xl font-display font-bold">
                    TRAZO FARM
                  </div>
                </div>
                {/* You can replace this with an actual image */}
                {/* <Image 
                  src="/hero-image.jpg" 
                  alt="TRAZO Container Farm"
                  fill
                  className="object-cover"
                /> */}
              </div>
            </div>

            {/* Title Section */}
            <div className="text-center mb-6">
              <h1 className="font-body font-bold text-display-1 text-secondary-800 mb-4">
                Welcome to{" "}
                <span className="font-display font-bold">TRAZO</span>
              </h1>
            </div>

            {/* Subtitle */}
            <div className="text-center mb-8">
              <p className="text-body-base text-secondary-800 max-w-2xl mx-auto">
                Manage your container farm efficiently and sustainably. Start growing with us today.
              </p>
            </div>

            {/* CTA Buttons */}
            <div className="flex items-center justify-center gap-3 max-w-lg mx-auto">
              <Button 
                variant="outline" 
                size="lg"
                className="flex-1 bg-brand-lighter-green-50/60 text-secondary-800 border-0 hover:bg-brand-lighter-green-100"
                asChild
              >
                <Link href="/auth/login">Login</Link>
              </Button>
              <Button 
                variant="default"
                size="lg" 
                className="flex-1 bg-brand-lightest-green-300 text-secondary-800 hover:bg-brand-lightest-green-400"
                asChild
              >
                <Link href="/auth/sign-up">Sign up</Link>
              </Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}