'use client'

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, Link2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { linkTemplateAction } from '@/app/actions/batch-tasks'
import { toast } from 'sonner'

interface SOPTemplate {
  id: string
  name: string
  category?: string
  description?: string
  estimated_duration_minutes?: number
}

interface LinkTemplateDialogProps {
  batchId: string
  currentStage?: string
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export function LinkTemplateDialog({
  batchId,
  currentStage,
  isOpen,
  onClose,
  onSuccess,
}: LinkTemplateDialogProps) {
  const [templates, setTemplates] = useState<SOPTemplate[]>([])
  const [selectedTemplateId, setSelectedTemplateId] = useState('')
  const [linkToStage, setLinkToStage] = useState(false)
  const [targetStage, setTargetStage] = useState(currentStage || '')
  const [autoCreate, setAutoCreate] = useState(false)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen) {
      loadTemplates()
    }
  }, [isOpen])

  const loadTemplates = async () => {
    setLoading(true)
    setError(null)
    
    const supabase = createClient()
    const { data, error } = await supabase
      .from('sop_templates')
      .select('id, name, category, description, estimated_duration_minutes')
      .eq('is_active', true)
      .eq('status', 'published')
      .order('name')

    if (error) {
      console.error('Error loading templates:', error)
      setError('Failed to load SOP templates')
    } else {
      setTemplates(data || [])
    }
    
    setLoading(false)
  }

  const handleSubmit = async () => {
    if (!selectedTemplateId) {
      toast.error('Please select an SOP template')
      return
    }

    setSubmitting(true)
    setError(null)

    try {
      const result = await linkTemplateAction(batchId, selectedTemplateId, {
        stage: linkToStage ? targetStage : undefined,
        autoCreate,
      })

      if (result.error) {
        setError(result.error)
        toast.error(result.error)
      } else {
        toast.success('SOP template linked successfully')
        onSuccess()
        onClose()
      }
    } catch (err) {
      console.error('Error linking template:', err)
      setError('Failed to link template')
      toast.error('Failed to link template')
    } finally {
      setSubmitting(false)
    }
  }

  const selectedTemplate = templates.find(t => t.id === selectedTemplateId)

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Link2 className="h-5 w-5" />
            Link SOP Template to Batch
          </DialogTitle>
          <DialogDescription>
            Link a standard operating procedure template to automatically generate tasks for this batch.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <>
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="template">SOP Template *</Label>
                <Select 
                  value={selectedTemplateId} 
                  onValueChange={setSelectedTemplateId}
                  disabled={submitting}
                >
                  <SelectTrigger id="template">
                    <SelectValue placeholder="Select an SOP template" />
                  </SelectTrigger>
                  <SelectContent>
                    {templates.length === 0 ? (
                      <div className="px-2 py-1 text-sm text-muted-foreground">
                        No published SOP templates available
                      </div>
                    ) : (
                      templates.map(template => (
                        <SelectItem key={template.id} value={template.id}>
                          <div className="flex flex-col">
                            <span>{template.name}</span>
                            {template.category && (
                              <span className="text-xs text-muted-foreground">
                                {template.category}
                              </span>
                            )}
                          </div>
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                
                {selectedTemplate?.description && (
                  <p className="text-sm text-muted-foreground">
                    {selectedTemplate.description}
                  </p>
                )}
                
                {selectedTemplate?.estimated_duration_minutes && (
                  <p className="text-sm text-muted-foreground">
                    Estimated duration: {selectedTemplate.estimated_duration_minutes} minutes
                  </p>
                )}
              </div>

              <div className="space-y-4 border-t pt-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="link-stage">Link to specific stage</Label>
                    <p className="text-sm text-muted-foreground">
                      Only trigger this SOP when batch enters a specific stage
                    </p>
                  </div>
                  <Switch
                    id="link-stage"
                    checked={linkToStage}
                    onCheckedChange={setLinkToStage}
                    disabled={submitting}
                  />
                </div>

                {linkToStage && (
                  <div className="space-y-2 ml-6">
                    <Label htmlFor="stage">Target Stage</Label>
                    <Select 
                      value={targetStage} 
                      onValueChange={setTargetStage}
                      disabled={submitting}
                    >
                      <SelectTrigger id="stage">
                        <SelectValue placeholder="Select target stage" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="planning">Planning</SelectItem>
                        <SelectItem value="germination">Germination</SelectItem>
                        <SelectItem value="clone">Clone</SelectItem>
                        <SelectItem value="vegetative">Vegetative</SelectItem>
                        <SelectItem value="flowering">Flowering</SelectItem>
                        <SelectItem value="harvest">Harvest</SelectItem>
                        <SelectItem value="drying">Drying</SelectItem>
                        <SelectItem value="curing">Curing</SelectItem>
                        <SelectItem value="packaging">Packaging</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="auto-create">Auto-create tasks</Label>
                    <p className="text-sm text-muted-foreground">
                      Automatically create tasks from this template when stage is reached
                    </p>
                  </div>
                  <Switch
                    id="auto-create"
                    checked={autoCreate}
                    onCheckedChange={setAutoCreate}
                    disabled={submitting}
                  />
                </div>
              </div>
            </>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={onClose}
            disabled={submitting}
            className="border-red-200 text-red-700 hover:bg-red-50 hover:text-red-800"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!selectedTemplateId || submitting || loading}
          >
            {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Link Template
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
