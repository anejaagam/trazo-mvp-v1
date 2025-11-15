'use client';

/* eslint-disable @typescript-eslint/no-explicit-any, @next/next/no-img-element */
import { useState, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { DualSignature } from '@/types/workflow';
import { PenTool, X, Check, Shield, Users } from 'lucide-react';

interface DualSignatureCaptureProps {
  config: DualSignature;
  onCapture: (signatures: any) => void;
  existingValue?: any;
}

export function DualSignatureCapture({ config, onCapture, existingValue }: DualSignatureCaptureProps) {
  const [signature1, setSignature1] = useState<string | null>(null);
  const [signature2, setSignature2] = useState<string | null>(null);
  const [currentSigner, setCurrentSigner] = useState<1 | 2 | null>(null);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const startDrawing = (signerNumber: 1 | 2) => {
    setCurrentSigner(signerNumber);
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = signerNumber === 1 ? '#3b82f6' : '#10b981';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';

    let isDrawing = false;

    const start = (e: MouseEvent | TouchEvent) => {
      isDrawing = true;
      const rect = canvas.getBoundingClientRect();
      const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
      const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;
      ctx.beginPath();
      ctx.moveTo(x, y);
    };

    const draw = (e: MouseEvent | TouchEvent) => {
      if (!isDrawing) return;
      const rect = canvas.getBoundingClientRect();
      const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
      const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;
      ctx.lineTo(x, y);
      ctx.stroke();
    };

    const stop = () => {
      isDrawing = false;
    };

    canvas.addEventListener('mousedown', start);
    canvas.addEventListener('mousemove', draw);
    canvas.addEventListener('mouseup', stop);
    canvas.addEventListener('touchstart', start);
    canvas.addEventListener('touchmove', draw);
    canvas.addEventListener('touchend', stop);
  };

  const saveSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const dataUrl = canvas.toDataURL();
    
    if (currentSigner === 1) {
      setSignature1(dataUrl);
      setCurrentSigner(null);
    } else if (currentSigner === 2) {
      setSignature2(dataUrl);
      setCurrentSigner(null);
    }
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  const submitBothSignatures = () => {
    if (!signature1 || !signature2) return;

    const result = {
      signature1: {
        userId: 'user-' + Math.random().toString(36).substr(2, 9),
        userName: `${config.role1.replace('_', ' ')} User`,
        role: config.role1,
        signature: signature1,
        timestamp: new Date()
      },
      signature2: {
        userId: 'user-' + Math.random().toString(36).substr(2, 9),
        userName: `${config.role2.replace('_', ' ')} User`,
        role: config.role2,
        signature: signature2,
        timestamp: new Date()
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
                <img src={existingValue.signature1?.signature} alt="Signature 1" className="w-full" />
              </div>
              <p className="text-sm text-green-700">
                Signed at {new Date(existingValue.signature1?.timestamp).toLocaleString()}
              </p>
            </div>
            <div className="space-y-2">
              <Badge variant="default">{getRoleLabel(config.role2)}</Badge>
              <div className="border-2 border-green-300 rounded-lg p-2 bg-white">
                <img src={existingValue.signature2?.signature} alt="Signature 2" className="w-full" />
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
                  <img src={signature1} alt="Signature 1" className="w-full" />
                </div>
                <Button 
                  variant="outline" 
                  onClick={() => setSignature1(null)}
                  className="w-full"
                >
                  <X className="w-4 h-4 mr-2" />
                  Clear Signature
                </Button>
              </div>
            ) : (
              <Button
                onClick={() => startDrawing(1)}
                disabled={currentSigner !== null}
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
                  <img src={signature2} alt="Signature 2" className="w-full" />
                </div>
                <Button 
                  variant="outline" 
                  onClick={() => setSignature2(null)}
                  className="w-full"
                >
                  <X className="w-4 h-4 mr-2" />
                  Clear Signature
                </Button>
              </div>
            ) : (
              <Button
                onClick={() => startDrawing(2)}
                disabled={currentSigner !== null}
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
        <Card className="border-2 border-blue-500">
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
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="border-2 border-slate-300 rounded-lg overflow-hidden bg-white">
              <canvas
                ref={canvasRef}
                width={600}
                height={200}
                className="w-full cursor-crosshair"
              />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={clearSignature}>
                <X className="w-4 h-4 mr-2" />
                Clear
              </Button>
              <Button onClick={saveSignature} className="flex-1">
                <Check className="w-4 h-4 mr-2" />
                Save Signature {currentSigner}
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
