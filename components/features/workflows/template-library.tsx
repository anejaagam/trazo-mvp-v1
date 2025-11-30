'use client';

/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SOPTemplate, TemplateStatus, SOPStep } from '@/types/workflow';
import { Clock, FileText, Search, Plus, Edit, Copy, GitBranch, AlertTriangle, CheckCircle2 } from 'lucide-react';

interface TemplateLibraryProps {
  templates: SOPTemplate[];
  canCreate?: boolean;
  canEdit?: boolean;
  canView?: boolean;
  onEditTemplate?: (templateId: string) => void;
  onCreateTemplate?: () => void;
  onCopyTemplate?: (templateId: string) => void;
}

export function TemplateLibrary({ 
  templates,
  canCreate = false,
  canEdit = false,
  canView = true,
  onEditTemplate,
  onCreateTemplate,
  onCopyTemplate
}: TemplateLibraryProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  // Extract unique categories from templates
  const categories = useMemo(() => {
    const cats = new Set(templates.map(t => t.category));
    return ['all', ...Array.from(cats)];
  }, [templates]);

  // Filter templates
  const filteredTemplates = useMemo(() => {
    return templates.filter(template => {
      const matchesSearch = 
        template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (template.description?.toLowerCase() || '').includes(searchQuery.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' || template.status === statusFilter;
      const matchesCategory = categoryFilter === 'all' || template.category === categoryFilter;
      
      return matchesSearch && matchesStatus && matchesCategory;
    });
  }, [templates, searchQuery, statusFilter, categoryFilter]);

  // Get status badge variant
  const getStatusVariant = (status: TemplateStatus) => {
    switch (status) {
      case 'published':
        return 'default';
      case 'draft':
        return 'secondary';
      case 'archived':
        return 'outline';
      default:
        return 'secondary';
    }
  };

  if (!canView) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-slate-600">You don&apos;t have permission to view workflow templates</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">SOP Template Library</h2>
          <p className="text-muted-foreground">
            Browse and manage standard operating procedures
          </p>
        </div>
        {canCreate && onCreateTemplate && (
          <Button onClick={onCreateTemplate}>
            <Plus className="w-4 h-4 mr-2" />
            Create Template
          </Button>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search templates..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="All Statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="published">Published</SelectItem>
            <SelectItem value="archived">Archived</SelectItem>
          </SelectContent>
        </Select>

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

      {/* Results count */}
      <div className="text-sm text-muted-foreground">
        Showing {filteredTemplates.length} of {templates.length} templates
      </div>

      {/* Templates Grid */}
      {filteredTemplates.length === 0 ? (
        <Card className="p-12 text-center">
          <FileText className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">No templates found</h3>
          <p className="text-muted-foreground mb-4">
            {searchQuery || statusFilter !== 'all' || categoryFilter !== 'all'
              ? 'Try adjusting your filters'
              : 'Get started by creating your first template'}
          </p>
          {canCreate && onCreateTemplate && (
            <Button onClick={onCreateTemplate}>
              <Plus className="w-4 h-4 mr-2" />
              Create Template
            </Button>
          )}
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTemplates.map(template => {
            type StepLike = SOPStep & { is_conditional?: boolean; evidence_required?: boolean };
            const steps = (template.steps || []) as StepLike[];
            const hasConditionalSteps = steps.some((step) => Boolean(step.isConditional ?? step.is_conditional));
            const evidenceSteps = steps.filter((step) => Boolean(step.evidenceRequired ?? step.evidence_required)).length;
            const approvalSteps = steps.filter((step) => step.requiresApproval).length;
            const totalSteps = steps.length;

            return (
              <Card key={template.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <CardTitle className="text-lg truncate">
                          {template.name}
                        </CardTitle>
                        {template.version && (
                          <Badge variant="outline" className="shrink-0">
                            v{template.version}
                          </Badge>
                        )}
                      </div>
                      <CardDescription className="line-clamp-1">
                        {template.category}
                      </CardDescription>
                    </div>
                    <Badge variant={getStatusVariant(template.status)} className="shrink-0">
                      {template.status}
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* Description */}
                  {template.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {template.description}
                    </p>
                  )}

                  {/* Metadata badges */}
                  <div className="flex flex-wrap gap-2">
                    {hasConditionalSteps && (
                      <Badge variant="secondary" className="text-xs">
                        <GitBranch className="w-3 h-3 mr-1" />
                        Conditional
                      </Badge>
                    )}
                    {template.is_exception_scenario && (
                      <Badge variant="destructive" className="text-xs">
                        <AlertTriangle className="w-3 h-3 mr-1" />
                        Exception
                      </Badge>
                    )}
                    {template.requires_dual_signoff && (
                      <Badge variant="default" className="text-xs">
                        <CheckCircle2 className="w-3 h-3 mr-1" />
                        Dual Sign-off
                      </Badge>
                    )}
                    {approvalSteps > 0 && (
                      <Badge variant="outline" className="text-xs">
                        <CheckCircle2 className="w-3 h-3 mr-1" />
                        {approvalSteps} approval
                      </Badge>
                    )}
                  </div>

                  {/* Stats */}
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <FileText className="w-4 h-4" />
                      <span>{totalSteps} steps</span>
                    </div>
                    {evidenceSteps > 0 && (
                      <div className="flex items-center gap-1">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>{evidenceSteps} evidence</span>
                      </div>
                    )}
                    {template.estimated_duration_minutes && (
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        <span>{template.estimated_duration_minutes}m</span>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-2">
                    {canEdit && onEditTemplate && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 border-green-200 text-green-700 hover:bg-green-50 hover:text-green-800"
                        onClick={() => onEditTemplate(template.id)}
                      >
                        <Edit className="w-4 h-4 mr-1" />
                        Edit
                      </Button>
                    )}
                    {canCreate && onCopyTemplate && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 text-neutral-600 hover:text-neutral-700 hover:bg-neutral-50"
                        onClick={() => onCopyTemplate(template.id)}
                      >
                        <Copy className="w-4 h-4 mr-1" />
                        Copy
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
