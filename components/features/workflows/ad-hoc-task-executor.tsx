'use client';

import { useState } from 'react';
import { Task, TaskEvidence } from '@/types/workflow';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { CheckCircle2, X, Save } from 'lucide-react';

interface AdHocTaskExecutorProps {
  task: Task;
  onClose: () => void;
  onComplete: (evidence: TaskEvidence[]) => Promise<void>;
  onSaveDraft: (evidence: TaskEvidence[], currentStepIndex: number) => Promise<void>;
}

export function AdHocTaskExecutor({ 
  task, 
  onClose, 
  onComplete, 
  onSaveDraft 
}: AdHocTaskExecutorProps) {
  const [notes, setNotes] = useState('');
  const [isCompleting, setIsCompleting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleComplete = async () => {
    setIsCompleting(true);
    try {
      const evidence: TaskEvidence[] = notes ? [{
        stepId: 'ad-hoc-notes',
        type: 'text',
        value: notes,
        timestamp: new Date().toISOString(),
      }] : [];
      
      await onComplete(evidence);
    } catch (error) {
      console.error('Error completing task:', error);
      alert(error instanceof Error ? error.message : 'Failed to complete task');
    } finally {
      setIsCompleting(false);
    }
  };

  const handleSaveDraft = async () => {
    setIsSaving(true);
    try {
      const evidence: TaskEvidence[] = notes ? [{
        stepId: 'ad-hoc-notes',
        type: 'text',
        value: notes,
        timestamp: new Date().toISOString(),
      }] : [];
      
      await onSaveDraft(evidence, 0);
    } catch (error) {
      console.error('Error saving draft:', error);
      alert(error instanceof Error ? error.message : 'Failed to save draft');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">{task.title}</h1>
            {task.description && (
              <p className="text-slate-600 mt-1">{task.description}</p>
            )}
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Main Content */}
        <Card className="p-6">
          <div className="space-y-6">
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-medium text-slate-900">Task Details</h2>
                <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                  Ad-hoc Task
                </span>
              </div>
              
              {task.description && (
                <div className="mb-6 p-4 bg-slate-50 rounded-lg">
                  <p className="text-slate-700">{task.description}</p>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Task Notes (Optional)</Label>
              <Textarea
                id="notes"
                placeholder="Add any notes or details about completing this task..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={6}
                className="resize-none"
              />
              <p className="text-sm text-slate-500">
                Document any relevant information about this task
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-between pt-4 border-t">
              <Button
                variant="outline"
                onClick={handleSaveDraft}
                disabled={isSaving || isCompleting}
                className="text-emerald-600 border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700"
              >
                <Save className="h-4 w-4 mr-2" />
                {isSaving ? 'Saving...' : 'Save Draft'}
              </Button>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={onClose}
                  disabled={isSaving || isCompleting}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleComplete}
                  disabled={isSaving || isCompleting}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  {isCompleting ? 'Completing...' : 'Complete Task'}
                </Button>
              </div>
            </div>
          </div>
        </Card>

        {/* Info Box */}
        <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>Ad-hoc Task:</strong> This is a manually created task without a standard operating procedure. 
            Add any relevant notes above and click "Complete Task" when finished.
          </p>
        </div>
      </div>
    </div>
  );
}
