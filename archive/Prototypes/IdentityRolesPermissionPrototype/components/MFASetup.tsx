import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Alert, AlertDescription } from './ui/alert';
import { Shield, Copy, Check } from 'lucide-react';
import { toast } from 'sonner';

interface MFASetupProps {
  open: boolean;
  onComplete: () => void;
}

export function MFASetup({ open, onComplete }: MFASetupProps) {
  const [step, setStep] = useState<'qr' | 'verify'>('qr');
  const [code, setCode] = useState('');
  const [copied, setCopied] = useState(false);
  
  // Mock TOTP secret
  const secret = 'JBSWY3DPEHPK3PXP';
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=otpauth://totp/Trazo:admin@trazo.com?secret=${secret}&issuer=Trazo`;

  const handleCopySecret = () => {
    navigator.clipboard.writeText(secret);
    setCopied(true);
    toast.success('Secret copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleVerify = () => {
    if (code.length === 6) {
      toast.success('MFA enabled successfully');
      onComplete();
    } else {
      toast.error('Invalid code. Please try again.');
    }
  };

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-green-600" />
            <DialogTitle>Set up Two-Factor Authentication</DialogTitle>
          </div>
          <DialogDescription>
            Scan the QR code with your authenticator app
          </DialogDescription>
        </DialogHeader>

        {step === 'qr' && (
          <div className="space-y-4">
            <Alert>
              <AlertDescription>
                Use an authenticator app like Google Authenticator, Authy, or 1Password
              </AlertDescription>
            </Alert>

            <div className="flex justify-center p-4 bg-white border rounded-lg">
              <img src={qrCodeUrl} alt="QR Code" className="w-48 h-48" />
            </div>

            <div className="space-y-2">
              <Label>Or enter this secret manually:</Label>
              <div className="flex gap-2">
                <Input value={secret} readOnly className="font-mono" />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleCopySecret}
                >
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            <Button onClick={() => setStep('verify')} className="w-full">
              Continue to verification
            </Button>
          </div>
        )}

        {step === 'verify' && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="code">Enter the 6-digit code from your app</Label>
              <Input
                id="code"
                type="text"
                placeholder="000000"
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                className="text-center text-2xl tracking-widest"
              />
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep('qr')} className="flex-1">
                Back
              </Button>
              <Button onClick={handleVerify} className="flex-1">
                Verify and enable
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
