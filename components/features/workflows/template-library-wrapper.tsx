'use client';

import { useRouter } from 'next/navigation';
import { TemplateLibrary } from './template-library';
import { SOPTemplate } from '@/types/workflow';

interface TemplateLibraryWrapperProps {
  templates: SOPTemplate[];
  canCreate?: boolean;
  canEdit?: boolean;
  canView?: boolean;
}

export function TemplateLibraryWrapper({
  templates,
  canCreate = false,
  canEdit = false,
  canView = true,
}: TemplateLibraryWrapperProps) {
  const router = useRouter();

  const handleEditTemplate = (templateId: string) => {
    router.push(`/dashboard/workflows/templates/${templateId}`);
  };

  const handleCreateTemplate = () => {
    router.push('/dashboard/workflows/templates/new');
  };

  const handleCopyTemplate = (templateId: string) => {
    router.push(`/dashboard/workflows/templates/new?copy=${templateId}`);
  };

  return (
    <TemplateLibrary
      templates={templates}
      canCreate={canCreate}
      canEdit={canEdit}
      canView={canView}
      onEditTemplate={handleEditTemplate}
      onCreateTemplate={handleCreateTemplate}
      onCopyTemplate={handleCopyTemplate}
    />
  );
}
