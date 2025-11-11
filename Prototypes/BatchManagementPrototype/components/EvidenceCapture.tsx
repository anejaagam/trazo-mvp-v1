import { useState } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Upload, Image as ImageIcon, FileText } from 'lucide-react';

interface EvidenceCaptureProps {
  batchId: string;
  onAddEvidence: (evidence: { type: string; description: string; files: File[] }) => void;
}

export function EvidenceCapture({ batchId, onAddEvidence }: EvidenceCaptureProps) {
  const [evidenceType, setEvidenceType] = useState('');
  const [description, setDescription] = useState('');
  const [files, setFiles] = useState<File[]>([]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(Array.from(e.target.files));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (evidenceType && description) {
      onAddEvidence({ type: evidenceType, description, files });
      // Reset form
      setEvidenceType('');
      setDescription('');
      setFiles([]);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h3 className="text-gray-900 mb-6">Add Evidence & Documentation</h3>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="evidence-type">Evidence Type</Label>
            <Select value={evidenceType} onValueChange={setEvidenceType}>
              <SelectTrigger id="evidence-type" className="mt-2">
                <SelectValue placeholder="Select evidence type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="qa_check">QA Check</SelectItem>
                <SelectItem value="pest_inspection">Pest Inspection</SelectItem>
                <SelectItem value="nutrient_analysis">Nutrient Analysis</SelectItem>
                <SelectItem value="visual_documentation">Visual Documentation</SelectItem>
                <SelectItem value="compliance">Compliance Documentation</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Describe the evidence or documentation..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              className="mt-2"
              required
            />
          </div>

          <div>
            <Label htmlFor="files">Upload Files (Photos, Documents)</Label>
            <div className="mt-2">
              <Input
                id="files"
                type="file"
                multiple
                accept="image/*,.pdf,.doc,.docx"
                onChange={handleFileChange}
              />
              {files.length > 0 && (
                <div className="mt-2 text-gray-600">
                  {files.length} file(s) selected
                </div>
              )}
            </div>
          </div>

          <Button type="submit" className="w-full">
            <Upload className="w-4 h-4 mr-2" />
            Add Evidence
          </Button>
        </form>
      </Card>

      {/* Recent Evidence */}
      <Card className="p-6">
        <h3 className="text-gray-900 mb-4">Recent Documentation</h3>
        
        <div className="space-y-4">
          {/* Sample evidence items */}
          <div className="flex items-start gap-4 p-4 border rounded-lg">
            <div className="bg-purple-100 p-3 rounded-lg">
              <ImageIcon className="w-6 h-6 text-purple-600" />
            </div>
            <div className="flex-1">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-gray-900">Weekly QA Inspection</p>
                  <p className="text-gray-600">Healthy growth, no pests detected</p>
                </div>
                <p className="text-gray-500">Mar 15, 2025</p>
              </div>
              <div className="mt-2">
                <img
                  src="https://images.unsplash.com/photo-1464226184884-fa280b87c399?w=400"
                  alt="QA evidence"
                  className="w-32 h-32 object-cover rounded-lg"
                />
              </div>
            </div>
          </div>

          <div className="flex items-start gap-4 p-4 border rounded-lg">
            <div className="bg-blue-100 p-3 rounded-lg">
              <FileText className="w-6 h-6 text-blue-600" />
            </div>
            <div className="flex-1">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-gray-900">Nutrient Analysis Report</p>
                  <p className="text-gray-600">Optimal nutrient levels confirmed</p>
                </div>
                <p className="text-gray-500">Mar 10, 2025</p>
              </div>
            </div>
          </div>

          <div className="flex items-start gap-4 p-4 border rounded-lg">
            <div className="bg-green-100 p-3 rounded-lg">
              <ImageIcon className="w-6 h-6 text-green-600" />
            </div>
            <div className="flex-1">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-gray-900">Compliance Inspection</p>
                  <p className="text-gray-600">Passed regulatory inspection</p>
                </div>
                <p className="text-gray-500">Mar 5, 2025</p>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
