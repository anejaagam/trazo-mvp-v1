'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { addQualityMetric } from '@/lib/supabase/queries/batches-client'
import type { BatchQualityMetric } from '@/types/batch'
import { toast } from 'sonner'

interface QualityMetricsPanelProps {
  batchId: string
  metrics?: BatchQualityMetric[]
  onMetricAdded: () => void
  userId: string
}

export function QualityMetricsPanel({ batchId, metrics = [], onMetricAdded, userId }: QualityMetricsPanelProps) {
  const [formState, setFormState] = useState({ metric_type: '', value: '', unit: '', notes: '' })
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!formState.metric_type || !formState.value) {
      toast.error('Metric type and value are required')
      return
    }
    try {
      setSaving(true)
      const payload = {
        metric_type: formState.metric_type,
        value: Number(formState.value),
        unit: formState.unit || '-',
        notes: formState.notes || undefined,
      }
      const { error } = await addQualityMetric(batchId, payload, userId)
      if (error) throw error
      toast.success('Metric added')
      setFormState({ metric_type: '', value: '', unit: '', notes: '' })
      onMetricAdded()
    } catch (error) {
      console.error('Unable to add metric', error)
      toast.error('Unable to add metric')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Add quality metric</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="space-y-3" onSubmit={handleSubmit}>
            <Input placeholder="Metric type (THC, Brix, etc.)" value={formState.metric_type} onChange={(event) => setFormState((prev) => ({ ...prev, metric_type: event.target.value }))} />
            <div className="grid gap-3 md:grid-cols-2">
              <Input placeholder="Value" type="number" step="0.1" value={formState.value} onChange={(event) => setFormState((prev) => ({ ...prev, value: event.target.value }))} />
              <Input placeholder="Unit" value={formState.unit} onChange={(event) => setFormState((prev) => ({ ...prev, unit: event.target.value }))} />
            </div>
            <Textarea rows={3} placeholder="Notes" value={formState.notes} onChange={(event) => setFormState((prev) => ({ ...prev, notes: event.target.value }))} />
            <Button type="submit" disabled={saving} className="w-full">
              {saving ? 'Saving…' : 'Add metric'}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent metrics</CardTitle>
        </CardHeader>
        <CardContent>
          {metrics.length === 0 && <p className="text-sm text-muted-foreground">No metrics recorded yet.</p>}
          <div className="space-y-3">
            {metrics.map((metric) => (
              <div key={metric.id} className="rounded-md border p-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{metric.metric_type}</span>
                  <span>{metric.value} {metric.unit}</span>
                </div>
                {metric.notes && <p className="text-xs text-muted-foreground">{metric.notes}</p>}
                <p className="text-xs text-muted-foreground">Recorded {new Date(metric.recorded_at).toLocaleDateString()}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
