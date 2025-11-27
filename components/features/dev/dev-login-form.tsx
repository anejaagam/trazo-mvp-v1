'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { logDevAction, DEV_AUDIT_ACTIONS } from '@/lib/dev-audit'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertCircle, Loader2, Lock, Terminal } from 'lucide-react'
import Link from 'next/link'

export function DevLoginForm() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const supabase = createClient()

      // Sign in with email and password
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      })

      if (authError) {
        setError(authError.message)
        return
      }

      if (!authData.user) {
        setError('Login failed. Please try again.')
        return
      }

      // Check if user has developer role
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('role, full_name')
        .eq('id', authData.user.id)
        .single()

      if (userError) {
        // User doesn't exist in users table
        await supabase.auth.signOut()
        setError('User not found. Please contact an administrator.')
        return
      }

      if (userData.role !== 'developer') {
        // Not a developer, sign out and show error
        await supabase.auth.signOut()
        setError('Access denied. This login is for developers only.')
        return
      }

      // Log the successful login
      await logDevAction({
        developerId: authData.user.id,
        action: DEV_AUDIT_ACTIONS.DEV_LOGIN,
        metadata: {
          email: formData.email,
          login_at: new Date().toISOString(),
        },
      })

      // Redirect to dev dashboard
      router.push('/dev-dashboard')
      router.refresh()
    } catch (err) {
      console.error('Dev login error:', err)
      setError('An unexpected error occurred. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-md border-purple-200 dark:border-purple-800">
      <CardHeader className="space-y-1">
        <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400">
          <Terminal className="h-5 w-5" />
          <span className="text-sm font-medium">Developer Access</span>
        </div>
        <CardTitle className="text-2xl font-bold">Dev Dashboard Login</CardTitle>
        <CardDescription>
          Sign in to access the developer dashboard. For platform developers only.
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
          </div>
        </CardContent>

        <CardFooter className="flex flex-col gap-4">
          <Button
            type="submit"
            className="w-full bg-purple-600 hover:bg-purple-700 dark:bg-purple-700 dark:hover:bg-purple-600"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Signing in...
              </>
            ) : (
              <>
                <Lock className="mr-2 h-4 w-4" />
                Sign In
              </>
            )}
          </Button>

          <p className="text-center text-sm text-muted-foreground">
            Need a developer account?{' '}
            <Link
              href="/dev-auth/signup"
              className="text-purple-600 hover:underline dark:text-purple-400"
            >
              Request access
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  )
}
