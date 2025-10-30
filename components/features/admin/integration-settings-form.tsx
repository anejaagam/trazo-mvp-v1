'use client'

/**
 * Integration Settings Form
 * 
 * Form for configuring TagoIO and other third-party integrations
 */

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { CheckCircle2, XCircle, Loader2, Eye, EyeOff } from 'lucide-react'
import {
  getIntegrationSetting,
  upsertIntegrationSetting,
  validateTagoIOCredentials,
  updateIntegrationValidation,
  type IntegrationSetting,
} from '@/lib/supabase/queries/integration-settings'

interface IntegrationSettingsFormProps {
  organizationId: string
}

export function IntegrationSettingsForm({ organizationId }: IntegrationSettingsFormProps) {
  const [tagoioToken, setTagoioToken] = useState('')
  const [showToken, setShowToken] = useState(false)
  const [loading, setLoading] = useState(false)
  const [validating, setValidating] = useState(false)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [currentSetting, setCurrentSetting] = useState<IntegrationSetting | null>(null)
  const [deviceName, setDeviceName] = useState<string | null>(null)

  // Load existing settings
  useEffect(() => {
    async function loadSettings() {
      setLoading(true)
      try {
        const { data, error } = await getIntegrationSetting(organizationId, 'tagoio')
        if (error) {
          if (error.message.includes('JSON object requested, multiple')) {
            // Multiple records found - show error
            setMessage({
              type: 'error',
              text: 'Multiple TagoIO configurations found. Please contact support.',
            })
          }
          // No existing config is OK
          return
        }
        if (data) {
          setCurrentSetting(data)
          // Don't show the actual token for security
          setTagoioToken(data.api_token ? '••••••••••••••••' : '')
          if (data.is_valid && data.config?.deviceName) {
            setDeviceName(data.config.deviceName as string)
          }
        }
      } catch (error) {
        console.error('Failed to load settings:', error)
        setMessage({
          type: 'error',
          text: 'Failed to load integration settings',
        })
      } finally {
        setLoading(false)
      }
    }

    loadSettings()
  }, [organizationId])

  // Validate credentials
  async function handleValidate() {
    if (!tagoioToken || tagoioToken === '••••••••••••••••') {
      setMessage({ type: 'error', text: 'Please enter a device token' })
      return
    }

    setValidating(true)
    setMessage(null)

    try {
      const { data } = await validateTagoIOCredentials(tagoioToken)

      if (data?.isValid) {
        setMessage({
          type: 'success',
          text: `Successfully connected to device: ${data.deviceName || 'Unknown'}`,
        })
        setDeviceName(data.deviceName || null)
      } else {
        setMessage({
          type: 'error',
          text: data?.error || 'Validation failed',
        })
        setDeviceName(null)
      }
    } catch (err) {
      console.error('Validation error:', err)
      setMessage({
        type: 'error',
        text: 'Failed to validate credentials',
      })
      setDeviceName(null)
    } finally {
      setValidating(false)
    }
  }

  // Save settings
  async function handleSave() {
    if (!tagoioToken || tagoioToken === '••••••••••••••••') {
      setMessage({ type: 'error', text: 'Please enter a device token' })
      return
    }

    setSaving(true)
    setMessage(null)

    try {
      // Validate first
      const { data: validationResult } = await validateTagoIOCredentials(tagoioToken)

      if (!validationResult?.isValid) {
        setMessage({
          type: 'error',
          text: validationResult?.error || 'Cannot save invalid credentials',
        })
        setSaving(false)
        return
      }

      // Save to database
      const { data, error } = await upsertIntegrationSetting({
        organization_id: organizationId,
        integration_type: 'tagoio',
        api_token: tagoioToken,
        config: {
          deviceId: validationResult.deviceId,
          deviceName: validationResult.deviceName,
        },
        is_active: true,
      })

      if (error) {
        throw error
      }

      // Update validation status
      if (data) {
        await updateIntegrationValidation(data.id, true, null)
        setCurrentSetting(data)
      }

      setMessage({
        type: 'success',
        text: 'TagoIO integration saved successfully!',
      })
      setDeviceName(validationResult.deviceName || null)
    } catch (err) {
      console.error('Failed to save settings:', err)
      setMessage({
        type: 'error',
        text: 'Failed to save integration settings',
      })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>TagoIO Integration</CardTitle>
          <CardDescription>
            Connect your TagoIO device to automatically sync environmental telemetry data
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {message && (
            <Alert variant={message.type === 'error' ? 'destructive' : 'default'}>
              {message.type === 'success' ? (
                <CheckCircle2 className="h-4 w-4" />
              ) : (
                <XCircle className="h-4 w-4" />
              )}
              <AlertDescription>{message.text}</AlertDescription>
            </Alert>
          )}

          {currentSetting && deviceName && (
            <Alert>
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertDescription>
                <strong>Connected:</strong> {deviceName}
                {currentSetting.last_validated_at && (
                  <span className="text-xs text-muted-foreground ml-2">
                    (Last validated:{' '}
                    {new Date(currentSetting.last_validated_at).toLocaleDateString()})
                  </span>
                )}
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="tagoio-token">Device Token</Label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Input
                  id="tagoio-token"
                  type={showToken ? 'text' : 'password'}
                  value={tagoioToken}
                  onChange={(e) => setTagoioToken(e.target.value)}
                  placeholder="Enter your TagoIO device token"
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full px-3"
                  onClick={() => setShowToken(!showToken)}
                >
                  {showToken ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              Find your device token in the TagoIO dashboard under Device Settings
            </p>
          </div>

          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleValidate}
              disabled={validating || !tagoioToken || tagoioToken === '••••••••••••••••'}
            >
              {validating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Test Connection
            </Button>
            <Button
              type="button"
              onClick={handleSave}
              disabled={saving || !tagoioToken || tagoioToken === '••••••••••••••••'}
            >
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Configuration
            </Button>
          </div>

          <div className="rounded-lg bg-muted p-4 text-sm">
            <h4 className="font-medium mb-2">How to get your TagoIO token:</h4>
            <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
              <li>Log in to your TagoIO account</li>
              <li>Navigate to Devices</li>
              <li>Select your pod device</li>
              <li>Click on &ldquo;Tokens&rdquo; tab</li>
              <li>Copy the Device-Token value</li>
              <li>Paste it above and click &ldquo;Test Connection&rdquo;</li>
            </ol>
          </div>
        </CardContent>
      </Card>

      {currentSetting && (
        <Card>
          <CardHeader>
            <CardTitle>Integration Status</CardTitle>
            <CardDescription>Current configuration details</CardDescription>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <dt className="text-sm font-medium text-muted-foreground">Status</dt>
                <dd className="mt-1 text-sm">
                  {currentSetting.is_valid ? (
                    <span className="inline-flex items-center gap-1 text-green-600">
                      <CheckCircle2 className="h-4 w-4" />
                      Valid
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-red-600">
                      <XCircle className="h-4 w-4" />
                      Invalid
                    </span>
                  )}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-muted-foreground">Created</dt>
                <dd className="mt-1 text-sm">
                  {new Date(currentSetting.created_at).toLocaleDateString()}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-muted-foreground">Last Updated</dt>
                <dd className="mt-1 text-sm">
                  {new Date(currentSetting.updated_at).toLocaleDateString()}
                </dd>
              </div>
              {currentSetting.last_validated_at && (
                <div>
                  <dt className="text-sm font-medium text-muted-foreground">Last Validated</dt>
                  <dd className="mt-1 text-sm">
                    {new Date(currentSetting.last_validated_at).toLocaleDateString()}
                  </dd>
                </div>
              )}
            </dl>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
