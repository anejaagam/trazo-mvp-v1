'use client';

/* eslint-disable @typescript-eslint/no-explicit-any, @next/next/no-img-element */
import { useState, useRef } from 'react';
import Image from 'next/image';
import SignatureCanvas from 'react-signature-canvas';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { DualSignature, type TaskEvidence } from '@/types/workflow';
import { PenTool, X, Check, Shield, Users } from 'lucide-react';
import { toast } from 'sonner';

type DualSignatureValue = NonNullable<TaskEvidence['dualSignatures']>;

const SignaturePreview = ({ src, alt }: { src?: string | null; alt: string }) => {
  if (!src) {
    return <span className="text-sm text-muted-foreground">No signature</span>;
  }
  return (
    <Image
      src={src}
      alt={alt}
      width={400}
      height={200}
      className="h-auto w-full"
      unoptimized
    />
  );
};

interface DualSignatureCaptureProps {
  config: DualSignature;
  onCapture: (signatures: DualSignatureValue) => void;
  existingValue?: DualSignatureValue | null;
}

export function DualSignatureCapture({ config, onCapture, existingValue }: DualSignatureCaptureProps) {
  const [signature1, setSignature1] = useState<string | null>(null);
  const [signature2, setSignature2] = useState<string | null>(null);
  const [currentSigner, setCurrentSigner] = useState<1 | 2 | null>(null);
  
  const signature1Ref = useRef<SignatureCanvas>(null);
  const signature2Ref = useRef<SignatureCanvas>(null);

  const saveSignature = (signerNumber: 1 | 2) => {
    const ref = signerNumber === 1 ? signature1Ref : signature2Ref;
    
    if (ref.current?.isEmpty()) {
      toast.error('Please provide a signature');
      return;
    }

    const dataUrl = ref.current?.toDataURL();
    if (!dataUrl) return;
    
    if (signerNumber === 1) {
      setSignature1(dataUrl);
      setCurrentSigner(null);
      toast.success(`${getRoleLabel(config.role1)} signature captured`);
    } else {
      setSignature2(dataUrl);
      setCurrentSigner(null);
      toast.success(`${getRoleLabel(config.role2)} signature captured`);
    }
  };

  const clearSignature = (signerNumber: 1 | 2) => {
    const ref = signerNumber === 1 ? signature1Ref : signature2Ref;
    ref.current?.clear();
  };

  const submitBothSignatures = () => {
    if (!signature1 || !signature2) return;

    const result: DualSignatureValue = {
      signature1: {
        userId: 'user-' + Math.random().toString(36).substr(2, 9),
        userName: `${config.role1.replace('_', ' ')} User`,
        role: config.role1,
        signature: signature1,
        timestamp: new Date().toISOString()
      },
      signature2: {
        userId: 'user-' + Math.random().toString(36).substr(2, 9),
        userName: `${config.role2.replace('_', ' ')} User`,
        role: config.role2,
        signature: signature2,
        timestamp: new Date().toISOString()
      }
    };

    onCapture(result);
  };

  const getRoleLabel = (role: string): string => {
    return role.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  if (existingValue) {
    return (
      <Card className="border-green-200 bg-green-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-900">
            <Shield className="w-5 h-5" />
            Dual Signature Complete
          </CardTitle>
          <CardDescription className="text-green-700">
            Both required signatures have been captured
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Badge variant="default">{getRoleLabel(config.role1)}</Badge>
              <div className="border-2 border-green-300 rounded-lg p-2 bg-white">
                <SignaturePreview src={existingValue.signature1?.signature} alt="Signature 1" />
              </div>
              <p className="text-sm text-green-700">
                Signed at {new Date(existingValue.signature1?.timestamp).toLocaleString()}
              </p>
            </div>
            <div className="space-y-2">
              <Badge variant="default">{getRoleLabel(config.role2)}</Badge>
              <div className="border-2 border-green-300 rounded-lg p-2 bg-white">
                <SignaturePreview src={existingValue.signature2?.signature} alt="Signature 2" />
              </div>
              <p className="text-sm text-green-700">
                Signed at {new Date(existingValue.signature2?.timestamp).toLocaleString()}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Alert className="border-amber-200 bg-amber-50">
        <Shield className="h-4 w-4 text-amber-600" />
        <AlertDescription className="text-amber-900">
          <div className="flex items-center gap-2 mb-2">
            <Users className="w-4 h-4" />
            <span className="font-medium">High-Risk Action - Dual Authorization Required</span>
          </div>
          <p className="text-sm text-amber-700">{config.description}</p>
        </AlertDescription>
      </Alert>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Signature 1 */}
        <Card className={signature1 ? 'border-green-500' : 'border-slate-300'}>
          <CardHeader>
            <CardTitle className="flex items-center justify-between text-base">
              <div className="flex items-center gap-2">
                <span>Signature 1</span>
                <Badge variant="outline">{getRoleLabel(config.role1)}</Badge>
              </div>
              {signature1 && <Check className="w-5 h-5 text-green-500" />}
            </CardTitle>
            <CardDescription>
              Required from: {getRoleLabel(config.role1)}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {signature1 ? (
              <div className="space-y-3">
                <div className="border-2 border-green-500 rounded-lg p-2 bg-white">
                  <img src={signature1} alt="Signature 1" className="w-full h-auto max-h-40" />
                </div>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setSignature1(null);
                    signature1Ref.current?.clear();
                  }}
                  className="w-full"
                >
                  <X className="w-4 h-4 mr-2" />
                  Clear & Re-sign
                </Button>
              </div>
            ) : (
              <Button
                onClick={() => setCurrentSigner(1)}
                disabled={currentSigner !== null && currentSigner !== 1}
                className="w-full"
                variant={currentSigner === 1 ? 'default' : 'outline'}
              >
                <PenTool className="w-4 h-4 mr-2" />
                {currentSigner === 1 ? 'Signing...' : 'Sign Here'}
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Signature 2 */}
        <Card className={signature2 ? 'border-green-500' : 'border-slate-300'}>
          <CardHeader>
            <CardTitle className="flex items-center justify-between text-base">
              <div className="flex items-center gap-2">
                <span>Signature 2</span>
                <Badge variant="outline">{getRoleLabel(config.role2)}</Badge>
              </div>
              {signature2 && <Check className="w-5 h-5 text-green-500" />}
            </CardTitle>
            <CardDescription>
              Required from: {getRoleLabel(config.role2)}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {signature2 ? (
              <div className="space-y-3">
                <div className="border-2 border-green-500 rounded-lg p-2 bg-white">
                  <img src={signature2} alt="Signature 2" className="w-full h-auto max-h-40" />
                </div>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setSignature2(null);
                    signature2Ref.current?.clear();
                  }}
                  className="w-full"
                >
                  <X className="w-4 h-4 mr-2" />
                  Clear & Re-sign
                </Button>
              </div>
            ) : (
              <Button
                onClick={() => setCurrentSigner(2)}
                disabled={currentSigner !== null && currentSigner !== 2}
                className="w-full"
                variant={currentSigner === 2 ? 'default' : 'outline'}
              >
                <PenTool className="w-4 h-4 mr-2" />
                {currentSigner === 2 ? 'Signing...' : 'Sign Here'}
              </Button>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Signature Canvas */}
      {currentSigner && (
        <Card className="border-2 border-blue-500 bg-blue-50/30">
          <CardHeader>
            <CardTitle className="flex items-center justify-between text-base">
              <span>
                {currentSigner === 1 
                  ? `${getRoleLabel(config.role1)} - Sign Below` 
                  : `${getRoleLabel(config.role2)} - Sign Below`}
              </span>
              <Badge variant="default">
                Signature {currentSigner}
              </Badge>
            </CardTitle>
            <CardDescription>
              Please sign in the box below to verify your authorization
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="border-2 border-dashed border-gray-300 rounded-lg bg-gray-50">
              <SignatureCanvas
                ref={currentSigner === 1 ? signature1Ref : signature2Ref}
                canvasProps={{
                  className: 'w-full h-40 cursor-crosshair',
                }}
                backgroundColor="rgb(249, 250, 251)"
              />
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={() => clearSignature(currentSigner)}
              >
                <X className="w-4 h-4 mr-2" />
                Clear
              </Button>
              <Button 
                onClick={() => saveSignature(currentSigner)} 
                className="flex-1"
              >
                <Check className="w-4 h-4 mr-2" />
                Save Signature {currentSigner}
              </Button>
              <Button
                variant="ghost"
                onClick={() => setCurrentSigner(null)}
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Submit Button */}
      <Button
        onClick={submitBothSignatures}
        disabled={!signature1 || !signature2}
        className="w-full bg-green-600 hover:bg-green-700"
        size="lg"
      >
        <Shield className="w-5 h-5 mr-2" />
        Submit Both Signatures
      </Button>

      {/* Status */}
      <div className="flex items-center justify-center gap-4 text-sm text-slate-600">
        <div className="flex items-center gap-2">
          {signature1 ? (
            <Check className="w-5 h-5 text-green-500" />
          ) : (
            <div className="w-5 h-5 rounded-full border-2 border-slate-300" />
          )}
          <span>{getRoleLabel(config.role1)}</span>
        </div>
        <div className="flex items-center gap-2">
          {signature2 ? (
            <Check className="w-5 h-5 text-green-500" />
          ) : (
            <div className="w-5 h-5 rounded-full border-2 border-slate-300" />
          )}
          <span>{getRoleLabel(config.role2)}</span>
        </div>
      </div>
    </div>
  );
}
