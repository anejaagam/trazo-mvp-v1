-- ============================================
-- ACTIVATE ONBOARDED USERS
-- ============================================
-- This script activates users who were invited and onboarded
-- but are still marked with status='invited' due to the previous bug.
--
-- Run this in Supabase SQL Editor to fix existing users.
-- ============================================

-- Update users who have logged in but are still marked as 'invited'
-- We consider them onboarded if they have a last_sign_in timestamp
UPDATE public.users
SET 
  status = 'active',
  updated_at = NOW()
WHERE 
  status = 'invited'
  AND last_sign_in IS NOT NULL;

-- Show summary of changes
SELECT 
  'Updated ' || COUNT(*) || ' users from invited to active' AS summary
FROM public.users
WHERE 
  status = 'active'
  AND last_sign_in IS NOT NULL
  AND updated_at >= NOW() - INTERVAL '1 minute';

-- Show remaining invited users (who haven't logged in yet)
SELECT 
  COUNT(*) as remaining_invited_users,
  'These users have not logged in yet' as note
FROM public.users
WHERE status = 'invited';
