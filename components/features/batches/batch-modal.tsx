'use client'

/**
 * Batch Modal Component
 * Create/Edit batch dialog with domain-specific fields
 */

import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { createBatch } from '@/lib/supabase/queries/batches-client'
import type { DomainBatch } from '@/types/batch'

interface BatchModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  siteId: string
  organizationId: string
  userId: string
  batch?: DomainBatch
}

export function BatchModal({ 
  isOpen, 
  onClose, 
  onSuccess, 
  siteId, 
  organizationId, 
  userId,
  batch 
}: BatchModalProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Form state
  const [domainType, setDomainType] = useState<'cannabis' | 'produce'>(batch?.domain_type || 'cannabis')
  const [batchNumber, setBatchNumber] = useState(batch?.batch_number || '')
  const [plantCount, setPlantCount] = useState(batch?.plant_count?.toString() || '')
  const [stage, setStage] = useState(batch?.stage || 'propagation')
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const batchData: any = {
        site_id: siteId,
        organization_id: organizationId,
        domain_type: domainType,
        batch_number: batchNumber,
        plant_count: parseInt(plantCount) || 0,
        stage: stage,
        status: 'active',
        start_date: new Date().toISOString(),
        created_by: userId,
      }

      const { error: createError } = await createBatch(batchData)
      
      if (createError) {
        throw createError
      }
      
      onSuccess()
    } catch (err: any) {
      console.error('Error creating batch:', err)
      setError(err.message || 'Failed to create batch')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{batch ? 'Edit Batch' : 'Create New Batch'}</DialogTitle>
          <DialogDescription>
            {batch ? 'Update batch information' : 'Create a new cultivation batch'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="domainType">Domain Type</Label>
            <Select value={domainType} onValueChange={(value: any) => setDomainType(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cannabis">🌿 Cannabis</SelectItem>
                <SelectItem value="produce">🥬 Produce</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="batchNumber">Batch Number *</Label>
            <Input
              id="batchNumber"
              value={batchNumber}
              onChange={(e) => setBatchNumber(e.target.value)}
              placeholder="e.g., BTH-001"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="plantCount">Plant/Unit Count *</Label>
            <Input
              id="plantCount"
              type="number"
              value={plantCount}
              onChange={(e) => setPlantCount(e.target.value)}
              placeholder="0"
              required
              min="0"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="stage">Initial Stage</Label>
            <Select value={stage} onValueChange={setStage}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {domainType === 'cannabis' ? (
                  <>
                    <SelectItem value="propagation">Propagation</SelectItem>
                    <SelectItem value="vegetative">Vegetative</SelectItem>
                    <SelectItem value="flowering">Flowering</SelectItem>
                  </>
                ) : (
                  <>
                    <SelectItem value="seeding">Seeding</SelectItem>
                    <SelectItem value="transplant">Transplant</SelectItem>
                    <SelectItem value="growing">Growing</SelectItem>
                  </>
                )}
              </SelectContent>
            </Select>
          </div>

          {error && (
            <div className="text-sm text-destructive">{error}</div>
          )}

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Creating...' : batch ? 'Update Batch' : 'Create Batch'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
