import { DevSignupForm } from '@/components/features/dev/dev-signup-form'
import { Terminal } from 'lucide-react'
import Link from 'next/link'

export const metadata = {
  title: 'Developer Registration | TRAZO',
  description: 'Create a TRAZO developer account',
}

// Check if dev signup is open via environment variable
const isSignupOpen = process.env.NEXT_PUBLIC_DEV_SIGNUP_OPEN === 'true'

export default function DevSignupPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-purple-50 to-slate-100 p-4 dark:from-purple-950 dark:to-slate-900">
      {/* Header */}
      <div className="mb-8 text-center">
        <Link href="/" className="inline-flex items-center gap-2 text-xl font-bold">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-600">
            <Terminal className="h-5 w-5 text-white" />
          </div>
          <span className="text-gray-900 dark:text-white">TRAZO</span>
          <span className="rounded bg-purple-100 px-2 py-0.5 text-sm font-medium text-purple-700 dark:bg-purple-900 dark:text-purple-300">
            DEV
          </span>
        </Link>
      </div>

      {/* Signup Form */}
      <DevSignupForm isOpen={isSignupOpen} />

      {/* Footer */}
      <div className="mt-8 text-center text-sm text-muted-foreground">
        <p>
          Looking for the main platform?{' '}
          <Link href="/auth/sign-up" className="text-purple-600 hover:underline dark:text-purple-400">
            Platform Sign Up
          </Link>
        </p>
      </div>
    </div>
  )
}
