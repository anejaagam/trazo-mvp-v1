import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export default async function HomePage() {
  // Check if user is already authenticated
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // If authenticated, redirect to protected area
  if (user) {
    redirect('/protected');
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-gray-50 to-gray-100">
      <div className="text-center space-y-8 px-4 max-w-3xl">
        <div className="space-y-4">
          <h1 className="text-5xl md:text-6xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-cyan-600">
            Trazo OS
          </h1>
          <p className="text-xl md:text-2xl text-gray-600">
            Edge-native container farm operating system
          </p>
          <p className="text-base text-gray-500 max-w-2xl mx-auto">
            Manage your container infrastructure with multi-regional data residency. 
            Your data stays in your region - US or Canada.
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Link 
            href="/auth/sign-up"
            className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-lg hover:shadow-xl"
          >
            Get Started
          </Link>
          <Link 
            href="/auth/login"
            className="px-8 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:border-gray-400 hover:bg-gray-50 transition-colors font-medium"
          >
            Log In
          </Link>
        </div>

        <div className="pt-8 grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
          <div className="p-6 bg-white rounded-lg shadow-sm">
            <div className="text-3xl mb-2">🌎</div>
            <h3 className="font-semibold text-gray-900 mb-2">Multi-Regional</h3>
            <p className="text-sm text-gray-600">
              Data residency in US or Canada based on your preference
            </p>
          </div>
          <div className="p-6 bg-white rounded-lg shadow-sm">
            <div className="text-3xl mb-2">🔒</div>
            <h3 className="font-semibold text-gray-900 mb-2">Secure</h3>
            <p className="text-sm text-gray-600">
              Enterprise-grade security with region-specific compliance
            </p>
          </div>
          <div className="p-6 bg-white rounded-lg shadow-sm">
            <div className="text-3xl mb-2">⚡</div>
            <h3 className="font-semibold text-gray-900 mb-2">Edge-Native</h3>
            <p className="text-sm text-gray-600">
              Optimized for edge computing and container orchestration
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}