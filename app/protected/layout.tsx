import { LogoutButton } from "@/components/auth/logout-button";
import { ThemeSwitcher } from "@/components/theme-switcher";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <main className="min-h-screen flex flex-col">
      <nav className="w-full border-b border-b-foreground/10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="max-w-7xl mx-auto flex justify-between items-center px-6 h-16">
          <div className="flex gap-6 items-center">
            <Link href="/protected" className="font-bold text-lg hover:text-blue-600 transition-colors">
              Trazo OS
            </Link>
          </div>
          <div className="flex items-center gap-4">
            {user && (
              <span className="text-sm text-muted-foreground">
                {user.email}
              </span>
            )}
            <ThemeSwitcher />
            <LogoutButton />
          </div>
        </div>
      </nav>
      
      <div className="flex-1">
        {children}
      </div>

      <footer className="w-full border-t py-6 text-center text-xs text-muted-foreground">
        <div className="max-w-7xl mx-auto px-6">
          <p>© {new Date().getFullYear()} Trazo OS - Edge-native container farm operating system</p>
        </div>
      </footer>
    </main>
  );
}
