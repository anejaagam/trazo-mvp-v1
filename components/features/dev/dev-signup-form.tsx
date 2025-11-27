'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertCircle, CheckCircle2, Loader2, Terminal, UserPlus } from 'lucide-react'
import Link from 'next/link'

interface DevSignupFormProps {
  isOpen: boolean
}

export function DevSignupForm({ isOpen }: DevSignupFormProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    fullName: '',
  })

  // Password validation
  const passwordRequirements = {
    minLength: formData.password.length >= 8,
    hasUppercase: /[A-Z]/.test(formData.password),
    hasLowercase: /[a-z]/.test(formData.password),
    hasNumber: /\d/.test(formData.password),
    passwordsMatch: formData.password === formData.confirmPassword && formData.confirmPassword.length > 0,
  }

  const isPasswordValid = Object.values(passwordRequirements).every(Boolean)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    if (!isPasswordValid) {
      setError('Please ensure your password meets all requirements.')
      setIsLoading(false)
      return
    }

    try {
      const supabase = createClient()

      // Sign up with email and password
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.fullName,
            role: 'developer',
          },
        },
      })

      if (authError) {
        setError(authError.message)
        return
      }

      if (!authData.user) {
        setError('Signup failed. Please try again.')
        return
      }

      // Create user record in users table with developer role
      const { error: userError } = await supabase.from('users').insert({
        id: authData.user.id,
        email: formData.email,
        full_name: formData.fullName,
        role: 'developer',
        status: 'active',
        organization_id: null, // Developers don't belong to organizations
      })

      if (userError) {
        console.error('Failed to create user record:', userError)
        // Don't fail signup - the auth user was created successfully
      }

      setSuccess(true)
      
      // Redirect after a short delay
      setTimeout(() => {
        router.push('/dev-auth/login')
      }, 3000)
    } catch (err) {
      console.error('Dev signup error:', err)
      setError('An unexpected error occurred. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  // Registration is closed
  if (!isOpen) {
    return (
      <Card className="w-full max-w-md border-yellow-200 dark:border-yellow-800">
        <CardHeader className="space-y-1">
          <div className="flex items-center gap-2 text-yellow-600 dark:text-yellow-400">
            <Terminal className="h-5 w-5" />
            <span className="text-sm font-medium">Developer Registration</span>
          </div>
          <CardTitle className="text-2xl font-bold">Registration Closed</CardTitle>
          <CardDescription>
            Developer registration is currently closed. All required developer accounts have been created.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4 text-sm dark:border-yellow-800 dark:bg-yellow-900/30">
            <p className="text-yellow-800 dark:text-yellow-300">
              If you need developer access, please contact an existing developer to request an account.
            </p>
          </div>
        </CardContent>
        <CardFooter>
          <Link href="/dev-auth/login" className="w-full">
            <Button variant="outline" className="w-full">
              Go to Login
            </Button>
          </Link>
        </CardFooter>
      </Card>
    )
  }

  // Success state
  if (success) {
    return (
      <Card className="w-full max-w-md border-green-200 dark:border-green-800">
        <CardHeader className="space-y-1">
          <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
            <CheckCircle2 className="h-5 w-5" />
            <span className="text-sm font-medium">Success!</span>
          </div>
          <CardTitle className="text-2xl font-bold">Account Created</CardTitle>
          <CardDescription>
            Your developer account has been created successfully.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-sm dark:border-green-800 dark:bg-green-900/30">
            <p className="text-green-800 dark:text-green-300">
              Please check your email to verify your account, then you can log in to the dev dashboard.
            </p>
          </div>
        </CardContent>
        <CardFooter>
          <Link href="/dev-auth/login" className="w-full">
            <Button className="w-full bg-green-600 hover:bg-green-700">
              Go to Login
            </Button>
          </Link>
        </CardFooter>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-md border-purple-200 dark:border-purple-800">
      <CardHeader className="space-y-1">
        <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400">
          <Terminal className="h-5 w-5" />
          <span className="text-sm font-medium">Developer Registration</span>
        </div>
        <CardTitle className="text-2xl font-bold">Create Dev Account</CardTitle>
        <CardDescription>
          Register as a platform developer. This grants full access to the dev dashboard.
        </CardDescription>
      </CardHeader>
      
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          {error && (
            <div className="flex items-start gap-2 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/30 dark:text-red-400">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="fullName">Full Name</Label>
            <Input
              id="fullName"
              type="text"
              placeholder="John Developer"
              value={formData.fullName}
              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              required
              disabled={isLoading}
              className="focus-visible:ring-purple-500"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="developer@trazo.app"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
              disabled={isLoading}
              className="focus-visible:ring-purple-500"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required
              disabled={isLoading}
              className="focus-visible:ring-purple-500"
            />
            <div className="space-y-1 text-xs">
              <p className={passwordRequirements.minLength ? 'text-green-600' : 'text-muted-foreground'}>
                ✓ At least 8 characters
              </p>
              <p className={passwordRequirements.hasUppercase ? 'text-green-600' : 'text-muted-foreground'}>
                ✓ One uppercase letter
              </p>
              <p className={passwordRequirements.hasLowercase ? 'text-green-600' : 'text-muted-foreground'}>
                ✓ One lowercase letter
              </p>
              <p className={passwordRequirements.hasNumber ? 'text-green-600' : 'text-muted-foreground'}>
                ✓ One number
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <Input
              id="confirmPassword"
              type="password"
              placeholder="••••••••"
              value={formData.confirmPassword}
              onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
              required
              disabled={isLoading}
              className="focus-visible:ring-purple-500"
            />
            {formData.confirmPassword && (
              <p className={passwordRequirements.passwordsMatch ? 'text-xs text-green-600' : 'text-xs text-red-500'}>
                {passwordRequirements.passwordsMatch ? '✓ Passwords match' : '✗ Passwords do not match'}
              </p>
            )}
          </div>
        </CardContent>

        <CardFooter className="flex flex-col gap-4">
          <Button
            type="submit"
            className="w-full bg-purple-600 hover:bg-purple-700 dark:bg-purple-700 dark:hover:bg-purple-600"
            disabled={isLoading || !isPasswordValid}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating account...
              </>
            ) : (
              <>
                <UserPlus className="mr-2 h-4 w-4" />
                Create Account
              </>
            )}
          </Button>

          <p className="text-center text-sm text-muted-foreground">
            Already have an account?{' '}
            <Link
              href="/dev-auth/login"
              className="text-purple-600 hover:underline dark:text-purple-400"
            >
              Sign in
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  )
}
