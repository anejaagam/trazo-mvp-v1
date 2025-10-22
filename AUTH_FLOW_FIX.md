# Auth Flow Fix Documentation

## Problem Identified (October 22, 2025)

The current signup flow at `/app/auth/sign-up/` **does not create users in Supabase**. 

### Current Flow (Broken):
1. Step 1: Collects name, email, phone → stores in `localStorage`
2. Step 2: Collects company, jurisdiction, plant type → stores in `localStorage`
3. Step 3: Collects emergency contacts → stores in `localStorage`
4. Step 4: Collects farm details → logs to console, redirects to success
5. ❌ **NO user is created in Supabase**
6. ❌ **NO confirmation email is sent**

### Root Cause:
In `/app/auth/sign-up/step-4/page.tsx` (line 38-42), the code does:
```typescript
console.log('Complete signup data:', allFormData);
// Here you would typically submit to your API
// For now, redirect to success page
window.location.href = '/auth/sign-up-success';
```

No `supabase.auth.signUp()` call is made.

### Additional Issues:
1. **No password field** - You're collecting email but not password
2. **No actual Supabase integration** - Form data is only stored locally
3. **Functional `SignUpForm` component exists** but is not used in the signup flow

---

## Solution

### Option 1: Fix the Multi-Step Form (Recommended)

**Step 1: Add Password Field**

Add password collection to Step 1 or create a new password step.

**Recommended location**: Step 1 after email field

```tsx
// In app/auth/sign-up/page.tsx
const [formData, setFormData] = useState({
  name: "",
  email: "",
  password: "",  // ADD THIS
  confirmPassword: "",  // ADD THIS
  phoneNumber: "",
  role: "org_admin"
});

// Add password fields to the JSX:
<div className="space-y-2">
  <Label htmlFor="password" required>Password</Label>
  <Field
    id="password"
    type="password"
    placeholder="Create a secure password"
    value={formData.password}
    onChange={(e) => handleInputChange('password', e.target.value)}
    className="bg-brand-lighter-green-50/60"
  />
  <p className="text-sm text-neutral-600">
    Must be at least 6 characters long.
  </p>
</div>

<div className="space-y-2">
  <Label htmlFor="confirmPassword" required>Confirm Password</Label>
  <Field
    id="confirmPassword"
    type="password"
    placeholder="Re-enter your password"
    value={formData.confirmPassword}
    onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
    className="bg-brand-lighter-green-50/60"
  />
</div>
```

**Step 2: Create Server Action for Signup**

Create `/app/auth/sign-up/actions.ts`:

```typescript
'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function completeSignup(formData: FormData) {
  const supabase = await createClient()

  // Extract all form data
  const step1Data = JSON.parse(formData.get('step1Data') as string)
  const step2Data = JSON.parse(formData.get('step2Data') as string)
  const step3Data = JSON.parse(formData.get('step3Data') as string)
  const step4Data = JSON.parse(formData.get('step4Data') as string)

  // Create user with Supabase Auth
  const { data, error } = await supabase.auth.signUp({
    email: step1Data.email,
    password: step1Data.password,
    options: {
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/confirm?next=/dashboard`,
      data: {
        // User metadata
        full_name: step1Data.name,
        phone: step1Data.phoneNumber,
        role: step1Data.role,
        
        // Company info
        company_name: step2Data.companyName,
        company_website: step2Data.companyWebsite,
        farm_location: step2Data.farmLocation,
        jurisdiction: step2Data.jurisdiction,
        plant_type: step2Data.plantType,
        data_region: step2Data.dataRegion,
        
        // Emergency contact
        emergency_contact_name: step3Data.emergencyContactPerson,
        emergency_contact_email: step3Data.emergencyContactEmail,
        emergency_contact_phone: step3Data.emergencyContactNumber,
        
        // Farm details
        number_of_containers: step4Data.numberOfContainers,
        crop_type: step4Data.cropType,
        growing_environment: step4Data.growingEnvironment,
      },
    },
  })

  if (error) {
    console.error('Signup error:', error)
    redirect('/auth/error?message=' + encodeURIComponent(error.message))
  }

  if (data.user) {
    // Clear localStorage
    if (typeof window !== 'undefined') {
      localStorage.removeItem('signupStep1')
      localStorage.removeItem('signupStep2')
      localStorage.removeItem('signupStep3')
      localStorage.removeItem('signupStep4')
    }
    
    // Redirect to verify email page
    redirect('/auth/verify-email?email=' + encodeURIComponent(step1Data.email))
  }
}
```

**Step 3: Update Step 4 to Call the Server Action**

Replace the `handleComplete` function in `/app/auth/sign-up/step-4/page.tsx`:

```typescript
'use client'

import { completeSignup } from '../actions'
import { useState } from 'react'

export default function SignUpStep4() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  // ... existing state ...

  const handleComplete = async () => {
    setIsSubmitting(true)
    
    try {
      // Combine all form data
      const step1Data = JSON.parse(localStorage.getItem('signupStep1') || '{}')
      const step2Data = JSON.parse(localStorage.getItem('signupStep2') || '{}')
      const step3Data = JSON.parse(localStorage.getItem('signupStep3') || '{}')
      
      // Create FormData object
      const formData = new FormData()
      formData.append('step1Data', JSON.stringify(step1Data))
      formData.append('step2Data', JSON.stringify(step2Data))
      formData.append('step3Data', JSON.stringify(step3Data))
      formData.append('step4Data', JSON.stringify(formData))
      
      // Call server action
      await completeSignup(formData)
    } catch (error) {
      console.error('Error completing signup:', error)
      alert('Failed to create account. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Update button to show loading state:
  <Button 
    variant="default"
    size="lg"
    onClick={handleComplete}
    disabled={!formData.numberOfContainers || isSubmitting}
    className="bg-brand-lightest-green-800 text-secondary-800 hover:bg-brand-lightest-green-700 px-8"
  >
    {isSubmitting ? 'Creating Account...' : 'Complete Setup'}
  </Button>
}
```

---

## Option 2: Use the Existing SignUpForm Component

The app already has a working signup component at `/components/auth/sign-up-form.tsx` that:
- ✅ Has password field
- ✅ Calls `supabase.auth.signUp()`
- ✅ Handles email confirmation
- ✅ Supports multi-region

**To use it:**

1. Create a simple signup page that uses this component:

```tsx
// app/auth/signup-simple/page.tsx
import { SignUpForm } from '@/components/auth/sign-up-form'

export default function SimpleSignup() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <SignUpForm />
    </div>
  )
}
```

2. This form already collects: email, password, full name, company name, and region
3. You can extend it to include the additional fields from your multi-step form

---

## Recommendation

**Go with Option 1** to maintain the better UX of your multi-step form, but add:
1. Password field in Step 1
2. Server action to call Supabase auth
3. Proper error handling
4. Email verification flow

This gives you the best of both worlds: nice UX + working authentication.

---

## Email Confirmation Setup

Make sure your Supabase project has email confirmation enabled:

1. Go to Dashboard → Authentication → URL Configuration
2. Set **Site URL** to `http://localhost:3000` (dev) or your production URL
3. Add redirect URLs:
   - `http://localhost:3000/auth/confirm`
   - `http://localhost:3000/dashboard`

4. Go to Dashboard → Authentication → Email Templates
5. Update the **Confirm Signup** template to use token hash:
   ```html
   <h2>Confirm your signup</h2>
   <p>Follow this link to confirm your user:</p>
   <p><a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email&next=/dashboard">Confirm your email</a></p>
   ```

---

## Testing Checklist

After implementing the fix:

- [ ] Password field appears in signup form
- [ ] Password validation works (min 6 characters)
- [ ] Complete signup button shows loading state
- [ ] User is created in `auth.users` table
- [ ] Confirmation email is sent
- [ ] Email link redirects to `/auth/confirm`
- [ ] After confirmation, user is redirected to `/dashboard`
- [ ] User metadata is saved correctly
- [ ] localStorage is cleared after successful signup
- [ ] Error messages display correctly

---

## Files to Modify

1. `/app/auth/sign-up/page.tsx` - Add password fields
2. `/app/auth/sign-up/actions.ts` - Create server action (NEW FILE)
3. `/app/auth/sign-up/step-4/page.tsx` - Call server action
4. `/app/auth/verify-email/page.tsx` - Create verify email page (NEW FILE)
5. Email templates in Supabase Dashboard

---

## Next Steps

1. Add password field to Step 1
2. Create the server action file
3. Update Step 4 to call the action
4. Test the complete flow
5. Verify email confirmation works
6. Test with both US and Canada regions
