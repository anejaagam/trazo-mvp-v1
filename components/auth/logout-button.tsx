"use client";

import { createClient, clearStoredRegion } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

export function LogoutButton() {
  const router = useRouter();

  const logout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    
    // Clear stored region
    clearStoredRegion();
    
    // Clear region cookie
    document.cookie = 'user_region=; path=/; max-age=0';
    
    router.push("/");
    router.refresh();
  };

  return (
    <Button onClick={logout} variant="outline" size="sm">
      Logout
    </Button>
  );
}
