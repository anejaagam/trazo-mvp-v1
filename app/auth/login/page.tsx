import { LoginForm } from "@/components/auth/login-form";
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

            {/* Login Form - Using functional component */}
            <div className="max-w-lg mx-auto">
              <LoginForm />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
