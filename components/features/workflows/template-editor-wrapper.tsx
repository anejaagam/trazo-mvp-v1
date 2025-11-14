'use client';

import { useRouter } from 'next/navigation';
import { TemplateEditor } from './template-editor';
import { SOPTemplate } from '@/types/workflow';
import { createTemplateAction, updateTemplateAction } from '@/app/actions/workflows';

interface TemplateEditorWrapperProps {
  template?: SOPTemplate | null;
  isNew?: boolean;
  isCopy?: boolean;
  canPublish?: boolean;
}

export function TemplateEditorWrapper({
  template,
  isNew = false,
  isCopy = false,
  canPublish = false,
}: TemplateEditorWrapperProps) {
  const router = useRouter();

  const handleSave = async (templateData: Partial<SOPTemplate>) => {
    try {
      let result;
      
      if (isNew || isCopy) {
        result = await createTemplateAction(templateData);
      } else if (template?.id) {
        result = await updateTemplateAction(template.id, templateData);
      }

      if (result?.error) {
        throw new Error(result.error);
      }

      // Navigate back to templates list
      router.push('/dashboard/workflows/templates');
      router.refresh();
    } catch (error) {
      console.error('Error saving template:', error);
      throw error;
    }
  };

  const handleCancel = () => {
    router.back();
  };

  return (
    <TemplateEditor
      template={template}
      isNew={isNew}
      isCopy={isCopy}
      canPublish={canPublish}
      onSave={handleSave}
      onCancel={handleCancel}
    />
  );
}
