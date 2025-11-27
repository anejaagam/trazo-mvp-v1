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
import { AlertCircle, CheckCircle, Plus, Trash2, Edit, Key } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface ComplianceApiKey {
  id: string
  site_id: string
  site_name: string
  vendor_api_key: string
  user_api_key: string
  facility_license_number: string
  state_code: string
  is_sandbox: boolean
  is_active: boolean
  created_at: string
  updated_at: string
}

interface Site {
  id: string
  name: string
}

const US_STATES = [
  { code: 'OR', name: 'Oregon' },
  { code: 'MD', name: 'Maryland' },
  { code: 'CA', name: 'California' },
  { code: 'CO', name: 'Colorado' },
  { code: 'MI', name: 'Michigan' },
  { code: 'NV', name: 'Nevada' },
  { code: 'AK', name: 'Alaska' },
  { code: 'MA', name: 'Massachusetts' },
  { code: 'OK', name: 'Oklahoma' },
]

export function MetrcApiKeyManager() {
  const [apiKeys, setApiKeys] = useState<ComplianceApiKey[]>([])
  const [sites, setSites] = useState<Site[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingKey, setEditingKey] = useState<ComplianceApiKey | null>(null)
  const [validating, setValidating] = useState(false)

  // Form state
  const [formData, setFormData] = useState({
    site_id: '',
    vendor_api_key: '',
    user_api_key: '',
    facility_license_number: '',
    state_code: '',
    is_sandbox: false,
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)

      // Fetch API keys
      const keysResponse = await fetch('/api/compliance/api-keys')
      const keysData = await keysResponse.json()

      if (keysResponse.ok) {
        setApiKeys(keysData.data || [])
      }

      // Fetch sites
      const sitesResponse = await fetch('/api/sites')
      const sitesData = await sitesResponse.json()

      if (sitesResponse.ok) {
        setSites(sitesData.data || [])
      }
    } catch (error) {
      console.error('Error loading data:', error)
      toast.error('Failed to load API keys')
    } finally {
      setLoading(false)
    }
  }

  const handleOpenDialog = (key?: ComplianceApiKey) => {
    if (key) {
      setEditingKey(key)
      setFormData({
        site_id: key.site_id,
        vendor_api_key: key.vendor_api_key,
        user_api_key: key.user_api_key,
        facility_license_number: key.facility_license_number,
        state_code: key.state_code,
        is_sandbox: key.is_sandbox,
      })
    } else {
      setEditingKey(null)
      setFormData({
        site_id: '',
        vendor_api_key: '',
        user_api_key: '',
        facility_license_number: '',
        state_code: '',
        is_sandbox: false,
      })
    }
    setDialogOpen(true)
  }

  const handleValidateAndSave = async () => {
    // Basic validation
    if (!formData.site_id || !formData.vendor_api_key || !formData.user_api_key ||
        !formData.facility_license_number || !formData.state_code) {
      toast.error('Please fill in all required fields')
      return
    }

    try {
      setValidating(true)

      // Validate credentials with Metrc
      const validateResponse = await fetch('/api/compliance/validate-credentials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vendor_api_key: formData.vendor_api_key,
          user_api_key: formData.user_api_key,
          state_code: formData.state_code,
          is_sandbox: formData.is_sandbox,
        }),
      })

      const validateData = await validateResponse.json()

      if (!validateResponse.ok || !validateData.valid) {
        toast.error(validateData.error || 'Failed to validate Metrc credentials')
        return
      }

      // Save the API key
      const saveResponse = await fetch('/api/compliance/api-keys', {
        method: editingKey ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          id: editingKey?.id,
        }),
      })

      const saveData = await saveResponse.json()

      if (!saveResponse.ok) {
        throw new Error(saveData.error || 'Failed to save API key')
      }

      toast.success(`API key ${editingKey ? 'updated' : 'created'} successfully`)

      setDialogOpen(false)
      loadData()
    } catch (error) {
      console.error('Error saving API key:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to save API key')
    } finally {
      setValidating(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to deactivate this API key?')) {
      return
    }

    try {
      const response = await fetch(`/api/compliance/api-keys/${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete API key')
      }

      toast.success('API key deactivated successfully')

      loadData()
    } catch (error) {
      console.error('Error deleting API key:', error)
      toast.error('Failed to deactivate API key')
    }
  }

  if (loading) {
    return <div className="text-center py-8">Loading...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Metrc API Keys</h2>
          <p className="text-sm text-slate-600 mt-1">
            Manage Metrc API credentials for cannabis tracking compliance
          </p>
        </div>
        <Button onClick={() => handleOpenDialog()}>
          <Plus className="w-4 h-4 mr-2" />
          Add API Key
        </Button>
      </div>

      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          API keys are stored securely. Use sandbox credentials for testing and production credentials for live operations.
        </AlertDescription>
      </Alert>

      <div className="grid gap-4">
        {apiKeys.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Key className="w-12 h-12 text-slate-300 mb-4" />
              <p className="text-slate-600 mb-4">No API keys configured yet</p>
              <Button onClick={() => handleOpenDialog()}>
                <Plus className="w-4 h-4 mr-2" />
                Add Your First API Key
              </Button>
            </CardContent>
          </Card>
        ) : (
          apiKeys.map((key) => (
            <Card key={key.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      {key.site_name}
                      {key.is_sandbox && (
                        <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                          Sandbox
                        </Badge>
                      )}
                      {key.is_active ? (
                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Active
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-slate-50 text-slate-600 border-slate-200">
                          Inactive
                        </Badge>
                      )}
                    </CardTitle>
                    <CardDescription className="mt-1">
                      {key.facility_license_number} • {key.state_code}
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenDialog(key)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(key.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <dl className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <dt className="font-medium text-slate-600">Vendor API Key</dt>
                    <dd className="mt-1 font-mono text-xs">{'•'.repeat(20)}</dd>
                  </div>
                  <div>
                    <dt className="font-medium text-slate-600">User API Key</dt>
                    <dd className="mt-1 font-mono text-xs">{'•'.repeat(20)}</dd>
                  </div>
                  <div>
                    <dt className="font-medium text-slate-600">Created</dt>
                    <dd className="mt-1">{new Date(key.created_at).toLocaleDateString()}</dd>
                  </div>
                  <div>
                    <dt className="font-medium text-slate-600">Last Updated</dt>
                    <dd className="mt-1">{new Date(key.updated_at).toLocaleDateString()}</dd>
                  </div>
                </dl>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingKey ? 'Edit' : 'Add'} Metrc API Key
            </DialogTitle>
            <DialogDescription>
              Enter your Metrc API credentials. Credentials will be validated before saving.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="site">Site *</Label>
              <Select
                value={formData.site_id}
                onValueChange={(value) => setFormData({ ...formData, site_id: value })}
              >
                <SelectTrigger id="site">
                  <SelectValue placeholder="Select a site" />
                </SelectTrigger>
                <SelectContent>
                  {sites.map((site) => (
                    <SelectItem key={site.id} value={site.id}>
                      {site.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="state">State *</Label>
              <Select
                value={formData.state_code}
                onValueChange={(value) => setFormData({ ...formData, state_code: value })}
              >
                <SelectTrigger id="state">
                  <SelectValue placeholder="Select state" />
                </SelectTrigger>
                <SelectContent>
                  {US_STATES.map((state) => (
                    <SelectItem key={state.code} value={state.code}>
                      {state.name} ({state.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="facility_license">Facility License Number *</Label>
              <Input
                id="facility_license"
                value={formData.facility_license_number}
                onChange={(e) => setFormData({ ...formData, facility_license_number: e.target.value })}
                placeholder="e.g., 123-ABC"
              />
            </div>

            <div>
              <Label htmlFor="vendor_key">Vendor API Key *</Label>
              <Input
                id="vendor_key"
                type="password"
                value={formData.vendor_api_key}
                onChange={(e) => setFormData({ ...formData, vendor_api_key: e.target.value })}
                placeholder="Enter vendor API key"
              />
            </div>

            <div>
              <Label htmlFor="user_key">User API Key *</Label>
              <Input
                id="user_key"
                type="password"
                value={formData.user_api_key}
                onChange={(e) => setFormData({ ...formData, user_api_key: e.target.value })}
                placeholder="Enter user API key"
              />
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="sandbox"
                checked={formData.is_sandbox}
                onCheckedChange={(checked) => setFormData({ ...formData, is_sandbox: checked })}
              />
              <Label htmlFor="sandbox" className="cursor-pointer">
                Use Sandbox Environment (for testing)
              </Label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={validating}>
              Cancel
            </Button>
            <Button onClick={handleValidateAndSave} disabled={validating}>
              {validating ? 'Validating...' : editingKey ? 'Update' : 'Add'} API Key
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
