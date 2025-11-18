import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { isDevModeActive } from "@/lib/dev-mode";

export default function DevDashboard() {
  const isDevMode = isDevModeActive();

  if (!isDevMode) {
    return (
      <div className="flex-1 w-full flex flex-col gap-6 py-8 px-4 max-w-6xl mx-auto">
        <div className="text-center">
          <h1 className="text-3xl font-bold">Access Denied</h1>
          <p className="text-muted-foreground">Development mode is not enabled.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 w-full flex flex-col gap-6 py-8 px-4 max-w-6xl mx-auto">
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <h1 className="text-3xl font-bold">Development Dashboard</h1>
          <Badge variant="secondary">DEV MODE</Badge>
        </div>
        <p className="text-muted-foreground">
          Quick access to all Trazo OS features and systems
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Foundation Systems</CardTitle>
            <CardDescription>Core infrastructure and authentication</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link href="/protected" className="block p-2 hover:bg-muted rounded-md">
              <div className="font-medium">Main Dashboard</div>
              <div className="text-sm text-muted-foreground">User account and region info</div>
            </Link>
            <Link href="/test-regions" className="block p-2 hover:bg-muted rounded-md">
              <div className="font-medium">Region Testing</div>
              <div className="text-sm text-muted-foreground">Multi-region configuration</div>
            </Link>
            <Link href="/design-system" className="block p-2 hover:bg-muted rounded-md">
              <div className="font-medium">Design System</div>
              <div className="text-sm text-muted-foreground">UI components and patterns</div>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>RBAC System</CardTitle>
            <CardDescription>Role-based access control</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="p-2 bg-muted/50 rounded-md">
              <div className="font-medium">Permissions Engine</div>
              <div className="text-sm text-muted-foreground">8 roles, 50+ permissions</div>
            </div>
            <div className="p-2 bg-muted/50 rounded-md">
              <div className="font-medium">Role Guards</div>
              <div className="text-sm text-muted-foreground">Permission checking logic</div>
            </div>
            <div className="p-2 bg-muted/50 rounded-md">
              <div className="font-medium">Role Hierarchy</div>
              <div className="text-sm text-muted-foreground">Admin → Manager → Operator → Support</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Jurisdiction System</CardTitle>
            <CardDescription>Compliance and regulatory frameworks</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="p-2 bg-muted/50 rounded-md">
              <div className="font-medium">Oregon Cannabis</div>
              <div className="text-sm text-muted-foreground">State compliance rules</div>
            </div>
            <div className="p-2 bg-muted/50 rounded-md">
              <div className="font-medium">Maryland Cannabis</div>
              <div className="text-sm text-muted-foreground">State compliance rules</div>
            </div>
            <div className="p-2 bg-muted/50 rounded-md">
              <div className="font-medium">Canada Cannabis</div>
              <div className="text-sm text-muted-foreground">Federal compliance rules</div>
            </div>
            <div className="p-2 bg-muted/50 rounded-md">
              <div className="font-medium">PrimusGFS</div>
              <div className="text-sm text-muted-foreground">Produce certification</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Prototypes</CardTitle>
            <CardDescription>Phase 2 component prototypes</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="p-2 bg-muted/50 rounded-md">
              <div className="font-medium">Crop Management</div>
              <div className="text-sm text-muted-foreground">Crop lifecycle tracking</div>
            </div>
            <div className="p-2 bg-muted/50 rounded-md">
              <div className="font-medium">Environmental Controls</div>
              <div className="text-sm text-muted-foreground">Climate and monitoring</div>
            </div>
            <div className="p-2 bg-muted/50 rounded-md">
              <div className="font-medium">Inventory Tracking</div>
              <div className="text-sm text-muted-foreground">Real-time inventory</div>
            </div>
            <div className="p-2 bg-muted/50 rounded-md">
              <div className="font-medium">Compliance Engine</div>
              <div className="text-sm text-muted-foreground">Automated compliance</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Testing & Quality</CardTitle>
            <CardDescription>Test coverage and validation</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="p-2 bg-green-100 text-green-800 rounded-md">
              <div className="font-medium">✅ RBAC Tests</div>
              <div className="text-sm">84/91 passing</div>
            </div>
            <div className="p-2 bg-green-100 text-green-800 rounded-md">
              <div className="font-medium">✅ Jurisdiction Tests</div>
              <div className="text-sm">All configs validated</div>
            </div>
            <div className="p-2 bg-yellow-100 text-yellow-800 rounded-md">
              <div className="font-medium">🔧 Minor Issues</div>
              <div className="text-sm">7 tests need fixes</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Development Tools</CardTitle>
            <CardDescription>Debug and development utilities</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="p-2 bg-blue-100 text-blue-800 rounded-md">
              <div className="font-medium">🔧 Auth Bypass</div>
              <div className="text-sm">No login required in dev mode</div>
            </div>
            <div className="p-2 bg-blue-100 text-blue-800 rounded-md">
              <div className="font-medium">🌍 Multi-Region</div>
              <div className="text-sm">US & Canada environments</div>
            </div>
            <div className="p-2 bg-blue-100 text-blue-800 rounded-md">
              <div className="font-medium">📱 Responsive UI</div>
              <div className="text-sm">Mobile-first design system</div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Phase 1 Foundation Summary</CardTitle>
          <CardDescription>Completed infrastructure and systems</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <h4 className="font-medium mb-2">✅ Authentication & Authorization</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Multi-region Supabase setup (US/Canada)</li>
                <li>• Role-based access control (RBAC)</li>
                <li>• 8 system roles with permission inheritance</li>
                <li>• 50+ granular permissions</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-2">✅ Compliance & Jurisdiction</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Oregon & Maryland cannabis regulations</li>
                <li>• Canada federal cannabis compliance</li>
                <li>• PrimusGFS produce certification</li>
                <li>• Extensible jurisdiction framework</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-2">✅ Technical Infrastructure</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Next.js 15 with TypeScript</li>
                <li>• Tailwind CSS design system</li>
                <li>• Jest testing framework</li>
                <li>• ESLint & code quality tools</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-2">✅ Development Experience</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Hot reload development server</li>
                <li>• Authentication bypass for dev</li>
                <li>• Comprehensive test coverage</li>
                <li>• Component library prototypes</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
