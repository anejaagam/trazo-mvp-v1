// Test file to check environment variable access
// Run this in browser console or as a test

console.log('Environment Variables Check:');
console.log('US URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
console.log('US Anon Key (first 20 chars):', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.substring(0, 20));
console.log('Canada URL:', process.env.CAN_NEXT_PUBLIC_CASUPABASE_URL);
console.log('Canada Anon Key (first 20 chars):', process.env.CAN_NEXT_PUBLIC_CASUPABASE_ANON_KEY?.substring(0, 20));
