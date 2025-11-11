import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { mockTemplates } from '../../lib/mockData';
import { Clock, FileText, Search, Plus, Edit, Copy } from 'lucide-react';

interface TemplateLibraryProps {
  onEditTemplate: (templateId: string) => void;
}

export function TemplateLibrary({ onEditTemplate }: TemplateLibraryProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  const categories = useMemo(() => {
    const cats = new Set(mockTemplates.map(t => t.category));
    return ['all', ...Array.from(cats)];
  }, []);

  const filteredTemplates = useMemo(() => {
    return mockTemplates.filter(template => {
      const matchesSearch = template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           template.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = categoryFilter === 'all' || template.category === categoryFilter;
      
      return matchesSearch && matchesCategory;
    });
  }, [searchQuery, categoryFilter]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-slate-900">SOP Template Library</h2>
          <p className="text-slate-600">Browse and manage standard operating procedures</p>
        </div>
        <Button onClick={() => onEditTemplate('new')}>
          <Plus className="w-4 h-4 mr-2" />
          Create Template
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Search templates..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-full sm:w-64">
            <SelectValue placeholder="All Categories" />
          </SelectTrigger>
          <SelectContent>
            {categories.map(cat => (
              <SelectItem key={cat} value={cat}>
                {cat === 'all' ? 'All Categories' : cat}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredTemplates.map(template => {
          const hasConditionalSteps = template.steps.some(s => s.isConditional);
          const evidenceSteps = template.steps.filter(s => s.evidenceRequired).length;

          return (
            <Card key={template.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <CardTitle className="text-slate-900">{template.name}</CardTitle>
                      <Badge variant="outline">v{template.version}</Badge>
                    </div>
                    <CardDescription>{template.category}</CardDescription>
                  </div>
                  <div className="flex flex-col gap-1">
                    {hasConditionalSteps && (
                      <Badge variant="secondary">Conditional</Badge>
                    )}
                    {template.isExceptionScenario && (
                      <Badge variant="destructive">Exception</Badge>
                    )}
                    {template.requiresDualSignoff && (
                      <Badge variant="default">Dual Sign-off</Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-slate-600">{template.description}</p>

                <div className="grid grid-cols-2 gap-3">
                  <div className="flex items-center gap-2 text-slate-600">
                    <FileText className="w-4 h-4" />
                    <span>{template.steps.length} steps</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-600">
                    <Clock className="w-4 h-4" />
                    <span>{template.estimatedDuration} min</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-slate-600">
                    <span>{evidenceSteps} evidence points</span>
                    {template.slaHours && (
                      <Badge variant="outline">SLA: {template.slaHours}h</Badge>
                    )}
                  </div>
                  
                  <div className="text-slate-500 border-t pt-2">
                    <div>Updated: {template.updatedAt.toLocaleDateString()}</div>
                    <div>by {template.updatedBy}</div>
                    {template.versionHistory.length > 1 && (
                      <div className="text-amber-600">
                        {template.versionHistory.length} versions
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    className="flex-1"
                    onClick={() => onEditTemplate(template.id)}
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Edit
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => onEditTemplate(`copy-${template.id}`)}
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filteredTemplates.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <FileText className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-600">No templates found matching your criteria</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
