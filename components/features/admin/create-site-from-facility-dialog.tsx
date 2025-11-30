'use client'

/**
 * CreateSiteFromFacilityDialog Component
 * Dialog for creating a site from an available Metrc facility
 * For Metrc organizations, sites can only be created from unlinked facilities
 */

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { ScrollArea } from '@/components/ui/scroll-area'
import { toast } from 'sonner'
import { Loader2, Building2, AlertCircle, CheckCircle, MapPin } from 'lucide-react'

interface MetrcFacility {
  id: string
  license_number: string
  facility_name: string
  facility_type: string
  state_code: string
  is_active: boolean
  is_linked: boolean
  linked_site_id: string | null
  address?: {
    street1?: string
    city?: string
    state?: string
    postalCode?: string
  } | null
}

interface CreateSiteFromFacilityDialogProps {
  open: boolean
  onClose: () => void
  onSuccess?: () => void
}

export function CreateSiteFromFacilityDialog({
  open,
  onClose,
  onSuccess,
}: CreateSiteFromFacilityDialogProps) {
  const [loading, setLoading] = useState(false)
  const [facilities, setFacilities] = useState<MetrcFacility[]>([])
  const [loadingFacilities, setLoadingFacilities] = useState(false)
  const [selectedFacility, setSelectedFacility] = useState<MetrcFacility | null>(null)
  const [creating, setCreating] = useState(false)

  // Load available facilities when dialog opens
  useEffect(() => {
    if (open) {
      loadFacilities()
      setSelectedFacility(null)
    }
  }, [open])

  const loadFacilities = async () => {
    try {
      setLoadingFacilities(true)
      // Get only unlinked facilities
      const response = await fetch('/api/compliance/metrc/facilities?unlinkedOnly=true')
      const data = await response.json()

      if (response.ok) {
        setFacilities(data.facilities || [])
      } else {
        toast.error('Failed to load Metrc facilities')
      }
    } catch (error) {
      console.error('Error loading facilities:', error)
      toast.error('Failed to load Metrc facilities')
    } finally {
      setLoadingFacilities(false)
    }
  }

  const handleCreateSite = async () => {
    if (!selectedFacility) {
      toast.error('Please select a Metrc facility')
      return
    }

    try {
      setCreating(true)

      const response = await fetch('/api/admin/organizations/sites/from-facility', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ facilityId: selectedFacility.id }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create site')
      }

      toast.success(`Site "${data.site.name}" created and linked to Metrc`)
      onSuccess?.()
      onClose()
    } catch (error) {
      console.error('Error creating site:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to create site')
    } finally {
      setCreating(false)
    }
  }

  const availableFacilities = facilities.filter((f) => !f.is_linked && f.license_number)

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="w-5 h-5" />
            Create Site from Metrc Facility
          </DialogTitle>
          <DialogDescription>
            Select a Metrc facility to create a new site. The site will be automatically linked to the selected license.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {loadingFacilities ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin mr-2" />
              <span>Loading facilities...</span>
            </div>
          ) : availableFacilities.length === 0 ? (
            <Alert className="bg-amber-50 border-amber-200">
              <AlertCircle className="h-4 w-4 text-amber-600" />
              <AlertDescription className="text-amber-800">
                <strong>No available Metrc facilities.</strong>
                <p className="mt-1 text-sm">
                  All your Metrc facilities are already linked to sites, or you haven&apos;t connected your Metrc credentials yet.
                </p>
                <p className="mt-2 text-sm">
                  Go to <strong>Admin → Metrc Integration</strong> to connect your Metrc account.
                </p>
              </AlertDescription>
            </Alert>
          ) : (
            <>
              <p className="text-sm text-muted-foreground">
                {availableFacilities.length} available facilit{availableFacilities.length === 1 ? 'y' : 'ies'}
              </p>
              <ScrollArea className="h-64 border rounded-lg">
                <div className="p-2 space-y-2">
                  {availableFacilities.map((facility) => (
                    <div
                      key={facility.id}
                      onClick={() => setSelectedFacility(facility)}
                      className={`p-3 rounded-lg border-2 cursor-pointer transition-colors ${
                        selectedFacility?.id === facility.id
                          ? 'border-primary bg-primary/5'
                          : 'border-transparent bg-slate-50 hover:bg-slate-100'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3">
                          <div className={`mt-0.5 ${selectedFacility?.id === facility.id ? 'text-primary' : 'text-slate-400'}`}>
                            {selectedFacility?.id === facility.id ? (
                              <CheckCircle className="w-5 h-5" />
                            ) : (
                              <Building2 className="w-5 h-5" />
                            )}
                          </div>
                          <div>
                            <p className="font-medium">{facility.facility_name}</p>
                            <p className="text-sm text-muted-foreground">
                              {facility.license_number}
                            </p>
                            {facility.address?.city && (
                              <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                                <MapPin className="w-3 h-3" />
                                {facility.address.city}, {facility.address.state}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{facility.state_code}</Badge>
                          <Badge variant="secondary" className="text-xs">
                            {facility.facility_type}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </>
          )}

          {/* Selected Facility Details */}
          {selectedFacility && (
            <div className="bg-primary/5 border border-primary/20 rounded-lg p-3">
              <p className="text-sm font-medium">Selected Facility:</p>
              <p className="text-sm">{selectedFacility.facility_name}</p>
              <p className="text-xs text-muted-foreground">
                License: {selectedFacility.license_number} • {selectedFacility.state_code}
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={creating}>
            Cancel
          </Button>
          <Button
            onClick={handleCreateSite}
            disabled={creating || !selectedFacility || loadingFacilities}
          >
            {creating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Create Site
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
