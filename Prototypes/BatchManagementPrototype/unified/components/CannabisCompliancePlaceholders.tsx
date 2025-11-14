import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Alert, AlertDescription } from '../../components/ui/alert';
import { 
  Shield, 
  AlertTriangle, 
  CheckCircle, 
  FileText,
  ExternalLink,
  Clock
} from 'lucide-react';
import { ICannabisBatch } from '../types/domains/cannabis';

interface ComplianceCheck {
  id: string;
  category: 'metrc' | 'testing' | 'packaging' | 'security' | 'inventory';
  requirement: string;
  status: 'compliant' | 'pending' | 'non-compliant' | 'not-applicable';
  description: string;
  dueDate?: string;
  completedDate?: string;
}

interface CannabisCompliancePlaceholdersProps {
  batch: ICannabisBatch;
  complianceChecks?: ComplianceCheck[];
  onMarkCompliant?: (checkId: string) => void;
  onViewRequirements?: (category: string) => void;
}

export const CannabisCompliancePlaceholders: React.FC<CannabisCompliancePlaceholdersProps> = ({
  batch,
  complianceChecks = [],
  onMarkCompliant,
  onViewRequirements
}) => {
  // Default compliance checks based on batch stage
  const getDefaultChecks = (): ComplianceCheck[] => {
    const checks: ComplianceCheck[] = [];

    // METRC Compliance
    if (['harvest', 'drying', 'curing', 'testing', 'packaging'].includes(batch.stage)) {
      checks.push({
        id: 'metrc-tracking',
        category: 'metrc',
        requirement: 'METRC Plant/Package Tracking',
        status: batch.metrcPackageTag ? 'compliant' : 'pending',
        description: 'All cannabis products must be tracked in the state\'s METRC system',
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
      });
    }

    // Testing Compliance
    if (batch.stage === 'testing' || batch.stage === 'packaging') {
      checks.push({
        id: 'lab-testing',
        category: 'testing',
        requirement: 'Required Laboratory Testing',
        status: 'pending',
        description: 'Potency, microbial, and pesticide testing required before sale',
        dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString()
      });
    }

    // Packaging Compliance
    if (batch.stage === 'packaging') {
      checks.push(
        {
          id: 'child-resistant',
          category: 'packaging',
          requirement: 'Child-Resistant Packaging',
          status: 'pending',
          description: 'All products must be in certified child-resistant packaging',
          dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          id: 'labeling',
          category: 'packaging',
          requirement: 'Compliant Product Labeling',
          status: 'pending',
          description: 'Labels must include all required warnings, THC content, and regulatory information',
          dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString()
        }
      );
    }

    // Security Compliance
    checks.push({
      id: 'security-footage',
      category: 'security',
      requirement: 'Video Surveillance Records',
      status: 'compliant',
      description: 'Maintain 90 days of security footage for all cultivation and processing areas',
      completedDate: new Date().toISOString()
    });

    // Inventory Compliance
    checks.push({
      id: 'inventory-reconciliation',
      category: 'inventory',
      requirement: 'Daily Inventory Reconciliation',
      status: 'compliant',
      description: 'Inventory counts must be reconciled daily in METRC',
      completedDate: new Date().toISOString()
    });

    return checks;
  };

  const allChecks = complianceChecks.length > 0 ? complianceChecks : getDefaultChecks();
  
  const compliantCount = allChecks.filter(c => c.status === 'compliant').length;
  const pendingCount = allChecks.filter(c => c.status === 'pending').length;
  const nonCompliantCount = allChecks.filter(c => c.status === 'non-compliant').length;

  const getStatusIcon = (status: ComplianceCheck['status']) => {
    switch (status) {
      case 'compliant':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'non-compliant':
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
      default:
        return null;
    }
  };

  const getStatusBadge = (status: ComplianceCheck['status']) => {
    switch (status) {
      case 'compliant':
        return <Badge className="bg-green-50 text-green-700">Compliant</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-50 text-yellow-700">Pending</Badge>;
      case 'non-compliant':
        return <Badge className="bg-red-50 text-red-700">Non-Compliant</Badge>;
      case 'not-applicable':
        return <Badge variant="outline">N/A</Badge>;
    }
  };

  const categories = [
    { id: 'metrc', label: 'METRC Tracking', icon: FileText },
    { id: 'testing', label: 'Lab Testing', icon: Shield },
    { id: 'packaging', label: 'Packaging', icon: FileText },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'inventory', label: 'Inventory', icon: FileText }
  ];

  return (
    <div className="space-y-4">
      {/* Compliance Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Compliance Status
          </CardTitle>
          <CardDescription>
            Cannabis regulatory compliance tracking (placeholder for integration)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-3 border rounded-lg bg-green-50">
              <div className="text-2xl font-bold text-green-700">{compliantCount}</div>
              <div className="text-sm text-green-600">Compliant</div>
            </div>
            <div className="text-center p-3 border rounded-lg bg-yellow-50">
              <div className="text-2xl font-bold text-yellow-700">{pendingCount}</div>
              <div className="text-sm text-yellow-600">Pending</div>
            </div>
            <div className="text-center p-3 border rounded-lg bg-red-50">
              <div className="text-2xl font-bold text-red-700">{nonCompliantCount}</div>
              <div className="text-sm text-red-600">Non-Compliant</div>
            </div>
          </div>

          {nonCompliantCount > 0 && (
            <Alert variant="destructive" className="mt-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                {nonCompliantCount} compliance requirement(s) need immediate attention
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Compliance Requirements by Category */}
      <Card>
        <CardHeader>
          <CardTitle>Compliance Requirements</CardTitle>
          <CardDescription>Review and track regulatory compliance for this batch</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {categories.map(category => {
            const categoryChecks = allChecks.filter(c => c.category === category.id);
            if (categoryChecks.length === 0) return null;

            const CategoryIcon = category.icon;

            return (
              <div key={category.id} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <CategoryIcon className="h-5 w-5" />
                    <h4 className="font-medium">{category.label}</h4>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onViewRequirements?.(category.id)}
                  >
                    <ExternalLink className="h-3 w-3 mr-1" />
                    View Requirements
                  </Button>
                </div>

                <div className="space-y-2">
                  {categoryChecks.map(check => (
                    <div
                      key={check.id}
                      className="flex items-start justify-between p-3 border rounded-lg bg-gray-50"
                    >
                      <div className="flex items-start gap-3 flex-1">
                        {getStatusIcon(check.status)}
                        <div className="flex-1">
                          <div className="font-medium text-sm">{check.requirement}</div>
                          <div className="text-xs text-muted-foreground mt-1">{check.description}</div>
                          {check.dueDate && check.status === 'pending' && (
                            <div className="text-xs text-orange-600 mt-1">
                              Due: {new Date(check.dueDate).toLocaleDateString()}
                            </div>
                          )}
                          {check.completedDate && (
                            <div className="text-xs text-green-600 mt-1">
                              Completed: {new Date(check.completedDate).toLocaleDateString()}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusBadge(check.status)}
                        {check.status === 'pending' && onMarkCompliant && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onMarkCompliant(check.id)}
                          >
                            Mark Complete
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Integration Notice */}
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          <strong>Placeholder Component:</strong> This compliance tracking interface is designed for integration with
          state regulatory systems (METRC, BioTrackTHC, etc.). Currently displaying mock compliance requirements.
        </AlertDescription>
      </Alert>
    </div>
  );
};
