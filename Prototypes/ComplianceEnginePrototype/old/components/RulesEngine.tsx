import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Switch } from './ui/switch';
import { Label } from './ui/label';
import { Alert, AlertDescription } from './ui/alert';
import { Separator } from './ui/separator';
import { Scale, MapPin, AlertTriangle, CheckCircle, Info } from 'lucide-react';
import { useJurisdiction } from '../App';

interface ComplianceRule {
  id: string;
  state: string;
  category: string;
  rule: string;
  description: string;
  enabled: boolean;
  severity: 'critical' | 'warning' | 'info';
  examples?: string[];
}

export function RulesEngine() {
  const { jurisdiction } = useJurisdiction();
  
  const [rules, setRules] = useState<ComplianceRule[]>([
    {
      id: 'OR-TAG-001',
      state: 'OR',
      category: 'Tagging',
      rule: '24-inch Plant Tagging Rule',
      description: 'All cannabis plants must be tagged when they reach 24 inches in height or enter the flowering stage, whichever comes first.',
      enabled: true,
      severity: 'critical',
      examples: [
        'System auto-flags plants ≥24" without tags',
        'Flowering room entry triggers tag requirement',
      ],
    },
    {
      id: 'OR-RET-001',
      state: 'OR',
      category: 'Record Retention',
      rule: '7-Year Record Retention',
      description: 'All production, inventory, and sales records must be retained for 7 years from the date of creation.',
      enabled: true,
      severity: 'critical',
      examples: [
        'Records locked after completion',
        'Auto-archive after 7 years',
      ],
    },
    {
      id: 'OR-INV-001',
      state: 'OR',
      category: 'Inventory',
      rule: 'Daily Inventory Reconciliation',
      description: 'Physical inventory counts must be reconciled with system records daily for high-value items.',
      enabled: true,
      severity: 'warning',
      examples: [
        'Daily reconciliation wizard prompts',
        'Variance threshold: >2% triggers alert',
      ],
    },
    {
      id: 'MD-RET-001',
      state: 'MD',
      category: 'Record Retention',
      rule: '2-Year Record Retention',
      description: 'Maryland requires retention of all cannabis-related records for a minimum of 2 years.',
      enabled: true,
      severity: 'critical',
      examples: [
        'Records auto-archive after 2 years',
        'Deletion only after retention period',
      ],
    },
    {
      id: 'MD-PKG-001',
      state: 'MD',
      category: 'Packaging',
      rule: 'Child-Resistant Packaging',
      description: 'All cannabis products must be packaged in child-resistant containers that meet CPSC standards.',
      enabled: true,
      severity: 'critical',
      examples: [
        'Package type validation on creation',
        'CPSC certification required in system',
      ],
    },
    {
      id: 'MD-LAB-001',
      state: 'MD',
      category: 'Testing',
      rule: 'Batch Testing Requirements',
      description: 'All batches must be tested for potency, pesticides, heavy metals, and microbial contaminants before sale.',
      enabled: true,
      severity: 'critical',
      examples: [
        'Block sales until lab COA uploaded',
        'Auto-quarantine untested batches',
      ],
    },
    {
      id: 'CA-MTR-001',
      state: 'CA',
      category: 'Reporting',
      rule: 'Metrc Real-Time Reporting',
      description: 'All inventory movements must be reported to Metrc within 24 hours.',
      enabled: true,
      severity: 'critical',
      examples: [
        'Auto-sync to Metrc API',
        'Alert if sync delayed >12 hours',
      ],
    },
    {
      id: 'CA-LIC-001',
      state: 'CA',
      category: 'Licensing',
      rule: 'Employee License Verification',
      description: 'All employees must have valid state-issued cannabis worker permits on file.',
      enabled: true,
      severity: 'critical',
      examples: [
        'License expiration alerts 30 days prior',
        'Block system access for expired licenses',
      ],
    },
    {
      id: 'WA-TEST-001',
      state: 'WA',
      category: 'Testing',
      rule: 'Mandatory Testing Protocol',
      description: 'All marijuana products must pass testing for moisture, potency, pesticides, and contaminants.',
      enabled: true,
      severity: 'critical',
      examples: [
        'Test results required before packaging',
        'Failed batches auto-quarantined',
      ],
    },
    {
      id: 'CO-TRACK-001',
      state: 'CO',
      category: 'Tracking',
      rule: 'METRC Tracking Requirements',
      description: 'All plants and products must be tracked in the state METRC system from seed to sale.',
      enabled: true,
      severity: 'critical',
      examples: [
        'Real-time sync with state system',
        'Tag assignment required at all stages',
      ],
    },
    {
      id: 'CAN-CANNABIS-001',
      state: 'CAN-CANNABIS',
      category: 'Reporting',
      rule: 'CTLS Monthly Reporting',
      description: 'Submit detailed monthly reports to Cannabis Tracking and Licensing System (CTLS) by the 15th of each month.',
      enabled: true,
      severity: 'critical',
      examples: [
        'Auto-compile monthly data',
        'Pre-submission validation checks',
      ],
    },
    {
      id: 'CAN-CANNABIS-002',
      state: 'CAN-CANNABIS',
      category: 'Packaging',
      rule: 'Health Warning Requirements',
      description: 'All cannabis products must display standardized health warnings in both English and French.',
      enabled: true,
      severity: 'critical',
      examples: [
        'Label template validation',
        'Bilingual requirement checks',
      ],
    },
    {
      id: 'CAN-PRODUCE-001',
      state: 'CAN-PRODUCE',
      category: 'Food Safety',
      rule: 'HACCP Implementation',
      description: 'Implement and maintain HACCP (Hazard Analysis Critical Control Point) protocols for food safety.',
      enabled: true,
      severity: 'critical',
      examples: [
        'Critical control point monitoring',
        'Corrective action documentation',
      ],
    },
    {
      id: 'CAN-PRODUCE-002',
      state: 'CAN-PRODUCE',
      category: 'Traceability',
      rule: 'One-Up, One-Back Traceability',
      description: 'Maintain records to trace produce one step forward and one step backward in the supply chain.',
      enabled: true,
      severity: 'critical',
      examples: [
        'Supplier documentation required',
        'Customer shipment tracking',
      ],
    },
  ]);

  const toggleRule = (ruleId: string) => {
    setRules(rules.map(r => r.id === ruleId ? { ...r, enabled: !r.enabled } : r));
  };

  // Filter rules based on current jurisdiction
  const filteredRules = rules.filter(r => r.state === jurisdiction.code);
  const enabledCount = filteredRules.filter(r => r.enabled).length;

  const getSeverityBadge = (severity: string) => {
    const colors: Record<string, string> = {
      critical: 'bg-red-50 text-red-700 border-red-200',
      warning: 'bg-yellow-50 text-yellow-700 border-yellow-200',
      info: 'bg-blue-50 text-blue-700 border-blue-200',
    };

    const icons: Record<string, JSX.Element> = {
      critical: <AlertTriangle className="w-3 h-3" />,
      warning: <AlertTriangle className="w-3 h-3" />,
      info: <Info className="w-3 h-3" />,
    };

    return (
      <Badge variant="outline" className={colors[severity]}>
        {icons[severity]}
        <span className="ml-1">{severity}</span>
      </Badge>
    );
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      Tagging: 'bg-purple-50 text-purple-700 border-purple-200',
      'Record Retention': 'bg-blue-50 text-blue-700 border-blue-200',
      Inventory: 'bg-green-50 text-green-700 border-green-200',
      Packaging: 'bg-orange-50 text-orange-700 border-orange-200',
      Testing: 'bg-pink-50 text-pink-700 border-pink-200',
      Reporting: 'bg-cyan-50 text-cyan-700 border-cyan-200',
      Licensing: 'bg-indigo-50 text-indigo-700 border-indigo-200',
      Tracking: 'bg-violet-50 text-violet-700 border-violet-200',
      'Food Safety': 'bg-lime-50 text-lime-700 border-lime-200',
      Traceability: 'bg-teal-50 text-teal-700 border-teal-200',
    };

    return colors[category] || 'bg-slate-50 text-slate-700 border-slate-200';
  };

  const getJurisdictionSpecificInfo = () => {
    switch (jurisdiction.code) {
      case 'OR':
        return {
          highlight: "Oregon's 24-inch tagging rule is unique. System automatically monitors plant height and triggers tagging requirements when threshold is reached.",
          color: 'purple'
        };
      case 'MD':
        return {
          highlight: "Maryland's 2-year retention period differs from other jurisdictions. Rules engine automatically adjusts archival policies.",
          color: 'purple'
        };
      case 'CA':
        return {
          highlight: "California requires real-time Metrc integration. All inventory movements sync automatically to state tracking system.",
          color: 'purple'
        };
      case 'CAN-CANNABIS':
        return {
          highlight: "Canadian cannabis regulations require monthly CTLS reporting and bilingual packaging labels (English/French).",
          color: 'purple'
        };
      case 'CAN-PRODUCE':
        return {
          highlight: "Canadian produce safety requires HACCP implementation and one-up, one-back traceability in the supply chain.",
          color: 'purple'
        };
      default:
        return null;
    }
  };

  const jurisdictionInfo = getJurisdictionSpecificInfo();

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Scale className="w-5 h-5" />
                State-Specific Rules Engine
              </CardTitle>
              <CardDescription>
                Conditional logic enforcing {jurisdiction.name} compliance requirements
              </CardDescription>
            </div>
            <Badge variant="outline" className="text-lg px-4 py-2">
              <MapPin className="w-4 h-4 mr-2" />
              {jurisdiction.name}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <Alert>
            <Scale className="h-4 w-4" />
            <AlertDescription>
              Rules engine automatically enforces {jurisdiction.name}-specific requirements. 
              All validations and system behaviors are configured for your jurisdiction.
            </AlertDescription>
          </Alert>

          <Card className="bg-slate-50">
            <CardContent className="pt-6">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-slate-600">Active Jurisdiction</p>
                  <p>{jurisdiction.name}</p>
                </div>
                <div>
                  <p className="text-slate-600">Total Rules</p>
                  <p>{filteredRules.length}</p>
                </div>
                <div>
                  <p className="text-slate-600">Enabled Rules</p>
                  <p className="text-green-600">{enabledCount}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Separator />

          <div className="space-y-4">
            {filteredRules.map((rule) => (
              <Card key={rule.id}>
                <CardHeader>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <CardTitle>{rule.rule}</CardTitle>
                        {rule.enabled ? (
                          <CheckCircle className="w-5 h-5 text-green-600" />
                        ) : (
                          <AlertTriangle className="w-5 h-5 text-slate-400" />
                        )}
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Badge variant="outline" className={getCategoryColor(rule.category)}>
                          {rule.category}
                        </Badge>
                        {getSeverityBadge(rule.severity)}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        id={rule.id}
                        checked={rule.enabled}
                        onCheckedChange={() => toggleRule(rule.id)}
                      />
                      <Label htmlFor={rule.id} className="cursor-pointer">
                        {rule.enabled ? 'Enabled' : 'Disabled'}
                      </Label>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <p className="text-slate-600">Description</p>
                    <p>{rule.description}</p>
                  </div>
                  {rule.examples && rule.examples.length > 0 && (
                    <div>
                      <p className="text-slate-600 mb-2">System Implementation</p>
                      <ul className="space-y-1">
                        {rule.examples.map((example, index) => (
                          <li key={index} className="flex items-start gap-2">
                            <span className="text-blue-600 mt-1">•</span>
                            <span className="text-slate-600">{example}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          {jurisdictionInfo && (
            <Card className={`bg-${jurisdictionInfo.color}-50 border-${jurisdictionInfo.color}-200`}>
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  <Info className={`w-5 h-5 text-${jurisdictionInfo.color}-600 mt-0.5 shrink-0`} />
                  <div>
                    <p>Jurisdiction-Specific Rules</p>
                    <p className="text-slate-600">{jurisdictionInfo.highlight}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
