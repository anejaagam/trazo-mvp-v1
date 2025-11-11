import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Upload, FileText, Search, Download, Eye, Lock, Shield, Calendar } from 'lucide-react';
import type { ProduceEvidence, ProduceDocumentType, CommodityType, RetentionPolicy } from '../types';

export function EvidenceVault() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<'all' | ProduceDocumentType>('all');
  const [selectedCommodity, setSelectedCommodity] = useState<'all' | CommodityType>('all');

  const evidenceItems: ProduceEvidence[] = [
    {
      evidence_id: 'EV-2024-1247',
      doc_type: 'Test Result',
      title: 'Water Quality Test - Irrigation System A',
      description: 'Monthly water testing results - All parameters within acceptable limits',
      commodity: 'Leafy Greens',
      uploaded_at: '2024-11-05',
      uploaded_by: 'Sarah Chen',
      owner_id: 'QA Department',
      file_size: '1.2 MB',
      file_format: 'PDF',
      retention_policy: '7-years',
      retention_end: '2031-11-05',
      linked_reports: ['PRD-2024-11-001'],
      tags: ['water-testing', 'irrigation', 'monthly'],
      encrypted: true,
      access_log: [
        {
          user_id: 'USR-001',
          user_name: 'Sarah Chen',
          department: 'Quality Assurance',
          action: 'uploaded',
          timestamp: '2024-11-05T09:30:00Z',
          ip_address: '192.168.1.100',
        },
      ],
      status: 'active',
    },
    {
      evidence_id: 'EV-2024-1246',
      doc_type: 'Staff Training Log',
      title: 'Food Safety Training Certification - Oct 2024',
      description: 'Staff training completion records for HACCP and GMP procedures',
      uploaded_at: '2024-11-03',
      uploaded_by: 'Alex Kumar',
      owner_id: 'FSMS Department',
      file_size: '3.5 MB',
      file_format: 'PDF',
      retention_policy: '5-years',
      retention_end: '2029-11-03',
      linked_reports: ['PRD-2024-08-PGS'],
      tags: ['training', 'haccp', 'gmp', 'staff-certification'],
      encrypted: true,
      access_log: [
        {
          user_id: 'USR-002',
          user_name: 'Alex Kumar',
          department: 'Food Safety',
          action: 'uploaded',
          timestamp: '2024-11-03T14:20:00Z',
          ip_address: '192.168.1.101',
        },
      ],
      status: 'active',
    },
    {
      evidence_id: 'EV-2024-1245',
      doc_type: 'Corrective Action',
      title: 'CA-2024-10: Pest Control Enhancement',
      description: 'Corrective action for pest monitoring gap identified in internal audit',
      commodity: 'Tomatoes',
      uploaded_at: '2024-11-01',
      uploaded_by: 'Mike Johnson',
      owner_id: 'Production Department',
      file_size: '856 KB',
      file_format: 'PDF',
      retention_policy: '7-years',
      retention_end: '2031-11-01',
      linked_reports: ['PRD-2024-10-001'],
      tags: ['corrective-action', 'pest-control', 'gap'],
      encrypted: true,
      access_log: [
        {
          user_id: 'USR-003',
          user_name: 'Mike Johnson',
          department: 'Production',
          action: 'uploaded',
          timestamp: '2024-11-01T11:15:00Z',
          ip_address: '192.168.1.102',
        },
      ],
      status: 'active',
    },
    {
      evidence_id: 'EV-2024-1244',
      doc_type: 'Traceability Log',
      title: 'Lot Traceability - LG-2024-Oct',
      description: 'Complete traceability records for leafy greens production October 2024',
      commodity: 'Leafy Greens',
      uploaded_at: '2024-10-31',
      uploaded_by: 'Jennifer Lee',
      owner_id: 'Compliance Department',
      file_size: '4.2 MB',
      file_format: 'Excel',
      retention_policy: '5-years',
      retention_end: '2029-10-31',
      linked_reports: ['PRD-2024-10-001', 'PRD-2024-11-001'],
      tags: ['traceability', 'lot-tracking', 'cfia'],
      encrypted: true,
      access_log: [
        {
          user_id: 'USR-004',
          user_name: 'Jennifer Lee',
          department: 'Compliance',
          action: 'uploaded',
          timestamp: '2024-10-31T16:45:00Z',
          ip_address: '192.168.1.103',
        },
      ],
      status: 'active',
    },
    {
      evidence_id: 'EV-2024-1243',
      doc_type: 'Sampling Result',
      title: 'Microbial Sampling - Processing Line',
      description: 'Environmental swab test results for food contact surfaces',
      commodity: 'Mixed Vegetables',
      uploaded_at: '2024-10-28',
      uploaded_by: 'Sarah Chen',
      owner_id: 'QA Department',
      file_size: '1.8 MB',
      file_format: 'PDF',
      retention_policy: '7-years',
      retention_end: '2031-10-28',
      linked_reports: ['PRD-2024-08-PGS'],
      tags: ['sampling', 'microbial', 'environmental-monitoring'],
      encrypted: true,
      access_log: [
        {
          user_id: 'USR-001',
          user_name: 'Sarah Chen',
          department: 'Quality Assurance',
          action: 'uploaded',
          timestamp: '2024-10-28T10:30:00Z',
          ip_address: '192.168.1.100',
        },
      ],
      status: 'active',
    },
    {
      evidence_id: 'EV-2024-1242',
      doc_type: 'Food Safety Plan',
      title: 'HACCP Plan - Leafy Greens Processing',
      description: 'Updated HACCP plan including critical control points and monitoring procedures',
      commodity: 'Leafy Greens',
      uploaded_at: '2024-10-20',
      uploaded_by: 'Alex Kumar',
      owner_id: 'FSMS Department',
      file_size: '6.3 MB',
      file_format: 'PDF',
      retention_policy: 'permanent',
      retention_end: 'N/A',
      linked_reports: ['PRD-2024-08-PGS'],
      tags: ['haccp', 'food-safety-plan', 'fsms'],
      encrypted: true,
      access_log: [
        {
          user_id: 'USR-002',
          user_name: 'Alex Kumar',
          department: 'Food Safety',
          action: 'uploaded',
          timestamp: '2024-10-20T13:00:00Z',
          ip_address: '192.168.1.101',
        },
      ],
      status: 'active',
    },
  ];

  const documentTypes: ProduceDocumentType[] = [
    'Test Result',
    'SOP',
    'Staff Training Log',
    'Corrective Action',
    'Traceability Log',
    'Sampling Result',
    'Food Safety Plan',
    'HACCP Documentation',
    'Supplier Approval',
    'Audit Certificate',
    'Water Test',
    'Pest Control Log',
    'Sanitation Record',
  ];

  const commodities: CommodityType[] = [
    'Leafy Greens',
    'Tomatoes',
    'Berries',
    'Root Vegetables',
    'Stone Fruit',
    'Citrus',
    'Herbs',
    'Mixed Vegetables',
  ];

  const filteredEvidence = evidenceItems.filter((item) => {
    const matchesSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesType = selectedType === 'all' || item.doc_type === selectedType;
    const matchesCommodity = selectedCommodity === 'all' || item.commodity === selectedCommodity;
    return matchesSearch && matchesType && matchesCommodity;
  });

  const getStatusColor = (status: ProduceEvidence['status']) => {
    const colors = {
      'active': 'bg-green-100 text-green-800',
      'archived': 'bg-gray-100 text-gray-800',
      'pending-deletion': 'bg-red-100 text-red-800',
    };
    return colors[status];
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2>Evidence Vault</h2>
          <p className="text-slate-600">
            Secure repository for food safety evidence and compliance documentation
          </p>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button>
              <Upload className="w-4 h-4 mr-2" />
              Upload Evidence
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Upload Evidence Document</DialogTitle>
              <DialogDescription>
                Add new food safety evidence to the secure vault
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="docType">Document Type</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select document type" />
                  </SelectTrigger>
                  <SelectContent>
                    {documentTypes.map((type) => (
                      <SelectItem key={type} value={type}>{type}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="commodity">Commodity (Optional)</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select commodity" />
                  </SelectTrigger>
                  <SelectContent>
                    {commodities.map((commodity) => (
                      <SelectItem key={commodity} value={commodity}>{commodity}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="title">Title</Label>
                <Input id="title" placeholder="Enter document title" />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Input id="description" placeholder="Enter description" />
              </div>
              <div>
                <Label htmlFor="retention">Retention Policy</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select retention period" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1-year">1 Year</SelectItem>
                    <SelectItem value="3-years">3 Years</SelectItem>
                    <SelectItem value="5-years">5 Years (CFIA Standard)</SelectItem>
                    <SelectItem value="7-years">7 Years (PrimusGFS Standard)</SelectItem>
                    <SelectItem value="permanent">Permanent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="border-2 border-dashed border-slate-300 rounded-lg p-8 text-center">
                <Upload className="w-8 h-8 mx-auto mb-2 text-slate-400" />
                <p className="text-slate-600">Click to upload or drag and drop</p>
                <p className="text-slate-500 text-sm">PDF, Excel, Word, Images (max 50MB)</p>
              </div>
              <Button className="w-full">Upload Document</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Storage Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-slate-600">Total Documents</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl">2,347</div>
            <p className="text-green-600 mt-1">+124 this month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-slate-600">Storage Used</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl">5.8 GB</div>
            <p className="text-slate-600 mt-1">of 100 GB</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-slate-600">Encrypted</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl flex items-center gap-2">
              <Shield className="w-8 h-8 text-green-600" />
              100%
            </div>
            <p className="text-slate-600 mt-1">AES-256 encryption</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-slate-600">Retention Compliance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl flex items-center gap-2">
              <Calendar className="w-8 h-8 text-green-600" />
              100%
            </div>
            <p className="text-slate-600 mt-1">All policies met</p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Search & Filter</CardTitle>
          <CardDescription>Find evidence documents by type, commodity, or keyword</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Search by title, description, or tags..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={selectedType} onValueChange={(v) => setSelectedType(v as any)}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Document Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {documentTypes.map((type) => (
                  <SelectItem key={type} value={type}>{type}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedCommodity} onValueChange={(v) => setSelectedCommodity(v as any)}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Commodity" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Commodities</SelectItem>
                {commodities.map((commodity) => (
                  <SelectItem key={commodity} value={commodity}>{commodity}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Evidence Table */}
      <Card>
        <CardHeader>
          <CardTitle>Evidence Documents ({filteredEvidence.length})</CardTitle>
          <CardDescription>
            Encrypted storage with role-based access control
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Document ID</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Commodity</TableHead>
                <TableHead>Uploaded</TableHead>
                <TableHead>Owner</TableHead>
                <TableHead>Retention</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredEvidence.map((item) => (
                <TableRow key={item.evidence_id}>
                  <TableCell>
                    <code className="text-xs bg-slate-100 px-2 py-1 rounded">
                      {item.evidence_id}
                    </code>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{item.doc_type}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {item.encrypted && <Lock className="w-3 h-3 text-green-600" />}
                      <div>
                        <div>{item.title}</div>
                        <p className="text-slate-500 text-sm">{item.file_size} • {item.file_format}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{item.commodity || '-'}</TableCell>
                  <TableCell>
                    <div>
                      <div>{new Date(item.uploaded_at).toLocaleDateString()}</div>
                      <p className="text-slate-500 text-sm">by {item.uploaded_by}</p>
                    </div>
                  </TableCell>
                  <TableCell>{item.owner_id}</TableCell>
                  <TableCell>
                    <div>
                      <Badge variant="outline" className="text-xs">
                        {item.retention_policy}
                      </Badge>
                      {item.retention_end !== 'N/A' && (
                        <p className="text-slate-500 text-xs mt-1">
                          Until {new Date(item.retention_end).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(item.status)}>
                      {item.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button size="sm" variant="outline">
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button size="sm" variant="outline">
                        <Download className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Access Control */}
      <Card>
        <CardHeader>
          <CardTitle>Access Control & Permissions</CardTitle>
          <CardDescription>
            Role-based access by department with full audit logging
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-slate-50 rounded-lg">
              <h4 className="mb-2">Quality Assurance</h4>
              <p className="text-slate-600 text-sm mb-2">Full access to test results and sampling data</p>
              <div className="space-y-1 text-sm">
                <div className="flex items-center justify-between">
                  <span>View</span>
                  <Badge variant="outline" className="bg-green-50 text-green-700">Allowed</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span>Upload</span>
                  <Badge variant="outline" className="bg-green-50 text-green-700">Allowed</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span>Delete</span>
                  <Badge variant="outline" className="bg-red-50 text-red-700">Restricted</Badge>
                </div>
              </div>
            </div>
            <div className="p-4 bg-slate-50 rounded-lg">
              <h4 className="mb-2">FSMS Coordinator</h4>
              <p className="text-slate-600 text-sm mb-2">Manage food safety plans and corrective actions</p>
              <div className="space-y-1 text-sm">
                <div className="flex items-center justify-between">
                  <span>View</span>
                  <Badge variant="outline" className="bg-green-50 text-green-700">Allowed</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span>Upload</span>
                  <Badge variant="outline" className="bg-green-50 text-green-700">Allowed</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span>Export</span>
                  <Badge variant="outline" className="bg-green-50 text-green-700">Allowed</Badge>
                </div>
              </div>
            </div>
            <div className="p-4 bg-slate-50 rounded-lg">
              <h4 className="mb-2">Management</h4>
              <p className="text-slate-600 text-sm mb-2">View-only access to all documents</p>
              <div className="space-y-1 text-sm">
                <div className="flex items-center justify-between">
                  <span>View</span>
                  <Badge variant="outline" className="bg-green-50 text-green-700">Allowed</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span>Upload</span>
                  <Badge variant="outline" className="bg-yellow-50 text-yellow-700">Limited</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span>Export</span>
                  <Badge variant="outline" className="bg-green-50 text-green-700">Allowed</Badge>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
