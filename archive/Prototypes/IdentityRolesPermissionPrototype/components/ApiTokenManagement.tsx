import { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Badge } from './ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from './ui/dropdown-menu';
import { Plus, MoreVertical, Key, RotateCw, Trash2, Copy, Eye, EyeOff } from 'lucide-react';
import { ApiToken } from '../lib/supabase';
import { mockApiTokens } from '../lib/mock-data';
import { CreateTokenDialog } from './CreateTokenDialog';
import { StepUpMFADialog } from './StepUpMFADialog';
import { toast } from 'sonner';

export function ApiTokenManagement() {
  const [tokens, setTokens] = useState<ApiToken[]>(mockApiTokens);
  const [createOpen, setCreateOpen] = useState(false);
  const [stepUpOpen, setStepUpOpen] = useState(false);
  const [stepUpAction, setStepUpAction] = useState<{ type: 'create' | 'rotate'; tokenId?: string }>({ type: 'create' });
  const [revealedToken, setRevealedToken] = useState<string | null>(null);

  const handleCreateToken = () => {
    setStepUpAction({ type: 'create' });
    setStepUpOpen(true);
  };

  const handleRotateToken = (tokenId: string) => {
    setStepUpAction({ type: 'rotate', tokenId });
    setStepUpOpen(true);
  };

  const handleStepUpVerified = () => {
    setStepUpOpen(false);
    if (stepUpAction.type === 'create') {
      setCreateOpen(true);
    } else if (stepUpAction.type === 'rotate' && stepUpAction.tokenId) {
      rotateToken(stepUpAction.tokenId);
    }
  };

  const rotateToken = (tokenId: string) => {
    setTokens(tokens.map(t => 
      t.id === tokenId 
        ? { ...t, hash: `sha256:${Math.random().toString(36).substring(7)}...`, created_at_utc: new Date().toISOString() }
        : t
    ));
    toast.success('Token rotated successfully');
  };

  const handleRevokeToken = (tokenId: string) => {
    setTokens(tokens.map(t => 
      t.id === tokenId 
        ? { ...t, revoked_at_utc: new Date().toISOString() }
        : t
    ));
    toast.success('Token revoked');
  };

  const handleCopyToken = (token: string) => {
    navigator.clipboard.writeText(token);
    toast.success('Token copied to clipboard');
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleString();
  };

  const getTokenStatus = (token: ApiToken) => {
    if (token.revoked_at_utc) {
      return <Badge variant="destructive">Revoked</Badge>;
    }
    if (token.last_used_utc) {
      const lastUsed = new Date(token.last_used_utc);
      const hoursSinceUse = (Date.now() - lastUsed.getTime()) / (1000 * 60 * 60);
      if (hoursSinceUse < 24) {
        return <Badge className="bg-green-500">Active</Badge>;
      }
    }
    return <Badge variant="secondary">Inactive</Badge>;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>API Token Management</CardTitle>
              <CardDescription>
                Site-scoped tokens for Edge controllers and webhooks
              </CardDescription>
            </div>
            <Button onClick={handleCreateToken}>
              <Plus className="mr-2 h-4 w-4" />
              Create Token
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Scope</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Last Used</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tokens.map((token) => (
                  <TableRow key={token.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Key className="h-4 w-4 text-slate-400" />
                        <span className="font-medium">{token.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <Badge variant="outline">
                          {token.scope_type}: {token.scope_name}
                        </Badge>
                        {revealedToken === token.id && (
                          <div className="font-mono text-xs text-slate-600 bg-slate-50 p-2 rounded border flex items-center gap-2">
                            {token.hash}
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-6 w-6"
                              onClick={() => handleCopyToken(token.hash)}
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {getTokenStatus(token)}
                    </TableCell>
                    <TableCell className="text-sm text-slate-500">
                      {formatDate(token.created_at_utc)}
                    </TableCell>
                    <TableCell className="text-sm text-slate-500">
                      {formatDate(token.last_used_utc)}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem 
                            onClick={() => setRevealedToken(revealedToken === token.id ? null : token.id)}
                          >
                            {revealedToken === token.id ? (
                              <>
                                <EyeOff className="mr-2 h-4 w-4" />
                                Hide Hash
                              </>
                            ) : (
                              <>
                                <Eye className="mr-2 h-4 w-4" />
                                Show Hash
                              </>
                            )}
                          </DropdownMenuItem>
                          {!token.revoked_at_utc && (
                            <>
                              <DropdownMenuItem onClick={() => handleRotateToken(token.id)}>
                                <RotateCw className="mr-2 h-4 w-4" />
                                Rotate Token
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => handleRevokeToken(token.id)}
                                className="text-red-600"
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Revoke
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg text-sm space-y-2">
            <p className="font-medium text-blue-900">Token Security Guidelines</p>
            <ul className="list-disc list-inside space-y-1 text-blue-800">
              <li>Tokens are shown only once during creation</li>
              <li>Rotation invalidates the old token after a configurable grace period</li>
              <li>All token operations require step-up MFA and are audited</li>
              <li>Edge controllers auto-rotate short-lived certificates</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      <CreateTokenDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreate={(data) => {
          const newToken: ApiToken = {
            id: `tk${tokens.length + 1}`,
            name: data.name,
            scope_type: 'site',
            scope_id: data.siteId,
            scope_name: data.siteName,
            hash: `sha256:${Math.random().toString(36).substring(7)}...`,
            created_by: 'current-user',
            created_at_utc: new Date().toISOString(),
          };
          setTokens([...tokens, newToken]);
          setCreateOpen(false);
          toast.success('Token created successfully');
        }}
      />

      <StepUpMFADialog
        open={stepUpOpen}
        action={stepUpAction.type === 'create' ? 'Create API Token' : 'Rotate API Token'}
        actionDescription="This sensitive operation requires MFA verification"
        onVerify={handleStepUpVerified}
        onCancel={() => setStepUpOpen(false)}
      />
    </div>
  );
}
