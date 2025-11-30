import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { FileText, MapPin, Calendar, Download, Edit, Copy } from 'lucide-react';
import { useJurisdiction } from '../App';

interface Template {
  id: string;
  name: string;
  jurisdiction: string;
  category: string;
  frequency: string;
  fields: number;
  lastUpdated: string;
  status: 'active' | 'draft';
  description: string;
}

export function ComplianceTemplates() {
  const { jurisdiction } = useJurisdiction();
  
  const templates: Template[] = [
    {
      id: 'TPL-OR-001',
      name: 'Oregon OLCC Monthly Report',
      jurisdiction: 'OR',
      category: 'Cannabis',
      frequency: 'Monthly',
      fields: 45,
      lastUpdated: '2025-09-15',
      status: 'active',
      description: 'Oregon Liquor and Cannabis Commission monthly compliance report',
    },
    {
      id: 'TPL-OR-002',
      name: 'Plant Tagging Compliance Log',
      jurisdiction: 'OR',
      category: 'Operations',
      frequency: 'Ongoing',
      fields: 12,
      lastUpdated: '2025-08-20',
      status: 'active',
      description: '24-inch plant tagging requirement documentation',
    },
    {
      id: 'TPL-MD-001',
      name: 'Maryland MMCC Monthly Report',
      jurisdiction: 'MD',
      category: 'Cannabis',
      frequency: 'Monthly',
      fields: 38,
      lastUpdated: '2025-09-10',
      status: 'active',
      description: 'Medical Cannabis Commission monthly compliance submission',
    },
    {
      id: 'TPL-MD-002',
      name: 'Packaging Compliance Checklist',
      jurisdiction: 'MD',
      category: 'Packaging',
      frequency: 'Per Batch',
      fields: 15,
      lastUpdated: '2025-08-25',
      status: 'active',
      description: 'Child-resistant packaging and labeling compliance verification',
    },
    {
      id: 'TPL-CA-001',
      name: 'California BCC State Report',
      jurisdiction: 'CA',
      category: 'Cannabis',
      frequency: 'Monthly',
      fields: 52,
      lastUpdated: '2025-08-22',
      status: 'active',
      description: 'Bureau of Cannabis Control compliance template (Metrc-compatible)',
    },
    {
      id: 'TPL-CA-002',
      name: 'Metrc Daily Sync Report',
      jurisdiction: 'CA',
      category: 'Tracking',
      frequency: 'Daily',
      fields: 28,
      lastUpdated: '2025-09-01',
      status: 'active',
      description: 'Daily inventory and transaction sync with Metrc system',
    },
    {
      id: 'TPL-WA-001',
      name: 'Washington LCB Report',
      jurisdiction: 'WA',
      category: 'Cannabis',
      frequency: 'Monthly',
      fields: 41,
      lastUpdated: '2025-08-18',
      status: 'active',
      description: 'Liquor and Cannabis Board monthly compliance reporting',
    },
    {
      id: 'TPL-CO-001',
      name: 'Colorado MED Report',
      jurisdiction: 'CO',
      category: 'Cannabis',
      frequency: 'Monthly',
      fields: 48,
      lastUpdated: '2025-09-05',
      status: 'active',
      description: 'Marijuana Enforcement Division monthly compliance submission',
    },
    {
      id: 'TPL-CAN-CANNABIS-001',
      name: 'CTLS Cannabis Monthly Report',
      jurisdiction: 'CAN-CANNABIS',
      category: 'Cannabis',
      frequency: 'Monthly',
      fields: 47,
      lastUpdated: '2025-09-15',
      status: 'active',
      description: 'Cannabis Tracking and Licensing System monthly data submission template',
    },
    {
      id: 'TPL-CAN-CANNABIS-002',
      name: 'Bilingual Packaging Template',
      jurisdiction: 'CAN-CANNABIS',
      category: 'Packaging',
      frequency: 'Per Product',
      fields: 18,
      lastUpdated: '2025-08-30',
      status: 'active',
      description: 'English/French health warning and label compliance template',
    },
    {
      id: 'TPL-CAN-PRODUCE-001',
      name: 'Canada Produce Annual Compliance',
      jurisdiction: 'CAN-PRODUCE',
      category: 'Produce',
      frequency: 'Yearly',
      fields: 32,
      lastUpdated: '2025-01-10',
      status: 'active',
      description: 'Annual compliance template for produce operations under Canadian Food Safety regulations',
    },
    {
      id: 'TPL-CAN-PRODUCE-002',
      name: 'HACCP Control Point Log',
      jurisdiction: 'CAN-PRODUCE',
      category: 'Food Safety',
      frequency: 'Ongoing',
      fields: 24,
      lastUpdated: '2025-07-15',
      status: 'active',
      description: 'Critical control point monitoring and documentation',
    },

  ];

  const getFrequencyColor = (frequency: string) => {
    const colors: Record<string, string> = {
      Monthly: 'bg-blue-50 text-blue-700 border-blue-200',
      Yearly: 'bg-green-50 text-green-700 border-green-200',
      Varies: 'bg-yellow-50 text-yellow-700 border-yellow-200',
      Ongoing: 'bg-purple-50 text-purple-700 border-purple-200',
      'As Required': 'bg-slate-50 text-slate-700 border-slate-200',
    };
    return colors[frequency] || 'bg-slate-50 text-slate-700 border-slate-200';
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      Cannabis: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      Produce: 'bg-lime-50 text-lime-700 border-lime-200',
      'Food Safety': 'bg-orange-50 text-orange-700 border-orange-200',
      Operations: 'bg-cyan-50 text-cyan-700 border-cyan-200',
    };
    return colors[category] || 'bg-slate-50 text-slate-700 border-slate-200';
  };

  // Filter templates by current jurisdiction
  const filteredTemplates = templates.filter(t => t.jurisdiction === jurisdiction.code);
  
  // Group by category
  const groupedByCategory = filteredTemplates.reduce((acc, template) => {
    if (!acc[template.category]) {
      acc[template.category] = [];
    }
    acc[template.category].push(template);
    return acc;
  }, {} as Record<string, Template[]>);

  const TemplateCard = ({ template }: { template: Template }) => (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <CardTitle className="line-clamp-1">{template.name}</CardTitle>
            <CardDescription className="mt-2">{template.description}</CardDescription>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 mt-3">
          <Badge variant="outline" className={getCategoryColor(template.category)}>
            {template.category}
          </Badge>
          <Badge variant="outline" className={getFrequencyColor(template.frequency)}>
            <Calendar className="w-3 h-3 mr-1" />
            {template.frequency}
          </Badge>
          <Badge variant="outline">
            <FileText className="w-3 h-3 mr-1" />
            {template.fields} fields
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">

        <p className="text-slate-600">ID: {template.id}</p>
        <p className="text-slate-500">Last updated: {template.lastUpdated}</p>
        <div className="flex gap-2 pt-2">
          <Button variant="outline" size="sm" className="flex-1 gap-1">
            <Edit className="w-3 h-3" />
            Use Template
          </Button>
          <Button variant="outline" size="sm" className="gap-1">
            <Copy className="w-3 h-3" />
          </Button>
          <Button variant="outline" size="sm" className="gap-1">
            <Download className="w-3 h-3" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Compliance Templates</CardTitle>
              <CardDescription>
                Pre-configured templates for {jurisdiction.name} compliance reporting
              </CardDescription>
            </div>
            <Badge variant="outline" className="text-lg px-4 py-2">
              <MapPin className="w-4 h-4 mr-2" />
              {jurisdiction.name}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p>{jurisdiction.name} Templates</p>
            <p className="text-slate-600">
              Jurisdiction-specific templates configured for your compliance requirements
            </p>
          </div>

          {Object.entries(groupedByCategory).map(([category, categoryTemplates]) => (
            <div key={category} className="space-y-4">
              <div>
                <p>{category}</p>
                <p className="text-slate-600">{categoryTemplates.length} template{categoryTemplates.length !== 1 ? 's' : ''} available</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {categoryTemplates.map((template) => (
                  <TemplateCard key={template.id} template={template} />
                ))}
              </div>
            </div>
          ))}

          {filteredTemplates.length === 0 && (
            <div className="text-center py-12 border-2 border-dashed border-slate-200 rounded-lg">
              <FileText className="w-12 h-12 mx-auto mb-4 text-slate-300" />
              <p>No templates available</p>
              <p className="text-slate-600">Templates for {jurisdiction.name} are being configured</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
