"use client";

import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";

interface HeaderProps {
  variant?: "landing" | "auth";
  showNavigation?: boolean;
}

export function Header({ variant = "landing", showNavigation = true }: HeaderProps) {
  
  return (
    <header className="bg-secondary-800 h-16 w-full">
      <div className="container mx-auto px-4 h-full flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3">
          <div className="w-9 h-10 relative">
            <Image
              src="/images/colorLogo.png"
              alt="TRAZO Logo"
              width={36}
              height={40}
              className="w-full h-full object-contain dark:hidden"
            />
            <Image
              src="/images/Monogram_White.svg"
              alt="TRAZO Logo"
              width={36}
              height={40}
              className="w-full h-full object-contain hidden dark:block"
            />
          </div>
          <div className="text-brand-cream text-4xl font-display font-semibold tracking-wider">
            TRAZO
          </div>
        </Link>

        {/* Navigation */}
        <div className="flex items-center gap-11">
          {showNavigation && variant === "landing" && (
            <nav className="flex items-center gap-9">
              <Link href="#" className="text-brand-cream text-sm font-medium hover:text-brand-cream/80 transition-colors">
                Product
              </Link>
              <Link href="#" className="text-brand-cream text-sm font-medium hover:text-brand-cream/80 transition-colors">
                Solutions
              </Link>
              <Link href="#" className="text-brand-cream text-sm font-medium hover:text-brand-cream/80 transition-colors">
                Resources
              </Link>
              <Link href="#" className="text-brand-cream text-sm font-medium hover:text-brand-cream/80 transition-colors">
                Pricing
              </Link>
            </nav>
          )}

          {showNavigation && variant === "auth" && (
            <nav className="flex items-center gap-9">
              <Link href="#" className="text-brand-cream text-sm font-medium hover:text-brand-cream/80 transition-colors">
                Dashboard
              </Link>
              <Link href="#" className="text-brand-cream text-sm font-medium hover:text-brand-cream/80 transition-colors">
                Rooms
              </Link>
              <Link href="#" className="text-brand-cream text-sm font-medium hover:text-brand-cream/80 transition-colors">
                Pods
              </Link>
              <Link href="#" className="text-brand-cream text-sm font-medium hover:text-brand-cream/80 transition-colors">
                Recipes
              </Link>
            </nav>
          )}

          {/* Auth Button */}
          {variant === "landing" && (
            <Button 
              variant="default" 
              size="sm" 
              className="bg-brand-lightest-green-800 text-secondary-800 hover:bg-brand-lightest-green-700"
              asChild
            >
              <Link href="/auth/login">Log in</Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}