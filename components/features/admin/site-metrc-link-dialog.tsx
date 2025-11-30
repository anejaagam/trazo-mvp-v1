'use client'

/**
 * SiteMetrcLinkDialog Component
 * Dialog for linking a Trazo site to a Metrc facility/license
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
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { toast } from 'sonner'
import { Loader2, Building2, Link2, AlertCircle, CheckCircle } from 'lucide-react'

interface MetrcFacility {
  id: string
  license_number: string
  facility_name: string
  facility_type: string
  state_code: string
  is_active: boolean
  is_linked: boolean
  linked_site_id: string | null
  sites?: { id: string; name: string } | null
}

interface Site {
  id: string
  name: string
  metrc_license_number?: string | null
  compliance_status?: 'compliant' | 'uncompliant' | 'pending' | 'not_required' | string | null
}

interface SiteMetrcLinkDialogProps {
  open: boolean
  onClose: () => void
  site: Site | null
  onSuccess?: () => void
}

export function SiteMetrcLinkDialog({
  open,
  onClose,
  site,
  onSuccess,
}: SiteMetrcLinkDialogProps) {
  const [loading, setLoading] = useState(false)
  const [facilities, setFacilities] = useState<MetrcFacility[]>([])
  const [loadingFacilities, setLoadingFacilities] = useState(false)
  const [selectedLicense, setSelectedLicense] = useState<string>('')

  // Load facilities when dialog opens
  useEffect(() => {
    if (open) {
      loadFacilities()
      setSelectedLicense(site?.metrc_license_number || '')
    }
  }, [open, site])

  const loadFacilities = async () => {
    try {
      setLoadingFacilities(true)
      const response = await fetch('/api/compliance/metrc/facilities')
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

  const handleLink = async () => {
    if (!site || !selectedLicense) {
      toast.error('Please select a Metrc facility')
      return
    }

    try {
      setLoading(true)

      const response = await fetch(`/api/compliance/metrc/sites/${site.id}/link`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ licenseNumber: selectedLicense }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to link site')
      }

      toast.success(`${site.name} linked to Metrc facility successfully`)
      onSuccess?.()
      onClose()
    } catch (error) {
      console.error('Error linking site:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to link site')
    } finally {
      setLoading(false)
    }
  }

  const handleUnlink = async () => {
    if (!site) return

    if (!confirm(`Are you sure you want to unlink ${site.name} from Metrc? This will mark the site as uncompliant.`)) {
      return
    }

    try {
      setLoading(true)

      const response = await fetch(`/api/compliance/metrc/sites/${site.id}/link`, {
        method: 'DELETE',
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to unlink site')
      }

      toast.success(`${site.name} unlinked from Metrc`)
      onSuccess?.()
      onClose()
    } catch (error) {
      console.error('Error unlinking site:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to unlink site')
    } finally {
      setLoading(false)
    }
  }

  // Get available facilities (not linked to other sites, and have valid license numbers)
  const availableFacilities = facilities.filter(
    (f) => f.license_number && (!f.is_linked || f.linked_site_id === site?.id)
  )

  const isLinked = !!site?.metrc_license_number

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Link2 className="w-5 h-5" />
            {isLinked ? 'Manage Metrc Link' : 'Link to Metrc Facility'}
          </DialogTitle>
          <DialogDescription>
            {isLinked
              ? `${site?.name} is currently linked to Metrc license ${site?.metrc_license_number}`
              : `Link ${site?.name} to a Metrc facility to enable compliance tracking`}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Current Status */}
          {isLinked ? (
            <Alert className="bg-green-50 border-green-200">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                <strong>Currently linked to:</strong> {site?.metrc_license_number}
              </AlertDescription>
            </Alert>
          ) : (
            <Alert className="bg-amber-50 border-amber-200">
              <AlertCircle className="h-4 w-4 text-amber-600" />
              <AlertDescription className="text-amber-800">
                This site is not linked to a Metrc facility. Link it to enable compliance tracking.
              </AlertDescription>
            </Alert>
          )}

          {/* Facility Selection */}
          <div className="space-y-2">
            <Label htmlFor="facility">Select Metrc Facility</Label>
            {loadingFacilities ? (
              <div className="flex items-center gap-2 py-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm text-muted-foreground">Loading facilities...</span>
              </div>
            ) : availableFacilities.length === 0 ? (
              <div className="text-sm text-muted-foreground py-2">
                No available Metrc facilities. Please connect your Metrc credentials first.
              </div>
            ) : (
              <Select value={selectedLicense} onValueChange={setSelectedLicense}>
                <SelectTrigger id="facility">
                  <SelectValue placeholder="Select a facility" />
                </SelectTrigger>
                <SelectContent>
                  {availableFacilities.map((facility) => (
                    <SelectItem key={facility.id} value={facility.license_number}>
                      <div className="flex items-center gap-2">
                        <Building2 className="w-4 h-4" />
                        <span className="font-medium">{facility.facility_name}</span>
                        <span className="text-xs text-muted-foreground">
                          ({facility.license_number})
                        </span>
                        {facility.linked_site_id === site?.id && (
                          <Badge variant="outline" className="text-xs bg-green-50 text-green-700">
                            Current
                          </Badge>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            <p className="text-xs text-muted-foreground">
              Only facilities from your connected Metrc states are shown.
            </p>
          </div>

          {/* Selected Facility Details */}
          {selectedLicense && (
            <div className="bg-slate-50 rounded-lg p-3 space-y-2">
              {(() => {
                const selected = facilities.find((f) => f.license_number === selectedLicense)
                if (!selected) return null
                return (
                  <>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">{selected.facility_name}</span>
                      <Badge variant="outline">{selected.state_code}</Badge>
                    </div>
                    <div className="text-xs text-muted-foreground space-y-1">
                      <p>License: {selected.license_number}</p>
                      <p>Type: {selected.facility_type}</p>
                    </div>
                  </>
                )
              })()}
            </div>
          )}
        </div>

        <DialogFooter className="flex gap-2">
          {isLinked && (
            <Button
              type="button"
              variant="destructive"
              onClick={handleUnlink}
              disabled={loading}
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Unlink
            </Button>
          )}
          <div className="flex-1" />
          <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            onClick={handleLink}
            disabled={loading || !selectedLicense || loadingFacilities}
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isLinked ? 'Update Link' : 'Link Facility'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
