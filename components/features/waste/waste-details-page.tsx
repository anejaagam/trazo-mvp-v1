'use client'

/**
 * Waste Details Page Component
 *
 * Full page view of waste disposal details with:
 * - Photo gallery with lightbox
 * - Witness signature display
 * - Metrc sync status
 * - Timeline of related events
 * - Edit button (if within 24h and user has permission)
 * - Export to PDF button
 * - Mark as Rendered action for cannabis waste
 * - Back to waste logs button
 */

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useWasteLog, markAsRendered } from '@/lib/supabase/queries/waste-client'
import { usePermissions } from '@/hooks/use-permissions'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  AlertCircle,
  ArrowLeft,
  Camera,
  CheckCircle,
  Clock,
  Download,
  Edit,
  FileText,
  Loader2,
  Package,
  Scale,
  Trash2,
  User,
  Users,
  XCircle,
  Sparkles,
} from 'lucide-react'
import { format } from 'date-fns'
import { toast } from 'sonner'
import type { RoleKey } from '@/lib/rbac/types'
import { isEditable } from '@/types/waste'

interface WasteDetailsPageProps {
  wasteLogId: string
  userId: string
  userRole: string
  siteId: string
  onEdit?: (wasteLogId: string) => void
  onExport?: (wasteLogId: string) => void
}

export function WasteDetailsPage({
  wasteLogId,
  userId,
  userRole,
  siteId,
  onEdit,
  onExport,
}: WasteDetailsPageProps) {
  const router = useRouter()
  const { can } = usePermissions(userRole as RoleKey)
  const { data: wasteLog, isLoading, error } = useWasteLog(wasteLogId)
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState<number | null>(null)
  const [showRenderingDialog, setShowRenderingDialog] = useState(false)
  const [isSubmittingRendering, setIsSubmittingRendering] = useState(false)
  const [renderingMethod, setRenderingMethod] = useState('grinding')
  const [wasteMaterialMixed, setWasteMaterialMixed] = useState('')
  const [mixRatio, setMixRatio] = useState('50:50')

  // Check permissions
  const canEdit = wasteLog && can('waste:update') && isEditable(wasteLog, userId)
  const canExport = can('waste:export')

  // Determine if this is cannabis waste
  const isCannabisWaste = wasteLog?.waste_type === 'plant_material' || wasteLog?.waste_type === 'trim'

  // Calculate compliance status
  const getComplianceStatus = () => {
    if (!wasteLog || !isCannabisWaste) return { status: 'n/a', message: 'Not applicable' }

    const hasPhotos = (wasteLog.photo_urls?.length || 0) >= 2
    const isRendered = wasteLog.rendered_unusable
    const hasWitness = !!wasteLog.witnessed_by

    if (isRendered && hasWitness && hasPhotos) {
      return { status: 'compliant', message: 'All compliance requirements met' }
    }

    const missing: string[] = []
    if (!isRendered) missing.push('waste not rendered unusable')
    if (!hasWitness) missing.push('no witness')
    if (!hasPhotos) missing.push(`only ${wasteLog.photo_urls?.length || 0} photo(s)`)

    return {
      status: 'non-compliant',
      message: `Missing: ${missing.join(', ')}`,
    }
  }

  const compliance = getComplianceStatus()

  const handleExport = () => {
    if (wasteLog && onExport) {
      onExport(wasteLog.id)
    } else {
      toast.info('Export functionality will be implemented in Phase 7')
    }
  }

  const handleEdit = () => {
    if (wasteLog) {
      if (onEdit) {
        onEdit(wasteLog.id)
      } else {
        // Navigate to edit mode or open edit dialog
        router.push(`/dashboard/waste/${wasteLog.id}/edit`)
      }
    }
  }

  const handleMarkAsRendered = async () => {
    if (!wasteLog) return

    setIsSubmittingRendering(true)
    try {
      const result = await markAsRendered(
        wasteLog.id,
        renderingMethod,
        renderingMethod === 'fifty_fifty_mix' ? wasteMaterialMixed : undefined,
        renderingMethod === 'fifty_fifty_mix' ? mixRatio : undefined
      )

      if (result.error) {
        toast.error('Failed to mark as rendered: ' + result.error.message)
      } else {
        toast.success('Waste marked as rendered unusable')
        setShowRenderingDialog(false)
        // Force page reload to show updated data
        router.refresh()
      }
    } catch (error) {
      console.error('Exception marking as rendered:', error)
      toast.error('An unexpected error occurred')
    } finally {
      setIsSubmittingRendering(false)
    }
  }

  const renderPhotoGallery = () => {
    if (!wasteLog?.photo_urls || wasteLog.photo_urls.length === 0) {
      return (
        <div className="text-center py-12 text-muted-foreground">
          <Camera className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>No photos available</p>
        </div>
      )
    }

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {wasteLog.photo_urls.map((url, idx) => (
            <button
              key={url}
              onClick={() => setSelectedPhotoIndex(idx)}
              aria-label={`View waste photo ${idx + 1}`}
              className="relative aspect-square rounded-xl overflow-hidden border-2 border-slate-200 hover:border-blue-400 transition-all duration-300 group shadow-sm hover:shadow-lg"
            >
              <img
                src={url}
                alt={`Waste photo ${idx + 1}`}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/0 to-black/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <Badge className="absolute top-3 left-3 text-xs shadow-md bg-white/95 text-slate-900 border border-slate-200">
                <Camera className="h-3 w-3 mr-1" />
                {idx === 0 ? 'Before' : idx === 1 ? 'After' : `Photo ${idx + 1}`}
              </Badge>
              <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <div className="bg-white/95 rounded-full p-2 shadow-lg">
                  <Camera className="h-4 w-4 text-slate-700" />
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* Lightbox */}
        {selectedPhotoIndex !== null && (
          <div
            className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
            onClick={() => setSelectedPhotoIndex(null)}
          >
            <div className="relative max-w-4xl w-full">
              <img
                src={wasteLog.photo_urls[selectedPhotoIndex]}
                alt={`Waste photo ${selectedPhotoIndex + 1}`}
                className="w-full h-auto rounded-lg"
              />
              <Button
                variant="outline"
                size="sm"
                className="absolute top-4 right-4"
                onClick={() => setSelectedPhotoIndex(null)}
              >
                Close
              </Button>
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                {wasteLog.photo_urls.map((_, idx) => (
                  <button
                    key={idx}
                    aria-label={`View photo ${idx + 1}`}
                    onClick={(e) => {
                      e.stopPropagation()
                      setSelectedPhotoIndex(idx)
                    }}
                    className={`w-2 h-2 rounded-full transition-colors ${
                      idx === selectedPhotoIndex ? 'bg-white' : 'bg-white/50'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  const renderDetailsTab = () => {
    if (!wasteLog) return null

    return (
      <div className="space-y-4">
        {/* Summary */}
        <div className="grid grid-cols-3 lg:grid-cols-6 gap-4">
          <div>
            <div className="text-sm font-medium text-muted-foreground mb-1">Waste Type</div>
            <Badge variant="outline" className="capitalize">
              {wasteLog.waste_type.replace(/_/g, ' ')}
            </Badge>
          </div>
          <div>
            <div className="text-sm font-medium text-muted-foreground mb-1">Source</div>
            <div className="capitalize">{wasteLog.source_type}</div>
          </div>
          <div>
            <div className="text-sm font-medium text-muted-foreground mb-1">Quantity</div>
            <div className="font-semibold flex items-center gap-1">
              <Scale className="h-4 w-4" />
              {wasteLog.quantity} {wasteLog.unit_of_measure}
            </div>
          </div>
        </div>

        {/* Source Details */}
        <Card className="border-slate-200 bg-slate-50/50">
          <CardHeader className="pb-3 pt-4 px-4">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Package className="h-4 w-4 text-slate-700" />
              Source Details
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
              {wasteLog.batch_id && (
                <div className="space-y-1">
                  <div className="text-sm font-medium text-slate-500">Batch</div>
                  <div className="text-base font-semibold text-slate-900">{wasteLog.batch?.batch_number || 'Unknown'}</div>
                  {wasteLog.batch?.cultivar?.name && (
                    <div className="text-sm text-slate-600">Cultivar: {wasteLog.batch.cultivar.name}</div>
                  )}
                </div>
              )}
              {wasteLog.inventory_item_id && (
                <div className="space-y-1">
                  <div className="text-sm font-medium text-slate-500">Inventory Item</div>
                  <div className="text-base font-semibold text-slate-900">{wasteLog.inventory_item?.name || 'Unknown'}</div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Disposal Details */}
        <Card className="border-slate-200 bg-slate-50/50">
          <CardHeader className="pb-3 pt-4 px-4">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Trash2 className="h-4 w-4 text-red-700" />
              Disposal Details
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <div className="text-sm font-medium text-slate-500">Disposal Method</div>
                <div className="text-base font-semibold capitalize text-slate-900">{wasteLog.disposal_method.replace(/_/g, ' ')}</div>
              </div>
              <div className="space-y-1">
                <div className="text-sm font-medium text-slate-500">Disposal Date</div>
                <div className="flex items-center gap-2 text-base font-semibold text-slate-900">
                  <Clock className="h-5 w-5 text-slate-600" />
                  {format(new Date(wasteLog.disposed_at), 'MMM dd, yyyy h:mm a')}
                </div>
              </div>
              <div className="space-y-1">
                <div className="text-sm font-medium text-slate-500">Reason</div>
                <div className="text-base font-semibold text-slate-900">{wasteLog.reason || 'Not specified'}</div>
              </div>
              <div className="space-y-1">
                <div className="text-sm font-medium text-slate-500">Performed By</div>
                <div className="flex items-center gap-2 text-base font-semibold text-slate-900">
                  <User className="h-5 w-5 text-slate-600" />
                  {wasteLog.performer?.full_name || 'Unknown'}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {wasteLog.notes && (
          <Card className="border-slate-200 bg-amber-50/30">
            <CardHeader className="pb-2 pt-3 px-4">
              <CardTitle className="flex items-center gap-2 text-sm">
                <FileText className="h-4 w-4 text-amber-700" />
                Notes
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-3">
              <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">{wasteLog.notes}</p>
            </CardContent>
          </Card>
        )}
      </div>
    )
  }

  const renderComplianceTab = () => {
    if (!wasteLog) return null

    return (
      <div className="space-y-6">
        {/* Compliance Status */}
        <Alert 
          variant={compliance.status === 'compliant' ? 'default' : compliance.status === 'non-compliant' ? 'destructive' : 'default'}
          className={compliance.status === 'compliant' ? 'border-green-200 bg-green-50 text-green-900' : ''}
        >
          {compliance.status === 'compliant' ? (
            <CheckCircle className="h-5 w-5 text-green-600" />
          ) : compliance.status === 'non-compliant' ? (
            <XCircle className="h-5 w-5" />
          ) : (
            <AlertCircle className="h-5 w-5" />
          )}
          <AlertDescription className="text-base font-medium">{compliance.message}</AlertDescription>
        </Alert>

        {/* Rendering Details */}
        {isCannabisWaste && (
          <Card className="border-amber-200 bg-amber-50/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Sparkles className="h-5 w-5 text-amber-700" />
                Rendering Method
              </CardTitle>
              <CardDescription>How the waste was made unusable</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3 p-3 rounded-lg border bg-white">
                {wasteLog.rendered_unusable ? (
                  <>
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <span className="font-semibold text-green-900">Rendered Unusable</span>
                  </>
                ) : (
                  <>
                    <XCircle className="h-5 w-5 text-red-600" />
                    <span className="font-semibold text-red-900">Not Rendered</span>
                  </>
                )}
              </div>

              {wasteLog.rendering_method && (
                <div className="space-y-1">
                  <div className="text-sm font-medium text-slate-500">Method</div>
                  <div className="text-base font-semibold capitalize text-slate-900">{wasteLog.rendering_method.replace(/_/g, ' ')}</div>
                </div>
              )}

              {wasteLog.rendering_method === 'fifty_fifty_mix' && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <div className="text-sm font-medium text-slate-500">Mix Ratio</div>
                    <div className="text-base font-semibold text-slate-900">{wasteLog.mix_ratio || '50:50'}</div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-sm font-medium text-slate-500">Inert Material</div>
                    <div className="text-base font-semibold text-slate-900">{wasteLog.waste_material_mixed || 'Not specified'}</div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Witness Details */}
        <Card className="border-blue-200 bg-blue-50/30">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-700" />
              Witness Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {wasteLog.witnessed_by ? (
              <>
                <div className="space-y-1">
                  <div className="text-sm font-medium text-slate-500">Witness Name</div>
                  <div className="text-base font-semibold text-slate-900">{wasteLog.witness?.full_name || 'Unknown'}</div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg border bg-white">
                  {wasteLog.witness_id_verified ? (
                    <>
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      <span className="text-sm font-medium text-green-900">ID Verified</span>
                    </>
                  ) : (
                    <>
                      <AlertCircle className="h-5 w-5 text-yellow-600" />
                      <span className="text-sm font-medium text-yellow-900">ID Not Verified</span>
                    </>
                  )}
                </div>
                {wasteLog.witness_signature_url && (
                  <div className="space-y-2">
                    <div className="text-sm font-medium text-slate-500">Signature</div>
                    <img
                      src={wasteLog.witness_signature_url}
                      alt="Witness signature"
                      className="border-2 border-slate-200 rounded-lg p-4 bg-white max-w-xs shadow-sm"
                    />
                  </div>
                )}
              </>
            ) : (
              <div className="text-slate-600 text-sm flex items-center gap-2 p-3 bg-white rounded-lg border">
                <AlertCircle className="h-5 w-5 text-slate-400" />
                No witness assigned
              </div>
            )}
          </CardContent>
        </Card>

        {/* Photo Evidence */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Camera className="h-4 w-4" />
              Photo Evidence
            </CardTitle>
            <CardDescription>
              {wasteLog.photo_urls?.length || 0} photo(s) uploaded
              {isCannabisWaste && ' (min. 2 required for compliance)'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {(wasteLog.photo_urls?.length || 0) > 0 ? (
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span className="text-sm">{wasteLog.photo_urls.length} photo(s) available (see Photos tab)</span>
              </div>
            ) : (
              <div className="text-muted-foreground text-sm flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                No photos uploaded
              </div>
            )}
          </CardContent>
        </Card>

        {/* Metrc Sync Status */}
        {wasteLog.metrc_sync_status && wasteLog.metrc_sync_status !== 'not_applicable' && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Sparkles className="h-4 w-4" />
                Metrc Sync Status
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <div className="text-sm text-muted-foreground mb-1">Status</div>
                <Badge
                  variant={
                    wasteLog.metrc_sync_status === 'synced'
                      ? 'default'
                      : wasteLog.metrc_sync_status === 'pending'
                      ? 'secondary'
                      : 'destructive'
                  }
                  className={wasteLog.metrc_sync_status === 'synced' ? 'bg-green-500' : ''}
                >
                  {wasteLog.metrc_sync_status.toUpperCase()}
                </Badge>
              </div>

              {wasteLog.metrc_synced_at && (
                <div>
                  <div className="text-sm text-muted-foreground">Synced At</div>
                  <div className="text-sm">{format(new Date(wasteLog.metrc_synced_at), 'MMM dd, yyyy HH:mm')}</div>
                </div>
              )}

              {wasteLog.metrc_sync_error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{wasteLog.metrc_sync_error}</AlertDescription>
                </Alert>
              )}

              {wasteLog.metrc_disposal_id && (
                <div>
                  <div className="text-sm text-muted-foreground">Metrc Disposal ID</div>
                  <code className="text-xs bg-muted px-2 py-1 rounded">{wasteLog.metrc_disposal_id}</code>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    )
  }

  const renderTimelineTab = () => {
    if (!wasteLog) return null

    const timelineEvents = [
      {
        date: wasteLog.created_at,
        title: 'Waste Log Created',
        description: `Created by ${wasteLog.performer?.full_name || 'Unknown'}`,
        icon: <FileText className="h-4 w-4" />,
      },
      {
        date: wasteLog.disposed_at,
        title: 'Waste Disposed',
        description: `Disposed via ${wasteLog.disposal_method.replace(/_/g, ' ')}`,
        icon: <Trash2 className="h-4 w-4" />,
      },
    ]

    if (wasteLog.metrc_synced_at) {
      timelineEvents.push({
        date: wasteLog.metrc_synced_at,
        title: 'Synced to Metrc',
        description: 'Successfully synced to Metrc system',
        icon: <Sparkles className="h-4 w-4" />,
      })
    }

    if (wasteLog.updated_at !== wasteLog.created_at) {
      timelineEvents.push({
        date: wasteLog.updated_at,
        title: 'Record Updated',
        description: 'Waste log was modified',
        icon: <Edit className="h-4 w-4" />,
      })
    }

    // Sort by date
    timelineEvents.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

    return (
      <div className="space-y-1">
        {timelineEvents.map((event, idx) => (
          <div key={idx} className="flex gap-4">
            <div className="flex flex-col items-center">
              <div className="rounded-full bg-blue-100 p-3 shadow-sm">
                <div className="text-blue-700">{event.icon}</div>
              </div>
              {idx < timelineEvents.length - 1 && (
                <div className="w-0.5 flex-1 bg-gradient-to-b from-blue-300 to-slate-200 my-2" />
              )}
            </div>
            <Card className="flex-1 mb-6 border-slate-200 hover:border-blue-300 transition-colors">
              <CardContent className="p-4">
                <div className="font-semibold text-slate-900 mb-1">{event.title}</div>
                <div className="text-sm text-slate-600 mb-2">{event.description}</div>
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <Clock className="h-3 w-3" />
                  {format(new Date(event.date), 'MMM dd, yyyy HH:mm')}
                </div>
              </CardContent>
            </Card>
          </div>
        ))}
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="flex flex-col items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          <p className="mt-4 text-muted-foreground">Loading waste log...</p>
        </div>
      </div>
    )
  }

  if (error || !wasteLog) {
    return (
      <div className="container mx-auto py-8 px-4">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>Failed to load waste log: {error?.message || 'Not found'}</AlertDescription>
        </Alert>
        <div className="mt-4">
          <Button variant="outline" onClick={() => router.push('/dashboard/waste')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Waste Logs
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6 px-4 max-w-7xl">
      {/* Header */}
      <div className="mb-6 space-y-4">
        <Button 
          variant="ghost" 
          onClick={() => router.push('/dashboard/waste')}
          className="mb-2"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Waste Logs
        </Button>

        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-red-100 p-2.5">
                <Trash2 className="h-6 w-6 text-red-700" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">Waste Disposal Details</h1>
                <p className="text-muted-foreground mt-1">
                  {format(new Date(wasteLog.disposed_at), 'MMMM dd, yyyy')}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3 text-sm">
              <span className="inline-flex items-center gap-1.5 font-medium capitalize">
                <Package className="h-4 w-4" />
                {wasteLog.waste_type.replace(/_/g, ' ')}
              </span>
              <span className="text-muted-foreground">•</span>
              <span className="inline-flex items-center gap-1.5 font-semibold">
                <Scale className="h-4 w-4" />
                {wasteLog.quantity} {wasteLog.unit_of_measure}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {isCannabisWaste && !wasteLog.rendered_unusable && can('waste:update') && (
              <Button 
                onClick={() => setShowRenderingDialog(true)} 
                className="border-amber-600 bg-amber-50 text-amber-900 hover:bg-amber-100 font-medium"
                variant="outline"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Mark as Rendered
              </Button>
            )}
            {canEdit && (
              <Button variant="outline" onClick={handleEdit}>
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
            )}
            {canExport && (
              <Button variant="outline" onClick={handleExport}>
                <Download className="h-4 w-4 mr-2" />
                Export PDF
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="details" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 h-11 bg-slate-100">
          <TabsTrigger value="details" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">
            Details
          </TabsTrigger>
          <TabsTrigger value="photos" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">
            <Camera className="h-4 w-4 mr-2" />
            Photos ({wasteLog.photo_urls?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="compliance" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">
            <CheckCircle className="h-4 w-4 mr-2" />
            Compliance
          </TabsTrigger>
          <TabsTrigger value="timeline" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">
            <Clock className="h-4 w-4 mr-2" />
            Timeline
          </TabsTrigger>
        </TabsList>

        <TabsContent value="details" className="space-y-6">
          {renderDetailsTab()}
        </TabsContent>

        <TabsContent value="photos" className="space-y-6">
          {renderPhotoGallery()}
        </TabsContent>

        <TabsContent value="compliance" className="space-y-6">
          {renderComplianceTab()}
        </TabsContent>

        <TabsContent value="timeline" className="space-y-6">
          {renderTimelineTab()}
        </TabsContent>
      </Tabs>

      {/* Rendering Method Dialog */}
      <AlertDialog open={showRenderingDialog} onOpenChange={setShowRenderingDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Mark Waste as Rendered Unusable</AlertDialogTitle>
            <AlertDialogDescription>
              Select the method used to render this cannabis waste unusable
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-3">
              <Label>Rendering Method</Label>
              <RadioGroup value={renderingMethod} onValueChange={setRenderingMethod}>
                <div className="flex items-center space-x-2 border rounded-lg p-3">
                  <RadioGroupItem value="fifty_fifty_mix" id="fifty_fifty_mix" />
                  <Label htmlFor="fifty_fifty_mix" className="cursor-pointer flex-1">
                    <div className="font-medium">50:50 Mix</div>
                    <div className="text-sm text-muted-foreground">Mix with inert material (Required for OR/MD)</div>
                  </Label>
                </div>
                <div className="flex items-center space-x-2 border rounded-lg p-3">
                  <RadioGroupItem value="grinding" id="grinding" />
                  <Label htmlFor="grinding" className="cursor-pointer flex-1">
                    <div className="font-medium">Grinding</div>
                    <div className="text-sm text-muted-foreground">Grind to make unusable</div>
                  </Label>
                </div>
                <div className="flex items-center space-x-2 border rounded-lg p-3">
                  <RadioGroupItem value="composting" id="composting" />
                  <Label htmlFor="composting" className="cursor-pointer flex-1">
                    <div className="font-medium">Composting</div>
                    <div className="text-sm text-muted-foreground">Compost with organic matter</div>
                  </Label>
                </div>
                <div className="flex items-center space-x-2 border rounded-lg p-3">
                  <RadioGroupItem value="incineration" id="incineration" />
                  <Label htmlFor="incineration" className="cursor-pointer flex-1">
                    <div className="font-medium">Incineration</div>
                    <div className="text-sm text-muted-foreground">Burn waste (if state-approved)</div>
                  </Label>
                </div>
                <div className="flex items-center space-x-2 border rounded-lg p-3">
                  <RadioGroupItem value="chemical_treatment" id="chemical_treatment" />
                  <Label htmlFor="chemical_treatment" className="cursor-pointer flex-1">
                    <div className="font-medium">Chemical Treatment</div>
                    <div className="text-sm text-muted-foreground">Render unusable with chemicals</div>
                  </Label>
                </div>
                <div className="flex items-center space-x-2 border rounded-lg p-3">
                  <RadioGroupItem value="other" id="other" />
                  <Label htmlFor="other" className="cursor-pointer flex-1">
                    <div className="font-medium">Other Method</div>
                    <div className="text-sm text-muted-foreground">Other approved rendering method</div>
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {renderingMethod === 'fifty_fifty_mix' && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="material">Inert Material Used</Label>
                  <Input
                    id="material"
                    placeholder="e.g., sand, kitty litter, soil"
                    value={wasteMaterialMixed}
                    onChange={(e) => setWasteMaterialMixed(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ratio">Mix Ratio</Label>
                  <Input
                    id="ratio"
                    placeholder="50:50"
                    value={mixRatio}
                    onChange={(e) => setMixRatio(e.target.value)}
                  />
                </div>
              </>
            )}
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmittingRendering}>
              Cancel
            </AlertDialogCancel>
            <Button onClick={handleMarkAsRendered} disabled={isSubmittingRendering}>
              {isSubmittingRendering ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Mark as Rendered
                </>
              )}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
