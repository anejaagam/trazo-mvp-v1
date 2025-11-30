import { DevLoginForm } from '@/components/features/dev/dev-login-form'
import { Terminal } from 'lucide-react'
import Link from 'next/link'

export const metadata = {
  title: 'Developer Login | TRAZO',
  description: 'Sign in to the TRAZO developer dashboard',
}

export default function DevLoginPage() {
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

      {/* Login Form */}
      <DevLoginForm />

      {/* Footer */}
      <div className="mt-8 text-center text-sm text-muted-foreground">
        <p>
          Looking for the main platform?{' '}
          <Link href="/auth/login" className="text-purple-600 hover:underline dark:text-purple-400">
            Platform Login
          </Link>
        </p>
      </div>
    </div>
  )
}
