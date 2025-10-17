import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Alert, AlertDescription } from './ui/alert';
import { ShieldAlert, Clock } from 'lucide-react';
import { toast } from 'sonner@2.0.3';

interface StepUpMFADialogProps {
  open: boolean;
  action: string;
  actionDescription?: string;
  onVerify: () => void;
  onCancel: () => void;
}

export function StepUpMFADialog({ 
  open, 
  action, 
  actionDescription,
  onVerify, 
  onCancel 
}: StepUpMFADialogProps) {
  const [code, setCode] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);

  const handleVerify = async () => {
    if (code.length !== 6) {
      toast.error('Please enter a 6-digit code');
      return;
    }

    setIsVerifying(true);
    
    // Simulate verification
    setTimeout(() => {
      setIsVerifying(false);
      toast.success('MFA verified');
      setCode('');
      onVerify();
    }, 1000);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && code.length === 6) {
      handleVerify();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onCancel}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <ShieldAlert className="h-5 w-5 text-amber-600" />
            <DialogTitle>Step-up Authentication Required</DialogTitle>
          </div>
          <DialogDescription>
            This action requires additional verification
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Alert>
            <Clock className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-1">
                <p className="font-medium">Action: {action}</p>
                {actionDescription && (
                  <p className="text-sm text-slate-600">{actionDescription}</p>
                )}
              </div>
            </AlertDescription>
          </Alert>

          <div className="space-y-2">
            <Label htmlFor="mfa-code">
              Enter your authenticator code
            </Label>
            <Input
              id="mfa-code"
              type="text"
              placeholder="000000"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
              onKeyPress={handleKeyPress}
              className="text-center text-2xl tracking-widest"
              autoFocus
            />
            <p className="text-xs text-slate-500">
              MFA verification required for sensitive actions (valid for 12 hours)
            </p>
          </div>

          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={onCancel}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleVerify}
              disabled={code.length !== 6 || isVerifying}
              className="flex-1"
            >
              {isVerifying ? 'Verifying...' : 'Verify & Continue'}
            </Button>
          </div>

          <div className="text-xs text-center text-slate-500">
            Can't access your authenticator? Contact your admin.
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
