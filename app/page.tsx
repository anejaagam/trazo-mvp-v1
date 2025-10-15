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

  // If not authenticated, redirect to landing page
  redirect('/landing');
}