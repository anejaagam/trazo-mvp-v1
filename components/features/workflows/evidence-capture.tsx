'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { EvidenceType, DualSignature } from '@/types/workflow';
import { Camera, QrCode, PenTool, Upload, Check, X } from 'lucide-react';
import { DualSignatureCapture } from './dual-signature-capture';
import { useToast } from '@/components/ui/use-toast';
import { MAX_EVIDENCE_BYTES_BEFORE_COMPRESSION, isEvidenceWithinSizeLimit } from '@/lib/utils/evidence-compression';

const formatBytes = (bytes: number) => {
  if (!bytes) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  let value = bytes;
  let unitIndex = 0;
  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex++;
  }
  return `${unitIndex === 0 ? value.toFixed(0) : value.toFixed(1)} ${units[unitIndex]}`;
};

interface EvidenceCaptureProps {
  type: EvidenceType;
  config?: {
    minValue?: number;
    maxValue?: number;
    unit?: string;
    options?: string[];
    requiredText?: string;
    dualSignature?: DualSignature;
    minLength?: number;
    maxLength?: number;
    requireLocation?: boolean;
    maxPhotos?: number;
  };
  onCapture: (value: any) => void;
  existingValue?: any;
}

export function EvidenceCapture({ type, config, onCapture, existingValue }: EvidenceCaptureProps) {
  const [value, setValue] = useState(existingValue || '');
  const [checkedOptions, setCheckedOptions] = useState<string[]>(
    Array.isArray(existingValue) ? existingValue : []
  );
  const [isDrawing, setIsDrawing] = useState(false);
  const [qrScanning, setQrScanning] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleNumericSubmit = () => {
    const numValue = parseFloat(value);
    
    if (isNaN(numValue)) {
      toast({
        title: 'Invalid number',
        description: 'Please enter a valid numeric value.',
        variant: 'destructive',
      });
      return;
    }

    if (config?.minValue !== undefined && numValue < config.minValue) {
      toast({
        title: 'Value too low',
        description: `Value must be at least ${config.minValue} ${config.unit || ''}`,
        variant: 'destructive',
      });
      return;
    }

    if (config?.maxValue !== undefined && numValue > config.maxValue) {
      toast({
        title: 'Value too high',
        description: `Value must be at most ${config.maxValue} ${config.unit || ''}`,
        variant: 'destructive',
      });
      return;
    }

    onCapture(numValue);
  };

  const handleCheckboxSubmit = () => {
    if (checkedOptions.length === 0) {
      toast({
        title: 'Selection required',
        description: 'Please select at least one option.',
        variant: 'destructive',
      });
      return;
    }
    onCapture(checkedOptions);
  };

  const handlePhotoCapture = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!isEvidenceWithinSizeLimit(file.size)) {
        toast({
          title: 'File too large',
          description: `Please upload evidence smaller than ${formatBytes(MAX_EVIDENCE_BYTES_BEFORE_COMPRESSION)}.`,
          variant: 'destructive',
        });
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setValue(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePhotoSubmit = () => {
    if (!value) {
      toast({
        title: 'Photo required',
        description: 'Capture or upload a photo before submitting.',
        variant: 'destructive',
      });
      return;
    }
    onCapture(value);
  };

  const startSignature = () => {
    setIsDrawing(true);
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';

    let isDrawingNow = false;

    const startDrawing = (e: MouseEvent | TouchEvent) => {
      isDrawingNow = true;
      const rect = canvas.getBoundingClientRect();
      const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
      const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;
      ctx.beginPath();
      ctx.moveTo(x, y);
    };

    const draw = (e: MouseEvent | TouchEvent) => {
      if (!isDrawingNow) return;
      const rect = canvas.getBoundingClientRect();
      const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
      const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;
      ctx.lineTo(x, y);
      ctx.stroke();
    };

    const stopDrawing = () => {
      isDrawingNow = false;
    };

    canvas.addEventListener('mousedown', startDrawing);
    canvas.addEventListener('mousemove', draw);
    canvas.addEventListener('mouseup', stopDrawing);
    canvas.addEventListener('touchstart', startDrawing);
    canvas.addEventListener('touchmove', draw);
    canvas.addEventListener('touchend', stopDrawing);
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  const submitSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL();
    onCapture(dataUrl);
  };

  const simulateQRScan = () => {
    setQrScanning(true);
    setTimeout(() => {
      const mockQRData = `QR-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      setValue(mockQRData);
      setQrScanning(false);
    }, 1500);
  };

  const handleTextSubmit = () => {
    if (!value) {
      toast({
        title: 'Text required',
        description: 'Please enter a response.',
        variant: 'destructive',
      });
      return;
    }

    if (config?.minLength && value.length < config.minLength) {
      toast({
        title: 'Response too short',
        description: `Text must be at least ${config.minLength} characters.`,
        variant: 'destructive',
      });
      return;
    }

    if (config?.maxLength && value.length > config.maxLength) {
      toast({
        title: 'Response too long',
        description: `Text must be at most ${config.maxLength} characters.`,
        variant: 'destructive',
      });
      return;
    }

    onCapture(value);
  };

  switch (type) {
    case 'numeric':
      return (
        <div className="space-y-4">
          <div className="flex items-end gap-2">
            <div className="flex-1">
              <Label>Enter Value</Label>
              <Input
                type="number"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder={`Enter value${config?.unit ? ` (${config.unit})` : ''}`}
                step="0.01"
              />
              {(config?.minValue !== undefined || config?.maxValue !== undefined) && (
                <p className="text-sm text-slate-600 mt-1">
                  Range: {config.minValue ?? 'any'} - {config.maxValue ?? 'any'} {config?.unit}
                </p>
              )}
            </div>
            <Button onClick={handleNumericSubmit} disabled={!value}>
              <Check className="w-4 h-4 mr-2" />
              Submit
            </Button>
          </div>
          {existingValue && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm text-green-900">
                Recorded: {existingValue} {config?.unit}
              </p>
            </div>
          )}
        </div>
      );

    case 'checkbox':
      return (
        <div className="space-y-4">
          <div className="space-y-3">
            {config?.options?.map((option) => (
              <div key={option} className="flex items-center space-x-2">
                <Checkbox
                  id={option}
                  checked={checkedOptions.includes(option)}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      setCheckedOptions([...checkedOptions, option]);
                    } else {
                      setCheckedOptions(checkedOptions.filter(o => o !== option));
                    }
                  }}
                />
                <Label htmlFor={option} className="cursor-pointer">
                  {option}
                </Label>
              </div>
            ))}
          </div>
          <Button onClick={handleCheckboxSubmit} disabled={checkedOptions.length === 0}>
            <Check className="w-4 h-4 mr-2" />
            Submit ({checkedOptions.length} selected)
          </Button>
          {existingValue && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm text-green-900">Completed checklist</p>
            </div>
          )}
        </div>
      );

    case 'photo':
      return (
        <div className="space-y-4">
          {/* Pre-compression advisory */}
          {!existingValue && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded" aria-label="Compression advisory">
              <p className="text-xs text-blue-900">Photos larger than 500KB are automatically optimized (est. up to 60% size reduction) to preserve storage and speed.</p>
            </div>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleFileChange}
            className="hidden"
          />
          
          <div className="border-2 border-dashed border-slate-300 rounded-lg p-8 text-center">
            {value ? (
              <div className="space-y-4">
                <img src={value} alt="Captured" className="max-h-64 mx-auto rounded" />
                <div className="flex gap-2 justify-center">
                  <Button variant="outline" onClick={() => setValue('')}>
                    <X className="w-4 h-4 mr-2" />
                    Remove
                  </Button>
                  <Button onClick={handlePhotoSubmit}>
                    <Check className="w-4 h-4 mr-2" />
                    Submit Photo
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <Camera className="w-12 h-12 text-slate-400 mx-auto" />
                <div>
                  <p className="text-sm text-slate-600 mb-4">Capture or upload photo evidence</p>
                  <div className="flex gap-2 justify-center flex-wrap">
                    <Button onClick={handlePhotoCapture}>
                      <Camera className="w-4 h-4 mr-2" />
                      Take Photo
                    </Button>
                    <Button variant="outline" onClick={handlePhotoCapture}>
                      <Upload className="w-4 h-4 mr-2" />
                      Upload
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          {existingValue && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm text-green-900">Photo evidence captured</p>
            </div>
          )}
        </div>
      );

    case 'signature':
      return (
        <div className="space-y-4">
          {!existingValue && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded" aria-label="Compression advisory">
              <p className="text-xs text-blue-900">Large signatures (&gt;50KB) may be reduced ~30% for efficiency. Small signatures are stored as-is.</p>
            </div>
          )}
          <div className="border-2 border-slate-300 rounded-lg overflow-hidden">
            <canvas
              ref={canvasRef}
              width={600}
              height={200}
              className="w-full bg-white cursor-crosshair"
              onMouseEnter={startSignature}
              onTouchStart={startSignature}
            />
          </div>
          
          <div className="flex gap-2">
            <Button variant="outline" onClick={clearSignature}>
              <X className="w-4 h-4 mr-2" />
              Clear
            </Button>
            <Button onClick={submitSignature} className="flex-1">
              <PenTool className="w-4 h-4 mr-2" />
              Submit Signature
            </Button>
          </div>

          <p className="text-sm text-slate-600 text-center">
            Sign above to approve this step
          </p>

          {existingValue && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm text-green-900">Signature captured</p>
            </div>
          )}
        </div>
      );

    case 'qr_scan':
      return (
        <div className="space-y-4">
          <div className="border-2 border-dashed border-slate-300 rounded-lg p-8 text-center">
            {qrScanning ? (
              <div className="space-y-4">
                <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-sm text-slate-600">Scanning QR code...</p>
              </div>
            ) : value ? (
              <div className="space-y-4">
                <QrCode className="w-12 h-12 text-green-500 mx-auto" />
                <div className="p-3 bg-slate-50 rounded font-mono text-sm">{value}</div>
                <div className="flex gap-2 justify-center">
                  <Button variant="outline" onClick={() => setValue('')}>
                    <X className="w-4 h-4 mr-2" />
                    Clear
                  </Button>
                  <Button onClick={() => onCapture(value)}>
                    <Check className="w-4 h-4 mr-2" />
                    Submit
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <QrCode className="w-12 h-12 text-slate-400 mx-auto" />
                <p className="text-sm text-slate-600 mb-4">
                  {config?.requiredText || 'Scan QR code for asset verification'}
                </p>
                <Button onClick={simulateQRScan}>
                  <QrCode className="w-4 h-4 mr-2" />
                  Scan QR Code
                </Button>
              </div>
            )}
          </div>

          {existingValue && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm text-green-900">QR code scanned: {existingValue}</p>
            </div>
          )}
        </div>
      );

    case 'text':
      return (
        <div className="space-y-4">
          <div>
            <Label>{config?.requiredText || 'Enter notes or observations'}</Label>
            <Textarea
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="Enter detailed notes..."
              rows={4}
              className="mt-2"
            />
            {(config?.minLength || config?.maxLength) && (
              <p className="text-sm text-slate-600 mt-1">
                {value.length} / {config?.maxLength || '∞'} characters
                {config?.minLength && ` (min: ${config.minLength})`}
              </p>
            )}
          </div>
          <Button onClick={handleTextSubmit} disabled={!value}>
            <Check className="w-4 h-4 mr-2" />
            Submit Notes
          </Button>
          {existingValue && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm text-green-900">Notes recorded</p>
            </div>
          )}
        </div>
      );

    case 'dual_signature':
      if (!config?.dualSignature) {
        return <p className="text-sm text-slate-600">Dual signature configuration missing</p>;
      }
      return (
        <DualSignatureCapture
          config={config.dualSignature}
          onCapture={onCapture}
          existingValue={existingValue}
        />
      );

    default:
      return <p className="text-sm text-slate-600">Unknown evidence type</p>;
  }
}
