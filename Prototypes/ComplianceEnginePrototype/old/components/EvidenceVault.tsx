import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Upload, FileText, Image, FileSignature, FlaskConical, Search, Download, Eye } from 'lucide-react';

interface Evidence {
  id: string;
  type: 'photo' | 'signature' | 'lab-result';
  title: string;
  description: string;
  uploadDate: string;
  uploadedBy: string;
  jurisdiction: string;
  batchNumber?: string;
  fileSize: string;
  status: 'verified' | 'pending' | 'flagged';
}

export function EvidenceVault() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<'all' | 'photo' | 'signature' | 'lab-result'>('all');

  const evidenceItems: Evidence[] = [
    {
      id: 'EVD-2025-1247',
      type: 'lab-result',
      title: 'Cannabinoid Potency Test - Batch #2045',
      description: 'THC: 18.2%, CBD: 0.8% - Within compliance limits',
      uploadDate: '2025-10-15',
      uploadedBy: 'Sarah Chen',
      jurisdiction: 'Canada-Cannabis',
      batchNumber: 'BTH-2045',
      fileSize: '2.4 MB',
      status: 'verified',
    },
    {
      id: 'EVD-2025-1246',
      type: 'signature',
      title: 'HACCP Training Completion',
      description: 'Employee signature for SOP training completion',
      uploadDate: '2025-10-14',
      uploadedBy: 'Alex Kumar',
      jurisdiction: 'PrimusGFS',
      fileSize: '156 KB',
      status: 'verified',
    },
    {
      id: 'EVD-2025-1245',
      type: 'photo',
      title: 'Storage Temperature Verification',
      description: 'Cold room temperature reading at 4°C',
      uploadDate: '2025-10-14',
      uploadedBy: 'Mike Johnson',
      jurisdiction: 'Canada-Produce',
      fileSize: '3.8 MB',
      status: 'verified',
    },
    {
      id: 'EVD-2025-1244',
      type: 'lab-result',
      title: 'Microbial Testing - Batch #2044',
      description: 'E.coli, Salmonella: Not Detected',
      uploadDate: '2025-10-13',
      uploadedBy: 'Emma Rodriguez',
      jurisdiction: 'US-California',
      batchNumber: 'BTH-2044',
      fileSize: '1.9 MB',
      status: 'verified',
    },
    {
      id: 'EVD-2025-1243',
      type: 'signature',
      title: 'Calibration Verification - pH Meter',
      description: 'Technician signature for device calibration',
      uploadDate: '2025-10-13',
      uploadedBy: 'James Wilson',
      jurisdiction: 'Canada-Produce',
      fileSize: '142 KB',
      status: 'verified',
    },
    {
      id: 'EVD-2025-1242',
      type: 'photo',
      title: 'Sanitation Inspection Evidence',
      description: 'Post-cleaning facility inspection',
      uploadDate: '2025-10-12',
      uploadedBy: 'Sarah Chen',
      jurisdiction: 'PrimusGFS',
      fileSize: '4.2 MB',
      status: 'pending',
    },
  ];

  const filteredEvidence = evidenceItems.filter((item) => {
    const matchesSearch = searchTerm === '' || 
      item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.batchNumber?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = selectedType === 'all' || item.type === selectedType;
    
    return matchesSearch && matchesType;
  });

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'photo':
        return <Image className="w-4 h-4" />;
      case 'signature':
        return <FileSignature className="w-4 h-4" />;
      case 'lab-result':
        return <FlaskConical className="w-4 h-4" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  const getTypeBadge = (type: string) => {
    const variants: Record<string, string> = {
      photo: 'bg-blue-50 text-blue-700 border-blue-200',
      signature: 'bg-purple-50 text-purple-700 border-purple-200',
      'lab-result': 'bg-green-50 text-green-700 border-green-200',
    };

    return (
      <Badge variant="outline" className={variants[type]}>
        {getTypeIcon(type)}
        <span className="ml-1">{type.replace('-', ' ')}</span>
      </Badge>
    );
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, string> = {
      verified: 'bg-green-50 text-green-700 border-green-200',
      pending: 'bg-yellow-50 text-yellow-700 border-yellow-200',
      flagged: 'bg-red-50 text-red-700 border-red-200',
    };

    return (
      <Badge variant="outline" className={variants[status]}>
        {status}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Evidence Vault</CardTitle>
              <CardDescription>
                Secure storage for photos, signatures, and lab results with PDF extraction
              </CardDescription>
            </div>
            <Dialog>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Upload className="w-4 h-4" />
                  Upload Evidence
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Upload New Evidence</DialogTitle>
                  <DialogDescription>
                    Add photos, digital signatures, or lab sample results to the vault
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="evidence-type">Evidence Type</Label>
                    <Select>
                      <SelectTrigger id="evidence-type">
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="photo">Photo</SelectItem>
                        <SelectItem value="signature">Digital Signature</SelectItem>
                        <SelectItem value="lab-result">Lab Result (PDF)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="jurisdiction">Jurisdiction</Label>
                    <Select>
                      <SelectTrigger id="jurisdiction">
                        <SelectValue placeholder="Select jurisdiction" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="canada-cannabis">Canada - Cannabis</SelectItem>
                        <SelectItem value="canada-produce">Canada - Produce</SelectItem>
                        <SelectItem value="us-california">US - California</SelectItem>
                        <SelectItem value="primusgfs">PrimusGFS</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="title">Title</Label>
                    <Input id="title" placeholder="Evidence title" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Input id="description" placeholder="Brief description" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="batch">Batch Number (Optional)</Label>
                    <Input id="batch" placeholder="BTH-XXXX" />
                  </div>
                  <div className="border-2 border-dashed border-slate-300 rounded-lg p-8 text-center">
                    <Upload className="w-8 h-8 mx-auto mb-2 text-slate-400" />
                    <p className="text-slate-600">Drop file here or click to upload</p>
                    <p className="text-slate-500">Supports JPG, PNG, PDF (max 10MB)</p>
                  </div>
                  <Button className="w-full">Upload Evidence</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  placeholder="Search evidence by title, description, or batch number..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Tabs value={selectedType} onValueChange={(v) => setSelectedType(v as any)} className="w-auto">
                <TabsList>
                  <TabsTrigger value="all">All</TabsTrigger>
                  <TabsTrigger value="photo">Photos</TabsTrigger>
                  <TabsTrigger value="signature">Signatures</TabsTrigger>
                  <TabsTrigger value="lab-result">Lab Results</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredEvidence.map((evidence) => (
                <Card key={evidence.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="line-clamp-2">{evidence.title}</CardTitle>
                      {getStatusBadge(evidence.status)}
                    </div>
                    <div className="flex items-center gap-2">
                      {getTypeBadge(evidence.type)}
                      <Badge variant="outline">{evidence.jurisdiction}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-slate-600 line-clamp-2">{evidence.description}</p>
                    {evidence.batchNumber && (
                      <p className="text-slate-600">Batch: {evidence.batchNumber}</p>
                    )}
                    <div className="flex items-center justify-between text-slate-500">
                      <span>{evidence.uploadDate}</span>
                      <span>{evidence.fileSize}</span>
                    </div>
                    <p className="text-slate-600">By: {evidence.uploadedBy}</p>
                    <div className="flex gap-2 pt-2">
                      <Button variant="outline" size="sm" className="flex-1 gap-1">
                        <Eye className="w-3 h-3" />
                        View
                      </Button>
                      <Button variant="outline" size="sm" className="flex-1 gap-1">
                        <Download className="w-3 h-3" />
                        Download
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {filteredEvidence.length === 0 && (
              <div className="text-center py-12">
                <FileText className="w-12 h-12 mx-auto mb-4 text-slate-300" />
                <p>No evidence found matching your criteria</p>
                <p className="text-slate-600">Try adjusting your search or filters</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
