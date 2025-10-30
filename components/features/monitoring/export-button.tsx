'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Checkbox } from '@/components/ui/checkbox'
import { Download, FileText, FileSpreadsheet, Loader2 } from 'lucide-react'
import { usePermissions } from '@/hooks/use-permissions'

export type ExportFormat = 'csv' | 'pdf'

export interface ExportOptions {
  format: ExportFormat
  includeCharts: boolean
  includeAlarms: boolean
  includeSummary: boolean
}

export interface ExportButtonProps {
  onExport: (options: ExportOptions) => Promise<void>
  entityType: 'pod' | 'fleet' | 'alarms'
  entityName?: string
  className?: string
}

export function ExportButton({
  onExport,
  entityType,
  entityName,
  className,
}: ExportButtonProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [format, setFormat] = useState<ExportFormat>('csv')
  const [includeCharts, setIncludeCharts] = useState(true)
  const [includeAlarms, setIncludeAlarms] = useState(true)
  const [includeSummary, setIncludeSummary] = useState(true)
  const { can } = usePermissions('org_admin')

  if (!can('monitoring:export')) {
    return null
  }

  const handleExport = async () => {
    setLoading(true)
    try {
      await onExport({
        format,
        includeCharts,
        includeAlarms,
        includeSummary,
      })
      setOpen(false)
    } catch (error) {
      console.error('Export failed:', error)
    } finally {
      setLoading(false)
    }
  }

  const getEntityLabel = () => {
    switch (entityType) {
      case 'pod':
        return entityName ? `Pod ${entityName}` : 'Pod Data'
      case 'fleet':
        return 'Fleet Data'
      case 'alarms':
        return 'Alarm History'
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className={className}>
          <Download className="h-4 w-4 mr-2" />
          Export
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Export {getEntityLabel()}</DialogTitle>
          <DialogDescription>
            Choose your export format and options below. The file will download automatically when ready.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Format Selection */}
          <div className="space-y-3">
            <Label>Export Format</Label>
            <RadioGroup value={format} onValueChange={(v) => setFormat(v as ExportFormat)}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="csv" id="csv" />
                <Label htmlFor="csv" className="flex items-center gap-2 cursor-pointer font-normal">
                  <FileSpreadsheet className="h-4 w-4" />
                  CSV - Spreadsheet format for data analysis
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="pdf" id="pdf" />
                <Label htmlFor="pdf" className="flex items-center gap-2 cursor-pointer font-normal">
                  <FileText className="h-4 w-4" />
                  PDF - Formatted report with visualizations
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Options */}
          <div className="space-y-3">
            <Label>Include in Export</Label>
            <div className="space-y-3">
              {/* Charts option - only for PDF */}
              {format === 'pdf' && (
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="charts"
                    checked={includeCharts}
                    onCheckedChange={(checked) => setIncludeCharts(checked === true)}
                  />
                  <Label htmlFor="charts" className="cursor-pointer font-normal">
                    Charts and visualizations
                  </Label>
                </div>
              )}

              {/* Alarms option - not for alarms entity type */}
              {entityType !== 'alarms' && (
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="alarms"
                    checked={includeAlarms}
                    onCheckedChange={(checked) => setIncludeAlarms(checked === true)}
                  />
                  <Label htmlFor="alarms" className="cursor-pointer font-normal">
                    Alarm history and events
                  </Label>
                </div>
              )}

              {/* Summary option */}
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="summary"
                  checked={includeSummary}
                  onCheckedChange={(checked) => setIncludeSummary(checked === true)}
                />
                <Label htmlFor="summary" className="cursor-pointer font-normal">
                  Summary statistics
                </Label>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleExport} disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Exporting...
              </>
            ) : (
              <>
                <Download className="h-4 w-4 mr-2" />
                Export {format.toUpperCase()}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
