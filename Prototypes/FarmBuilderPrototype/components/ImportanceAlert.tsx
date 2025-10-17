import { AlertCircle, Zap, FileCheck, X } from 'lucide-react';
import { useState } from 'react';
import { Alert, AlertDescription } from './ui/alert';

export function ImportanceAlert() {
  const [isDismissed, setIsDismissed] = useState(false);

  if (isDismissed) return null;

  return (
    <Alert className="bg-green-50 border-green-200 mb-4">
      <AlertCircle className="h-4 w-4 text-green-700" />
      <AlertDescription className="text-sm text-green-900">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <p className="mb-2">
              <strong>Why Accurate Site Plans Matter:</strong>
            </p>
            <ul className="space-y-1 text-xs">
              <li className="flex items-start gap-2">
                <Zap className="h-3 w-3 mt-0.5 flex-shrink-0 text-green-700" />
                <span><strong>Demand Response:</strong> Track electrical loads from pod controls, lighting systems, and HVAC for efficient energy management and utility incentives</span>
              </li>
              <li className="flex items-start gap-2">
                <FileCheck className="h-3 w-3 mt-0.5 flex-shrink-0 text-green-700" />
                <span><strong>Cultivation Compliance:</strong> Accurate site plans are required for licensing, inspections, and regulatory compliance in cannabis/controlled environment agriculture</span>
              </li>
            </ul>
          </div>
          <button
            onClick={() => setIsDismissed(true)}
            className="text-green-700 hover:text-green-900"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </AlertDescription>
    </Alert>
  );
}
