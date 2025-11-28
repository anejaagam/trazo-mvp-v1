import { LoginForm } from "@/components/auth/login-form";
import Image from "next/image";
import Link from "next/link";

export default function LoginPage() {
  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Left Side - Branding & Image */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-secondary-800 via-secondary-700 to-secondary-600 relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-10 w-72 h-72 bg-brand-lightest-green-500 rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-brand-lighter-green-500 rounded-full blur-3xl" />
        </div>
        
        {/* Content */}
        <div className="relative z-10 flex flex-col justify-between p-12 w-full">
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
              Cultivate <br />
              <span className="text-brand-lightest-green-500">Smarter</span>
            </h1>
            <p className="text-brand-cream/80 text-lg max-w-md leading-relaxed">
              Streamline your cultivation operations with intelligent monitoring, 
              compliance tracking, and real-time insights.
            </p>
          </div>

          {/* Footer */}
          <div className="text-brand-cream/50 text-sm">
            © {new Date().getFullYear()} Trazo Agriculture. All rights reserved.
          </div>
        </div>
      </div>

      {/* Right Side - Login Form */}
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
            {/* Welcome Text */}
            <div className="text-center mb-10">
              <h2 className="font-display font-bold text-3xl sm:text-4xl text-secondary-800 mb-3">
                Welcome back
              </h2>
              <p className="text-secondary-500 text-base">
                Sign in to access your cultivation dashboard
              </p>
            </div>

            {/* Login Form */}
            <LoginForm />
          </div>
        </div>
      </div>
    </div>
  );
}
