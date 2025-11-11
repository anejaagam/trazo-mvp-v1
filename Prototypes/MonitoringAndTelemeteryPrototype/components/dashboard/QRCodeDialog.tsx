import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Button } from '../ui/button';
import { QrCode } from 'lucide-react';

interface QRCodeDialogProps {
  podId: string;
  podName: string;
}

export function QRCodeDialog({ podId, podName }: QRCodeDialogProps) {
  // In production, this would generate a real QR code linking to the pod detail page
  const deepLink = `${window.location.origin}/pod/${podId}`;
  
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <QrCode className="w-4 h-4 mr-2" />
          QR Code
        </Button>
      </DialogTrigger>
      
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Pod QR Code</DialogTitle>
          <DialogDescription>
            Scan this QR code with a mobile device to quickly access {podName}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          {/* QR Code Placeholder */}
          <div className="flex items-center justify-center p-8 bg-muted rounded-lg">
            <div className="text-center space-y-3">
              <QrCode className="w-32 h-32 mx-auto text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                QR Code for {podName}
              </p>
            </div>
          </div>
          
          {/* Deep Link */}
          <div className="space-y-2">
            <p className="text-xs">Deep Link:</p>
            <div className="p-3 bg-muted rounded-lg">
              <code className="text-xs break-all">{deepLink}</code>
            </div>
          </div>
          
          <div className="text-xs text-muted-foreground">
            <p>
              <strong>Note:</strong> In production, this would generate a scannable QR code
              that opens directly to this pod's monitoring page on mobile devices (UC-10).
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
