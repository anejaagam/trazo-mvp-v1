import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { REGION_INFO } from "@/lib/types/region";

export default async function ProtectedPage() {
  const isDevMode = process.env.NEXT_PUBLIC_DEV_MODE === 'true';
  const supabase = await createClient();

  const { data: { user }, error } = await supabase.auth.getUser();
  
  // In development mode, create a mock user if no real user exists
  const effectiveUser = isDevMode && !user ? {
    email: 'dev@trazo.com',
    user_metadata: {
      full_name: 'Development User',
      company_name: 'Trazo Development',
      region: 'US'
    }
  } : user;

  if (!isDevMode && (error || !user)) {
    redirect("/auth/login");
  }

  // Get user's region from metadata
  const userRegion = effectiveUser?.user_metadata?.region || 'US';
  const regionInfo = REGION_INFO[userRegion as keyof typeof REGION_INFO];

  return (
    <div className="flex-1 w-full flex flex-col gap-6 py-8 px-4 max-w-6xl mx-auto">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome to Trazo OS - Your container farm operating system
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Account Information</CardTitle>
            <CardDescription>Your account details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <div className="text-sm font-medium text-muted-foreground">Email</div>
              <div className="text-sm">{effectiveUser?.email}</div>
            </div>
            {effectiveUser?.user_metadata?.full_name && (
              <div>
                <div className="text-sm font-medium text-muted-foreground">Full Name</div>
                <div className="text-sm">{effectiveUser.user_metadata.full_name}</div>
              </div>
            )}
            {effectiveUser?.user_metadata?.company_name && (
              <div>
                <div className="text-sm font-medium text-muted-foreground">Company</div>
                <div className="text-sm">{effectiveUser.user_metadata.company_name}</div>
              </div>
            )}
            {effectiveUser && 'created_at' in effectiveUser && (
              <div>
                <div className="text-sm font-medium text-muted-foreground">Account Created</div>
                <div className="text-sm">
                  {new Date(effectiveUser.created_at).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Data Region</CardTitle>
            <CardDescription>Where your data is stored</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <div className="text-2xl mb-2">{regionInfo?.flag || '🌎'}</div>
              <div className="text-lg font-medium">{regionInfo?.name || 'United States'}</div>
              <Badge variant="secondary" className="mt-2">
                {regionInfo?.supabaseRegion || 'us-east-1'}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              Your data is securely stored in {regionInfo?.name || 'the United States'} to comply with regional data residency requirements.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Manage your account</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-sm text-muted-foreground">
              More features coming soon. Your edge-native container farm operating system is being prepared.
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Getting Started</CardTitle>
          <CardDescription>Next steps to set up your container infrastructure</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-600 font-semibold">
                1
              </div>
              <div>
                <h4 className="font-medium">Configure your infrastructure</h4>
                <p className="text-sm text-muted-foreground">
                  Set up your container clusters and edge nodes
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-600 font-semibold">
                2
              </div>
              <div>
                <h4 className="font-medium">Deploy your first container</h4>
                <p className="text-sm text-muted-foreground">
                  Launch your applications on the edge
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-600 font-semibold">
                3
              </div>
              <div>
                <h4 className="font-medium">Monitor and scale</h4>
                <p className="text-sm text-muted-foreground">
                  Track performance and scale your infrastructure
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
