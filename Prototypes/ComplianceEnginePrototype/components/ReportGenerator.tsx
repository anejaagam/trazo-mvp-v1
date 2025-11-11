import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Checkbox } from './ui/checkbox';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { Calendar } from './ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Download, FileText, FileSpreadsheet, CalendarIcon, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';

export function ReportGenerator() {
  const [selectedJurisdiction, setSelectedJurisdiction] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [dateFrom, setDateFrom] = useState<Date>();
  const [dateTo, setDateTo] = useState<Date>();
  const [includeEvidence, setIncludeEvidence] = useState(true);
  const [includeSignatures, setIncludeSignatures] = useState(true);
  const [includeAuditLog, setIncludeAuditLog] = useState(false);

  const jurisdictions = [
    { value: 'canada-cannabis', label: 'Canada - Cannabis', templates: ['CTLS Monthly Report', 'Quarterly Summary'] },
    { value: 'canada-produce', label: 'Canada - Produce', templates: ['Annual Compliance', 'Safety Audit'] },
    { value: 'us-california', label: 'US - California', templates: ['State Report', 'Metrc Export'] },
    { value: 'primusgfs', label: 'PrimusGFS', templates: ['Audit Preparation', 'Certification Package'] },
  ];

  const selectedJurisdictionData = jurisdictions.find(j => j.value === selectedJurisdiction);

  const handleGenerate = () => {
    console.log('Generating report with:', {
      jurisdiction: selectedJurisdiction,
      template: selectedTemplate,
      dateFrom,
      dateTo,
      includeEvidence,
      includeSignatures,
      includeAuditLog,
    });
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Report Configuration</CardTitle>
            <CardDescription>
              Configure report parameters and data sources
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="jurisdiction">Jurisdiction</Label>
              <Select value={selectedJurisdiction} onValueChange={setSelectedJurisdiction}>
                <SelectTrigger id="jurisdiction">
                  <SelectValue placeholder="Select jurisdiction" />
                </SelectTrigger>
                <SelectContent>
                  {jurisdictions.map((j) => (
                    <SelectItem key={j.value} value={j.value}>
                      {j.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedJurisdiction && (
              <div className="space-y-2">
                <Label htmlFor="template">Report Template</Label>
                <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
                  <SelectTrigger id="template">
                    <SelectValue placeholder="Select template" />
                  </SelectTrigger>
                  <SelectContent>
                    {selectedJurisdictionData?.templates.map((template) => (
                      <SelectItem key={template} value={template}>
                        {template}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <Label>Date Range</Label>
              <div className="flex gap-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="flex-1 justify-start">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dateFrom ? format(dateFrom, 'PPP') : <span>From date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={dateFrom}
                      onSelect={setDateFrom}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="flex-1 justify-start">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dateTo ? format(dateTo, 'PPP') : <span>To date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={dateTo}
                      onSelect={setDateTo}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            <Separator />

            <div className="space-y-4">
              <Label>Include in Report</Label>
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="evidence" 
                    checked={includeEvidence}
                    onCheckedChange={(checked) => setIncludeEvidence(checked as boolean)}
                  />
                  <label htmlFor="evidence" className="cursor-pointer">
                    Evidence attachments (photos, PDFs)
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="signatures" 
                    checked={includeSignatures}
                    onCheckedChange={(checked) => setIncludeSignatures(checked as boolean)}
                  />
                  <label htmlFor="signatures" className="cursor-pointer">
                    Digital signatures
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="audit" 
                    checked={includeAuditLog}
                    onCheckedChange={(checked) => setIncludeAuditLog(checked as boolean)}
                  />
                  <label htmlFor="audit" className="cursor-pointer">
                    Audit log entries
                  </label>
                </div>
              </div>
            </div>

            <Separator />

            <div className="space-y-3">
              <Label>Export Format</Label>
              <div className="grid grid-cols-2 gap-3">
                <Button 
                  variant="outline" 
                  className="w-full gap-2"
                  onClick={handleGenerate}
                  disabled={!selectedJurisdiction || !selectedTemplate}
                >
                  <FileText className="w-4 h-4" />
                  PDF Report
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full gap-2"
                  onClick={handleGenerate}
                  disabled={!selectedJurisdiction || !selectedTemplate}
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  CSV Export
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Reports</CardTitle>
            <CardDescription>
              Previously generated compliance report packs
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                {
                  title: 'CTLS Monthly Report - September 2025',
                  jurisdiction: 'Canada-Cannabis',
                  generated: '2025-10-01',
                  format: 'PDF',
                  size: '4.2 MB',
                },
                {
                  title: 'PrimusGFS Audit Preparation',
                  jurisdiction: 'PrimusGFS',
                  generated: '2025-09-25',
                  format: 'PDF + CSV',
                  size: '8.7 MB',
                },
                {
                  title: 'California State Report - Q3',
                  jurisdiction: 'US-California',
                  generated: '2025-09-20',
                  format: 'CSV',
                  size: '1.3 MB',
                },
                {
                  title: 'Canada Produce Safety Audit',
                  jurisdiction: 'Canada-Produce',
                  generated: '2025-09-15',
                  format: 'PDF',
                  size: '6.1 MB',
                },
                {
                  title: 'CTLS Monthly Report - August 2025',
                  jurisdiction: 'Canada-Cannabis',
                  generated: '2025-09-01',
                  format: 'PDF',
                  size: '3.9 MB',
                },
              ].map((report, index) => (
                <Card key={index}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="line-clamp-2">{report.title}</CardTitle>
                      <CheckCircle className="w-5 h-5 text-green-600 shrink-0" />
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="outline">{report.jurisdiction}</Badge>
                      <Badge variant="outline">{report.format}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex items-center justify-between text-slate-600">
                      <span>Generated: {report.generated}</span>
                      <span>{report.size}</span>
                    </div>
                    <Button variant="outline" size="sm" className="w-full gap-2">
                      <Download className="w-3 h-3" />
                      Download
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <FileText className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" />
            <div>
              <p>Manual Report Generation</p>
              <p className="text-slate-600">
                Reports are manually generated on-demand and include all compliance data, evidence attachments, 
                and audit trails for the selected date range. Export formats include PDF for human-readable 
                reports and CSV for data analysis and system integration.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
