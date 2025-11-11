import { useState, useEffect } from 'react';
import { Box, Home, Users, Shield, Key, FileText, Settings, LogOut } from 'lucide-react';
import { Toaster } from './components/ui/sonner';
import { Button } from './components/ui/button';
import { Separator } from './components/ui/separator';
import { Badge } from './components/ui/badge';
import { LoginPage } from './components/LoginPage';
import { MFASetup } from './components/MFASetup';
import { Dashboard } from './components/Dashboard';
import { UserManagement } from './components/UserManagement';
import { RolesPermissions } from './components/RolesPermissions';
import { ApiTokenManagement } from './components/ApiTokenManagement';
import { AuditLog } from './components/AuditLog';
import { OrgSettings } from './components/OrgSettings';
import { toast } from 'sonner';

type View = 'dashboard' | 'users' | 'roles' | 'tokens' | 'audit' | 'settings';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showMFASetup, setShowMFASetup] = useState(false);
  const [currentUser, setCurrentUser] = useState<{ email: string; name: string } | null>(null);
  const [currentView, setCurrentView] = useState<View>('dashboard');

  useEffect(() => {
    // Check for existing session (mock)
    const session = localStorage.getItem('trazo_session');
    if (session) {
      setIsAuthenticated(true);
      setCurrentUser(JSON.parse(session));
    }
  }, []);

  const handleLogin = (email: string) => {
    const user = {
      email,
      name: email.split('@')[0].replace('.', ' '),
    };
    
    // Simulate session creation
    localStorage.setItem('trazo_session', JSON.stringify(user));
    setCurrentUser(user);
    
    // Show MFA setup for first-time users
    setShowMFASetup(true);
  };

  const handleMFAComplete = () => {
    setShowMFASetup(false);
    setIsAuthenticated(true);
    toast.success('Successfully authenticated');
  };

  const handleLogout = () => {
    localStorage.removeItem('trazo_session');
    setIsAuthenticated(false);
    setCurrentUser(null);
    setCurrentView('dashboard');
    toast.success('Logged out successfully');
  };

  if (!isAuthenticated) {
    return (
      <>
        <LoginPage onLogin={handleLogin} />
        <MFASetup open={showMFASetup} onComplete={handleMFAComplete} />
        <Toaster />
      </>
    );
  }

  const navigation = [
    { id: 'dashboard' as const, label: 'Dashboard', icon: Home },
    { id: 'users' as const, label: 'Users', icon: Users },
    { id: 'roles' as const, label: 'Roles & Permissions', icon: Shield },
    { id: 'tokens' as const, label: 'API Tokens', icon: Key },
    { id: 'audit' as const, label: 'Audit Log', icon: FileText },
    { id: 'settings' as const, label: 'Settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Box className="h-8 w-8 text-blue-600" />
              <div>
                <h1 className="text-xl">Trazo Identity & Access</h1>
                <p className="text-sm text-slate-500">
                  Role-based access control with multi-tenant isolation
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <div className="text-sm font-medium">{currentUser?.name}</div>
                <div className="text-xs text-slate-500">{currentUser?.email}</div>
              </div>
              <Badge className="bg-green-500">
                Org Admin
              </Badge>
              <Button variant="ghost" size="icon" onClick={handleLogout}>
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
        
        {/* Navigation */}
        <div className="px-6">
          <nav className="flex gap-1">
            {navigation.map((item) => {
              const Icon = item.icon;
              const isActive = currentView === item.id;
              
              return (
                <button
                  key={item.id}
                  onClick={() => setCurrentView(item.id)}
                  className={`
                    flex items-center gap-2 px-4 py-3 text-sm transition-colors
                    border-b-2 -mb-px
                    ${isActive 
                      ? 'border-blue-600 text-blue-600' 
                      : 'border-transparent text-slate-600 hover:text-slate-900'
                    }
                  `}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </button>
              );
            })}
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto p-6">
        {currentView === 'dashboard' && <Dashboard />}
        {currentView === 'users' && <UserManagement />}
        {currentView === 'roles' && <RolesPermissions />}
        {currentView === 'tokens' && <ApiTokenManagement />}
        {currentView === 'audit' && <AuditLog />}
        {currentView === 'settings' && <OrgSettings />}
      </main>

      {/* Footer */}
      <footer className="border-t bg-white mt-12">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between text-sm text-slate-500">
            <div className="flex items-center gap-6">
              <span>Trazo F-4.12: Identity, Roles & Permissions</span>
              <Separator orientation="vertical" className="h-4" />
              <span>MVP Implementation</span>
            </div>
            <div className="flex items-center gap-4">
              <Badge variant="outline" className="text-xs">
                Login p95: 1.2s
              </Badge>
              <Badge variant="outline" className="text-xs">
                RBAC p95: 6ms
              </Badge>
              <Badge variant="outline" className="text-xs">
                Revocation p95: 45s
              </Badge>
            </div>
          </div>
        </div>
      </footer>

      <Toaster />
    </div>
  );
}
