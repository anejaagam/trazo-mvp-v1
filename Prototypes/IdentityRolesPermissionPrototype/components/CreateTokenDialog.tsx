import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Alert, AlertDescription } from './ui/alert';
import { Copy, Check, AlertTriangle } from 'lucide-react';
import { mockSites } from '../lib/mock-data';
import { toast } from 'sonner@2.0.3';

interface CreateTokenDialogProps {
  open: boolean;
  onClose: () => void;
  onCreate: (data: { name: string; siteId: string; siteName: string; token: string }) => void;
}

export function CreateTokenDialog({ open, onClose, onCreate }: CreateTokenDialogProps) {
  const [name, setName] = useState('');
  const [siteId, setSiteId] = useState('');
  const [step, setStep] = useState<'form' | 'reveal'>('form');
  const [generatedToken, setGeneratedToken] = useState('');
  const [copied, setCopied] = useState(false);

  const handleCreate = () => {
    // Generate mock token
    const token = `trazo_${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`;
    setGeneratedToken(token);
    setStep('reveal');
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedToken);
    setCopied(true);
    toast.success('Token copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleComplete = () => {
    const site = mockSites.find(s => s.id === siteId);
    onCreate({
      name,
      siteId,
      siteName: site?.name || '',
      token: generatedToken,
    });
    // Reset
    setName('');
    setSiteId('');
    setStep('form');
    setGeneratedToken('');
    setCopied(false);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Create API Token</DialogTitle>
          <DialogDescription>
            Generate a site-scoped token for Edge controllers
          </DialogDescription>
        </DialogHeader>

        {step === 'form' && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="tokenName">Token Name</Label>
              <Input
                id="tokenName"
                placeholder="e.g., Delta A Edge Controller"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
              <p className="text-xs text-slate-500">
                Use a descriptive name to identify this token's purpose
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="site">Site Scope</Label>
              <Select value={siteId} onValueChange={setSiteId}>
                <SelectTrigger id="site">
                  <SelectValue placeholder="Select a site" />
                </SelectTrigger>
                <SelectContent>
                  {mockSites.map(site => (
                    <SelectItem key={site.id} value={site.id}>
                      {site.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-slate-500">
                Token will only have access to this site's resources
              </p>
            </div>

            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                The token will be shown only once. Make sure to copy and store it securely.
              </AlertDescription>
            </Alert>

            <DialogFooter>
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button onClick={handleCreate} disabled={!name || !siteId}>
                Generate Token
              </Button>
            </DialogFooter>
          </div>
        )}

        {step === 'reveal' && (
          <div className="space-y-4">
            <Alert className="bg-green-50 border-green-200">
              <AlertDescription className="text-green-800">
                Token created successfully! Copy it now – you won't be able to see it again.
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <Label>Your API Token</Label>
              <div className="flex gap-2">
                <Input
                  value={generatedToken}
                  readOnly
                  className="font-mono text-sm"
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleCopy}
                >
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            <div className="bg-slate-50 p-3 rounded-lg text-sm space-y-2">
              <p className="font-medium">Token Details:</p>
              <div className="space-y-1 text-slate-600">
                <p>Name: {name}</p>
                <p>Scope: site:{siteId}</p>
                <p>Created: {new Date().toLocaleString()}</p>
              </div>
            </div>

            <Alert>
              <AlertDescription>
                Store this token securely in your Edge controller configuration. It cannot be retrieved later.
              </AlertDescription>
            </Alert>

            <DialogFooter>
              <Button onClick={handleComplete} className="w-full">
                Done
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
