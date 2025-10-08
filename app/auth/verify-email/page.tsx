'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Mail } from 'lucide-react';

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const email = searchParams.get('email');

  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-md">
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-100">
              <Mail className="h-8 w-8 text-blue-600" />
            </div>
            <CardTitle className="text-2xl">Check your email</CardTitle>
            <CardDescription>
              We&apos;ve sent a verification link to{email && <><br /><strong className="text-foreground">{email}</strong></>}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg bg-muted p-4 text-sm">
              <p className="mb-2">
                Click the link in the email to verify your account and complete your registration.
              </p>
              <p className="text-muted-foreground">
                The link will expire in 24 hours.
              </p>
            </div>
            
            <div className="space-y-2 text-sm text-muted-foreground">
              <p className="font-medium">Didn&apos;t receive the email?</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Check your spam or junk folder</li>
                <li>Make sure you entered the correct email address</li>
                <li>Wait a few minutes and check again</li>
              </ul>
            </div>

            <div className="pt-4 text-center">
              <a
                href="/auth/login"
                className="text-sm text-blue-600 hover:underline"
              >
                Back to login
              </a>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
        <div className="w-full max-w-md">
          <Card>
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-100">
                <Mail className="h-8 w-8 text-blue-600" />
              </div>
              <CardTitle className="text-2xl">Check your email</CardTitle>
              <CardDescription>Loading...</CardDescription>
            </CardHeader>
          </Card>
        </div>
      </div>
    }>
      <VerifyEmailContent />
    </Suspense>
  );
}
