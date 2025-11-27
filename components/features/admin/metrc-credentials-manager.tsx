'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { toast } from 'sonner'
import { AlertCircle, CheckCircle, Plus, Trash2, RefreshCw, Key, Building2, Link2, MapPin, FolderPlus, RotateCcw, FlaskConical, Info, Check, X } from 'lucide-react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'

interface MetrcCredential {
  id: string
  state_code: string
  is_sandbox: boolean
  is_active: boolean
  validated_at: string | null
  validation_error: string | null
  last_facilities_sync: string | null
  created_at: string
}

interface FacilityCapabilities {
  IsMedical?: boolean
  IsRetail?: boolean
  IsHemp?: boolean
  CanGrowPlants?: boolean
  CanTagPlantBatches?: boolean
  CanClonePlantBatches?: boolean
  CanTrackVegetativePlants?: boolean
  CanPackageVegetativePlants?: boolean
  CanPackageWaste?: boolean
  CanReportHarvestSchedules?: boolean
  CanSubmitHarvestsForTesting?: boolean
  CanSubmitPackagesForTesting?: boolean
  CanCreateDerivedPackages?: boolean
  CanAssignLocationsToPackages?: boolean
  CanUpdateLocationsOnPackages?: boolean
  CanCreateTradeSamplePackages?: boolean
  CanDonatePackages?: boolean
  CanInfuseProducts?: boolean
  CanRecordProcessingJobs?: boolean
  CanDestroyProduct?: boolean
  CanTestPackages?: boolean
  CanSellToConsumers?: boolean
  CanSellToPatients?: boolean
  CanDeliverSalesToConsumers?: boolean
  CanDeliverSalesToPatients?: boolean
  CanHaveMemberPatients?: boolean
  EnableSublocations?: boolean
  CanTransferFromExternalFacilities?: boolean
  [key: string]: boolean | null | undefined
}

interface MetrcFacilityRawData {
  Name?: string
  DisplayName?: string
  Alias?: string
  Email?: string
  IsOwner?: boolean
  IsManager?: boolean
  HireDate?: string
  FacilityId?: number
  FacilityType?: FacilityCapabilities
  License?: {
    Number?: string
    LicenseType?: string
    StartDate?: string
    EndDate?: string
  }
}

interface MetrcFacility {
  id: string
  license_number: string
  facility_name: string
  facility_type: string
  state_code: string
  is_active: boolean
  is_linked: boolean
  linked_site_id: string | null
  last_synced_at: string
  sites?: { id: string; name: string } | null
  raw_data?: MetrcFacilityRawData
}

const US_STATES = [
  { code: 'AK', name: 'Alaska' },
  { code: 'CA', name: 'California' },
  { code: 'CO', name: 'Colorado' },
  { code: 'DC', name: 'District of Columbia' },
  { code: 'LA', name: 'Louisiana' },
  { code: 'MA', name: 'Massachusetts' },
  { code: 'MD', name: 'Maryland' },
  { code: 'ME', name: 'Maine' },
  { code: 'MI', name: 'Michigan' },
  { code: 'MN', name: 'Minnesota' },
  { code: 'MO', name: 'Missouri' },
  { code: 'MS', name: 'Mississippi' },
  { code: 'MT', name: 'Montana' },
  { code: 'NJ', name: 'New Jersey' },
  { code: 'NV', name: 'Nevada' },
  { code: 'OH', name: 'Ohio' },
  { code: 'OK', name: 'Oklahoma' },
  { code: 'OR', name: 'Oregon' },
  { code: 'WV', name: 'West Virginia' },
]

export function MetrcCredentialsManager() {
  const [credentials, setCredentials] = useState<MetrcCredential[]>([])
  const [facilities, setFacilities] = useState<MetrcFacility[]>([])
  const [configuredStates, setConfiguredStates] = useState<string[]>([])
  const [testMode, setTestMode] = useState(false)
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [validating, setValidating] = useState(false)
  const [refreshing, setRefreshing] = useState<string | null>(null)
  const [creatingFromFacility, setCreatingFromFacility] = useState<string | null>(null)
  const [syncingLocations, setSyncingLocations] = useState<string | null>(null)
  const [selectedFacility, setSelectedFacility] = useState<MetrcFacility | null>(null)

  // Form state
  const [formData, setFormData] = useState({
    stateCode: '',
    userApiKey: '',
    isSandbox: false,
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)

      // Fetch credentials
      const credResponse = await fetch('/api/compliance/metrc/credentials')
      const credData = await credResponse.json()

      if (credResponse.ok) {
        setCredentials(credData.credentials || [])
        setConfiguredStates(credData.configuredStates || [])
        setTestMode(credData.testMode || false)
      }

      // Fetch facilities
      const facilityResponse = await fetch('/api/compliance/metrc/facilities')
      const facilityData = await facilityResponse.json()

      if (facilityResponse.ok) {
        setFacilities(facilityData.facilities || [])
      }
    } catch (error) {
      console.error('Error loading data:', error)
      toast.error('Failed to load Metrc data')
    } finally {
      setLoading(false)
    }
  }

  const handleOpenDialog = () => {
    setFormData({
      stateCode: '',
      userApiKey: '',
      isSandbox: false,
    })
    setDialogOpen(true)
  }

  const handleValidateAndSave = async () => {
    if (!formData.stateCode || !formData.userApiKey) {
      toast.error('Please select a state and enter your User API Key')
      return
    }

    try {
      setValidating(true)

      const response = await fetch('/api/compliance/metrc/credentials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stateCode: formData.stateCode,
          userApiKey: formData.userApiKey,
          isSandbox: formData.isSandbox,
          validateNow: true,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        toast.error(data.validationError || data.error || 'Failed to validate credentials')
        return
      }

      toast.success(`Connected to ${formData.stateCode} Metrc successfully! Found ${data.facilities?.length || 0} facilities.`)
      setDialogOpen(false)
      loadData()
    } catch (error) {
      console.error('Error saving credentials:', error)
      toast.error('Failed to save credentials')
    } finally {
      setValidating(false)
    }
  }

  const handleRefreshFacilities = async (stateCode: string) => {
    try {
      setRefreshing(stateCode)

      const response = await fetch('/api/compliance/metrc/facilities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stateCode }),
      })

      const data = await response.json()

      if (!response.ok) {
        toast.error(data.validationError || data.error || 'Failed to refresh facilities')
        return
      }

      toast.success(`Refreshed ${data.total} facilities from Metrc`)
      loadData()
    } catch (error) {
      console.error('Error refreshing facilities:', error)
      toast.error('Failed to refresh facilities')
    } finally {
      setRefreshing(null)
    }
  }

  const handleDeleteCredential = async (stateCode: string) => {
    if (!confirm(`Are you sure you want to remove ${stateCode} Metrc credentials? This will affect all linked facilities.`)) {
      return
    }

    try {
      const response = await fetch(`/api/compliance/metrc/credentials?stateCode=${stateCode}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete credentials')
      }

      toast.success('Credentials removed successfully')
      loadData()
    } catch (error) {
      console.error('Error deleting credentials:', error)
      toast.error('Failed to remove credentials')
    }
  }

  const handleCreateSiteFromFacility = async (facilityId: string) => {
    try {
      setCreatingFromFacility(facilityId)

      const response = await fetch('/api/compliance/metrc/facilities/create-site', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ facilityId }),
      })

      const data = await response.json()

      if (!response.ok) {
        toast.error(data.error || 'Failed to create site')
        return
      }

      toast.success(`Site "${data.site.name}" created successfully!`)
      loadData()
    } catch (error) {
      console.error('Error creating site from facility:', error)
      toast.error('Failed to create site')
    } finally {
      setCreatingFromFacility(null)
    }
  }

  const handleSyncLocations = async (siteId: string, siteName: string) => {
    try {
      setSyncingLocations(siteId)

      const response = await fetch(`/api/compliance/metrc/sites/${siteId}/sync-locations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })

      const data = await response.json()

      if (!response.ok) {
        toast.error(data.error || data.details || 'Failed to sync locations')
        return
      }

      const { syncResult } = data
      toast.success(
        `Synced locations for "${siteName}": ${syncResult.roomsCreated} created, ${syncResult.roomsUpdated} updated`
      )
      loadData()
    } catch (error) {
      console.error('Error syncing locations:', error)
      toast.error('Failed to sync locations')
    } finally {
      setSyncingLocations(null)
    }
  }

  // Get available states (configured but not yet connected)
  const availableStates = US_STATES.filter(
    state => configuredStates.includes(state.code) && !credentials.find(c => c.state_code === state.code)
  )

  if (loading) {
    return <div className="text-center py-8">Loading...</div>
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Metrc Integration</h2>
          <p className="text-sm text-slate-600 mt-1">
            Connect your Metrc account to enable compliance tracking
          </p>
        </div>
        {availableStates.length > 0 && (
          <Button onClick={handleOpenDialog}>
            <Plus className="w-4 h-4 mr-2" />
            Connect State
          </Button>
        )}
      </div>

      {/* Test Mode Banner */}
      {testMode && (
        <Alert className="bg-purple-50 border-purple-200">
          <FlaskConical className="h-4 w-4 text-purple-600" />
          <AlertDescription className="text-purple-800">
            <strong>Test Mode Active</strong> - Using Alaska sandbox environment for all states.
            This is for testing purposes only.
          </AlertDescription>
        </Alert>
      )}

      {/* Info Alert */}
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Enter your Metrc User API Key to connect. The Vendor API Key is automatically configured by your administrator.
        </AlertDescription>
      </Alert>

      {/* Connected States */}
      {credentials.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Key className="w-12 h-12 text-slate-300 mb-4" />
            <p className="text-slate-600 mb-4">No Metrc connections configured yet</p>
            {availableStates.length > 0 ? (
              <Button onClick={handleOpenDialog}>
                <Plus className="w-4 h-4 mr-2" />
                Connect Your First State
              </Button>
            ) : (
              <p className="text-sm text-slate-500">
                Contact your administrator to configure Metrc vendor credentials
              </p>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {credentials.map((credential) => {
            const stateFacilities = facilities.filter(f => f.state_code === credential.state_code)
            const linkedCount = stateFacilities.filter(f => f.is_linked).length
            const stateName = US_STATES.find(s => s.code === credential.state_code)?.name || credential.state_code

            return (
              <Card key={credential.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <MapPin className="w-5 h-5" />
                        {stateName}
                        {credential.is_sandbox && (
                          <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                            Sandbox
                          </Badge>
                        )}
                        {credential.validated_at ? (
                          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Connected
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                            <AlertCircle className="w-3 h-3 mr-1" />
                            Not Validated
                          </Badge>
                        )}
                      </CardTitle>
                      <CardDescription className="mt-1">
                        {stateFacilities.length} facilities found • {linkedCount} linked to sites
                      </CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRefreshFacilities(credential.state_code)}
                        disabled={refreshing === credential.state_code}
                      >
                        <RefreshCw className={`w-4 h-4 ${refreshing === credential.state_code ? 'animate-spin' : ''}`} />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteCredential(credential.state_code)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {/* Facilities List */}
                  {stateFacilities.length > 0 ? (
                    <div className="space-y-3">
                      <h4 className="text-sm font-medium text-slate-700">Available Facilities (Metrc Licenses)</h4>
                      <div className="grid gap-2">
                        {stateFacilities.map((facility) => (
                          <div
                            key={facility.id}
                            className="flex items-center justify-between p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
                          >
                            <div
                              className="flex items-center gap-3 cursor-pointer flex-1"
                              onClick={() => setSelectedFacility(facility)}
                            >
                              <Building2 className="w-5 h-5 text-slate-400" />
                              <div>
                                <p className="font-medium text-sm">{facility.facility_name}</p>
                                <p className="text-xs text-slate-500">
                                  {facility.license_number} • {facility.facility_type}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setSelectedFacility(facility)}
                                title="View facility details & capabilities"
                              >
                                <Info className="w-4 h-4 text-slate-400" />
                              </Button>
                              {facility.is_linked ? (
                                <>
                                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                    <Link2 className="w-3 h-3 mr-1" />
                                    {facility.sites?.name || 'Site'}
                                  </Badge>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleSyncLocations(facility.linked_site_id!, facility.sites?.name || 'Site')}
                                    disabled={syncingLocations === facility.linked_site_id}
                                    title="Sync rooms/locations with Metrc"
                                  >
                                    <RotateCcw className={`w-4 h-4 ${syncingLocations === facility.linked_site_id ? 'animate-spin' : ''}`} />
                                  </Button>
                                </>
                              ) : (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleCreateSiteFromFacility(facility.id)}
                                  disabled={creatingFromFacility === facility.id}
                                  className="text-green-700 border-green-300 hover:bg-green-50"
                                >
                                  {creatingFromFacility === facility.id ? (
                                    <RefreshCw className="w-4 h-4 mr-1 animate-spin" />
                                  ) : (
                                    <FolderPlus className="w-4 h-4 mr-1" />
                                  )}
                                  Create Site
                                </Button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-slate-500 text-center py-4">
                      No facilities found. Try refreshing.
                    </p>
                  )}

                  <Separator className="my-4" />

                  <dl className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <dt className="font-medium text-slate-600">Last Validated</dt>
                      <dd className="mt-1">
                        {credential.validated_at
                          ? new Date(credential.validated_at).toLocaleString()
                          : 'Never'}
                      </dd>
                    </div>
                    <div>
                      <dt className="font-medium text-slate-600">Last Facilities Sync</dt>
                      <dd className="mt-1">
                        {credential.last_facilities_sync
                          ? new Date(credential.last_facilities_sync).toLocaleString()
                          : 'Never'}
                      </dd>
                    </div>
                  </dl>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Unlinked Facilities Summary */}
      {facilities.filter(f => !f.is_linked).length > 0 && (
        <Alert className="bg-amber-50 border-amber-200">
          <AlertCircle className="h-4 w-4 text-amber-600" />
          <AlertDescription className="text-amber-800">
            <strong>{facilities.filter(f => !f.is_linked).length} Metrc license(s)</strong> do not have corresponding Trazo sites.
            Click "Create Site" next to each license above to create sites automatically.
          </AlertDescription>
        </Alert>
      )}

      {/* Connect State Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Connect Metrc State</DialogTitle>
            <DialogDescription>
              {testMode
                ? 'Enter your Metrc User API Key to connect. Test mode will use Alaska sandbox for all states.'
                : 'Enter your Metrc User API Key to connect. Your facilities will be automatically imported.'}
            </DialogDescription>
          </DialogHeader>

          {testMode && (
            <Alert className="bg-purple-50 border-purple-200">
              <FlaskConical className="h-4 w-4 text-purple-600" />
              <AlertDescription className="text-purple-700 text-sm">
                Test mode: All connections use Alaska sandbox
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-4">
            <div>
              <Label htmlFor="state">State *</Label>
              <Select
                value={formData.stateCode}
                onValueChange={(value) => setFormData({ ...formData, stateCode: value })}
              >
                <SelectTrigger id="state">
                  <SelectValue placeholder="Select state" />
                </SelectTrigger>
                <SelectContent>
                  {availableStates.map((state) => (
                    <SelectItem key={state.code} value={state.code}>
                      {state.name} ({state.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {availableStates.length === 0 && (
                <p className="text-xs text-slate-500 mt-1">
                  No additional states available. Contact your administrator.
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="user_key">User API Key *</Label>
              <Input
                id="user_key"
                type="password"
                value={formData.userApiKey}
                onChange={(e) => setFormData({ ...formData, userApiKey: e.target.value })}
                placeholder="Enter your Metrc User API Key"
              />
              <p className="text-xs text-slate-500 mt-1">
                Your personal API key from Metrc. The Vendor API Key is provided by your administrator.
              </p>
            </div>

            {!testMode && (
              <div className="flex items-center space-x-2">
                <Switch
                  id="sandbox"
                  checked={formData.isSandbox}
                  onCheckedChange={(checked) => setFormData({ ...formData, isSandbox: checked })}
                />
                <Label htmlFor="sandbox" className="cursor-pointer">
                  Use Sandbox Environment (for testing)
                </Label>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={validating}>
              Cancel
            </Button>
            <Button onClick={handleValidateAndSave} disabled={validating || !formData.stateCode}>
              {validating ? 'Connecting...' : 'Connect & Import Facilities'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Facility Details Dialog */}
      <Dialog open={!!selectedFacility} onOpenChange={() => setSelectedFacility(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Building2 className="w-5 h-5" />
              {selectedFacility?.facility_name}
            </DialogTitle>
            <DialogDescription>
              License: {selectedFacility?.license_number} • Type: {selectedFacility?.facility_type}
            </DialogDescription>
          </DialogHeader>

          {selectedFacility && (
            <ScrollArea className="max-h-[50vh] pr-4">
              <div className="space-y-6">
                {/* License Info */}
                {selectedFacility.raw_data?.License && (
                  <div>
                    <h4 className="font-medium text-sm mb-3">License Information</h4>
                    <div className="grid grid-cols-2 gap-3 text-sm bg-slate-50 p-3 rounded-lg">
                      <div>
                        <span className="text-slate-500">License Number:</span>
                        <p className="font-medium">{selectedFacility.raw_data.License.Number}</p>
                      </div>
                      <div>
                        <span className="text-slate-500">License Type:</span>
                        <p className="font-medium">{selectedFacility.raw_data.License.LicenseType}</p>
                      </div>
                      {selectedFacility.raw_data.License.StartDate && (
                        <div>
                          <span className="text-slate-500">Start Date:</span>
                          <p className="font-medium">{new Date(selectedFacility.raw_data.License.StartDate).toLocaleDateString()}</p>
                        </div>
                      )}
                      {selectedFacility.raw_data.License.EndDate && (
                        <div>
                          <span className="text-slate-500">End Date:</span>
                          <p className="font-medium">{new Date(selectedFacility.raw_data.License.EndDate).toLocaleDateString()}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Facility Capabilities */}
                {selectedFacility.raw_data?.FacilityType && (
                  <div>
                    <h4 className="font-medium text-sm mb-3">Facility Capabilities</h4>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      {Object.entries(selectedFacility.raw_data.FacilityType)
                        .filter(([key, value]) => typeof value === 'boolean')
                        .sort(([a], [b]) => a.localeCompare(b))
                        .map(([key, value]) => {
                          // Format key from camelCase to readable text
                          const label = key
                            .replace(/([A-Z])/g, ' $1')
                            .replace(/^./, str => str.toUpperCase())
                            .trim()
                          return (
                            <div
                              key={key}
                              className={`flex items-center gap-2 p-2 rounded ${
                                value ? 'bg-green-50 text-green-800' : 'bg-slate-50 text-slate-500'
                              }`}
                            >
                              {value ? (
                                <Check className="w-4 h-4 text-green-600 flex-shrink-0" />
                              ) : (
                                <X className="w-4 h-4 text-slate-400 flex-shrink-0" />
                              )}
                              <span className="text-xs">{label}</span>
                            </div>
                          )
                        })}
                    </div>
                  </div>
                )}

                {/* User Info */}
                {(selectedFacility.raw_data?.IsOwner !== undefined || selectedFacility.raw_data?.IsManager !== undefined) && (
                  <div>
                    <h4 className="font-medium text-sm mb-3">Your Access</h4>
                    <div className="flex gap-2">
                      {selectedFacility.raw_data.IsOwner && (
                        <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                          Owner
                        </Badge>
                      )}
                      {selectedFacility.raw_data.IsManager && (
                        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                          Manager
                        </Badge>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedFacility(null)}>
              Close
            </Button>
            {selectedFacility && !selectedFacility.is_linked && (
              <Button
                onClick={() => {
                  handleCreateSiteFromFacility(selectedFacility.id)
                  setSelectedFacility(null)
                }}
                className="text-green-700 bg-green-50 hover:bg-green-100 border-green-300"
              >
                <FolderPlus className="w-4 h-4 mr-2" />
                Create Site from Facility
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
