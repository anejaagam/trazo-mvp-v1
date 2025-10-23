'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function completeSignup(formData: FormData) {
  // Extract all form data from the steps
  const step1Data = JSON.parse(formData.get('step1Data') as string)
  const step2Data = JSON.parse(formData.get('step2Data') as string)
  const step3Data = JSON.parse(formData.get('step3Data') as string)
  const step4Data = JSON.parse(formData.get('step4Data') as string)

  // Determine region from step2Data (form sends "us" or "canada")
  const region = step2Data.dataRegion?.toLowerCase() === 'canada' ? 'CA' : 'US'
  console.log('Creating user with email:', step1Data.email, 'in region:', region, 'from dataRegion:', step2Data.dataRegion)
  
  // Create Supabase client for the selected region
  const supabase = await createClient(region)

  // Create user with Supabase Auth
  const { data, error } = await supabase.auth.signUp({
    email: step1Data.email,
    password: step1Data.password,
    options: {
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/auth/confirm?next=/dashboard`,
      data: {
        // Personal info
        full_name: step1Data.name,
        phone: step1Data.phoneNumber,
        role: step1Data.role,
        
        // Company info
        company_name: step2Data.companyName,
        company_website: step2Data.companyWebsite,
        farm_location: step2Data.farmLocation,
        data_region: step2Data.dataRegion,
        region: region, // Store the normalized region (US or CA) for easy lookup
        
        // Emergency contact
        emergency_contact_name: step3Data.emergencyContactPerson,
        emergency_contact_email: step3Data.emergencyContactEmail,
        emergency_contact_phone: step3Data.emergencyContactNumber,
        
        // Farm details - FIXED: jurisdiction and plant_type moved from step2 to step4
        number_of_containers: step4Data.numberOfContainers,
        jurisdiction: step4Data.jurisdiction, // MOVED from step2Data
        plant_type: step4Data.plantType, // MOVED from step2Data
        growing_environment: step4Data.growingEnvironment,
        // crop_type removed - was duplicate of plant_type
      },
    },
  })

  if (error) {
    console.error('Signup error:', error)
    redirect('/auth/error?message=' + encodeURIComponent(error.message))
  }

  if (data.user) {
    console.log('User created successfully:', data.user.id)
    
    // Redirect to verify email page
    redirect('/auth/verify-email?email=' + encodeURIComponent(step1Data.email))
  }
  
  // If we get here without a user, something went wrong
  redirect('/auth/error?message=' + encodeURIComponent('Failed to create user'))
}
