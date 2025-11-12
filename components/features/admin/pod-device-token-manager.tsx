'use client'

/**
 * Pod Device Token Manager
 * 
 * Component for managing TagoIO device tokens for individual pods
 * Allows org admins and site managers to map pods to TagoIO devices
 */

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { 
  CheckCircle2, 
  XCircle, 
  Loader2, 
  Eye, 
  EyeOff, 
  Plus, 
  Pencil, 
  Trash2,
  AlertTriangle
} from 'lucide-react'
import { 
  getOrganizationPods, 
  getOrganizationRooms,
  updatePodDeviceId, 
  removePodDeviceId,
  validateDeviceToken,
  createPodWithToken
} from '@/app/actions/pod-device-tokens'
import type { PodWithSiteInfo } from '@/lib/supabase/queries/pods'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface RoomOption {
  id: string
  name: string
  site_id: string
  site_name: string
  room_type: string
  capacity_pods?: number
  pod_count?: number
}

export function PodDeviceTokenManager() {
  const [pods, setPods] = useState<PodWithSiteInfo[]>([])
  const [rooms, setRooms] = useState<RoomOption[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [validating, setValidating] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  
  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false)
  const [dialogMode, setDialogMode] = useState<'create' | 'edit'>('edit')
  const [selectedPod, setSelectedPod] = useState<PodWithSiteInfo | null>(null)
  const [podName, setPodName] = useState('')
  const [deviceToken, setDeviceToken] = useState('')
  const [selectedRoomId, setSelectedRoomId] = useState('')
  const [showToken, setShowToken] = useState(false)
  const [validatedDeviceInfo, setValidatedDeviceInfo] = useState<{
    deviceId: string
    deviceName: string
  } | null>(null)

  // Load pods on mount
  useEffect(() => {
    loadPods()
    loadRooms()
  }, [])

  async function loadPods() {
    setLoading(true)
    setMessage(null)
    try {
      const result = await getOrganizationPods()
      if (result.success && result.data) {
        setPods(result.data)
      } else {
        setMessage({
          type: 'error',
          text: result.error || 'Failed to load pods',
        })
      }
    } catch (error) {
      console.error('Failed to load pods:', error)
      setMessage({
        type: 'error',
        text: 'Failed to load pods',
      })
    } finally {
      setLoading(false)
    }
  }

  async function loadRooms() {
    try {
      const result = await getOrganizationRooms()
      if (result.success && result.data) {
        setRooms(result.data)
      } else {
        console.error('Failed to load rooms:', result.error)
      }
    } catch (error) {
      console.error('Failed to load rooms:', error)
    }
  }

  function openCreateDialog() {
    setDialogMode('create')
    setSelectedPod(null)
    setPodName('')
    setDeviceToken('')
    setSelectedRoomId('')
    setShowToken(false)
    setValidatedDeviceInfo(null)
    setMessage(null)
    setDialogOpen(true)
  }

  function openEditDialog(pod: PodWithSiteInfo) {
    setDialogMode('edit')
    setSelectedPod(pod)
    setPodName(pod.name)
    setDeviceToken('')
    setShowToken(false)
    setValidatedDeviceInfo(null)
    setMessage(null)
    setDialogOpen(true)
  }

  function closeDialog() {
    setDialogOpen(false)
    setDialogMode('edit')
    setSelectedPod(null)
    setPodName('')
    setDeviceToken('')
    setSelectedRoomId('')
    setShowToken(false)
    setValidatedDeviceInfo(null)
    setMessage(null)
  }

  async function handleValidate() {
    if (!deviceToken) {
      setMessage({ type: 'error', text: 'Please enter a device token' })
      return
    }

    setValidating(true)
    setMessage(null)
    setValidatedDeviceInfo(null)

    try {
      const result = await validateDeviceToken(deviceToken)

      if (result.success && result.data) {
        setMessage({
          type: 'success',
          text: `Successfully connected to device: ${result.data.deviceName}`,
        })
        setValidatedDeviceInfo(result.data)
      } else {
        setMessage({
          type: 'error',
          text: result.error || 'Validation failed',
        })
        setValidatedDeviceInfo(null)
      }
    } catch (err) {
      console.error('Validation error:', err)
      setMessage({
        type: 'error',
        text: 'Failed to validate device token',
      })
      setValidatedDeviceInfo(null)
    } finally {
      setValidating(false)
    }
  }

  async function handleSave() {
    if (dialogMode === 'create') {
      // Create new pod
      if (!podName || !deviceToken) {
        setMessage({ type: 'error', text: 'Please enter pod name and device token' })
        return
      }

      if (!selectedRoomId) {
        setMessage({ type: 'error', text: 'Please select a room for this pod' })
        return
      }

      setSaving(true)
      setMessage(null)

      try {
        const result = await createPodWithToken(podName, deviceToken, selectedRoomId)

        if (result.success && result.data) {
          setMessage({
            type: 'success',
            text: `Pod "${result.data.podName}" created successfully with equipment controls!`,
          })
          
          // Reload pods list
          await loadPods()

          // Close dialog after short delay
          setTimeout(() => {
            closeDialog()
          }, 1500)
        } else {
          setMessage({
            type: 'error',
            text: result.error || 'Failed to create pod',
          })
        }
      } catch (err) {
        console.error('Failed to create pod:', err)
        setMessage({
          type: 'error',
          text: 'Failed to create pod',
        })
      } finally {
        setSaving(false)
      }
    } else {
      // Update existing pod
      if (!selectedPod || !deviceToken) {
        setMessage({ type: 'error', text: 'Please enter a device token' })
        return
      }

      setSaving(true)
      setMessage(null)

      try {
        const result = await updatePodDeviceId(selectedPod.id, deviceToken)

        if (result.success && result.data) {
          setMessage({
            type: 'success',
            text: `Device token saved for ${selectedPod.name}!`,
          })
          
          // Update local pods list
          setPods(prevPods =>
            prevPods.map(p =>
              p.id === selectedPod.id
                ? { ...p, tagoio_device_id: result.data!.deviceId, tagoio_device_token: deviceToken }
                : p
            )
          )

          // Close dialog after short delay
          setTimeout(() => {
            closeDialog()
          }, 1500)
        } else {
          setMessage({
            type: 'error',
            text: result.error || 'Failed to save device token',
          })
        }
      } catch (err) {
        console.error('Failed to save device token:', err)
        setMessage({
          type: 'error',
          text: 'Failed to save device token',
        })
      } finally {
        setSaving(false)
      }
    }
  }

  async function handleRemove(pod: PodWithSiteInfo) {
    if (!confirm(`Remove device token from ${pod.name}?`)) {
      return
    }

    try {
      const result = await removePodDeviceId(pod.id)

      if (result.success) {
        setMessage({
          type: 'success',
          text: `Device token removed from ${pod.name}`,
        })
        
        // Update local pods list
        setPods(prevPods =>
          prevPods.map(p =>
            p.id === pod.id ? { ...p, tagoio_device_id: null, tagoio_device_token: null } : p
          )
        )
      } else {
        setMessage({
          type: 'error',
          text: result.error || 'Failed to remove device token',
        })
      }
    } catch (err) {
      console.error('Failed to remove device token:', err)
      setMessage({
        type: 'error',
        text: 'Failed to remove device token',
      })
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

  const configuredCount = pods.filter(p => p.tagoio_device_token).length
  const totalCount = pods.length

  return (
    <>
      <Card>
        <CardHeader>
          {rooms.length === 0 && (
              <Alert className="flex-1 mr-4 mb-4">
                <AlertTriangle className="h-4 w-1 text-amber-600" />
                <AlertDescription className="flex items-start gap-2">
                  <span>No rooms available. Create a room in the{' '}
                  <a 
                  href="/dashboard/admin/organization" 
                  className="font-medium underline hover:no-underline"
                  target="_blank"
                  rel="noopener noreferrer"
                  >
                  Organization page
                  </a>
                  {' '}before adding pods.</span>
                </AlertDescription>
              </Alert>
            )}
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Pod Device Tokens</CardTitle>
              <CardDescription>
                Map your pods to TagoIO devices for automated telemetry collection
              </CardDescription>
            </div>
            <Badge variant={configuredCount === totalCount ? 'default' : 'secondary'}>
              {configuredCount} / {totalCount} Configured
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
           
          <div className="flex justify-end items-center mb-4">
           
            <Button onClick={openCreateDialog} disabled={rooms.length === 0}>
              <Plus className="h-4 w-4 mr-2" />
              Create New Pod
            </Button>
          </div>

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

          {pods.length === 0 ? (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                No pods configured yet. Click &quot;Create New Pod&quot; to add your first pod with a device token.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Pod Name</TableHead>
                    <TableHead>Device Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pods.map((pod) => (
                    <TableRow key={pod.id}>
                      <TableCell className="font-medium">{pod.name}</TableCell>
                      <TableCell>
                        {pod.tagoio_device_token ? (
                          <Badge variant="default" className="gap-1">
                            <CheckCircle2 className="h-3 w-3" />
                            Configured
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="gap-1">
                            <XCircle className="h-3 w-3" />
                            Not Configured
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openEditDialog(pod)}
                          >
                            {pod.tagoio_device_token ? (
                              <>
                                <Pencil className="h-3 w-3 mr-1" />
                                Edit Token
                              </>
                            ) : (
                              <>
                                <Plus className="h-3 w-3 mr-1" />
                                Add Token
                              </>
                            )}
                          </Button>
                          {pod.tagoio_device_token && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleRemove(pod)}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          <div className="rounded-lg bg-muted p-4 text-sm">
            <h4 className="font-medium mb-2">Quick Start:</h4>
            <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
              <li>Click &ldquo;Create New Pod&rdquo; above</li>
              <li>Enter a name for your pod</li>
              <li>Get your device token from TagoIO (Devices → Select Device → Tokens tab)</li>
              <li>Paste the token and click &ldquo;Test Connection&rdquo;</li>
              <li>Click &ldquo;Save&rdquo; to start collecting telemetry data</li>
            </ol>
          </div>
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {dialogMode === 'create' ? 'Create New Pod' : selectedPod?.tagoio_device_id ? 'Update Device Token' : 'Add Device Token'}
            </DialogTitle>
            <DialogDescription>
              {dialogMode === 'create' 
                ? 'Enter a name for your pod and configure its TagoIO device token' 
                : selectedPod?.name && `Configure TagoIO device token for ${selectedPod.name}`}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
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

            {dialogMode === 'create' && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="pod-name">Pod Name</Label>
                  <Input
                    id="pod-name"
                    type="text"
                    value={podName}
                    onChange={(e) => setPodName(e.target.value)}
                    placeholder="e.g., Pod A, Cultivation Unit 1"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="room-select">Room Assignment</Label>
                  {rooms.length === 0 ? (
                    <Alert>
                      <AlertTriangle className="h-4 w-4 text-amber-600" />
                      <AlertDescription>
                        No rooms available. Please create a room first in the{' '}
                        <a 
                          href="/dashboard/admin/organization" 
                          className="font-medium underline hover:no-underline"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          Organization page
                        </a>
                        .
                      </AlertDescription>
                    </Alert>
                  ) : (
                    <>
                      <Select value={selectedRoomId} onValueChange={setSelectedRoomId}>
                        <SelectTrigger id="room-select">
                          <SelectValue placeholder="Select a room for this pod" />
                        </SelectTrigger>
                        <SelectContent>
                          {rooms.map((room) => (
                            <SelectItem 
                              key={room.id} 
                              value={room.id}
                              disabled={room.capacity_pods !== undefined && room.capacity_pods !== null && room.pod_count !== undefined && room.pod_count >= room.capacity_pods}
                            >
                              <div className="flex flex-col">
                                <span>{room.site_name} - {room.name}</span>
                                <span className="text-xs text-muted-foreground">
                                  {room.room_type} • {room.pod_count || 0}/{room.capacity_pods || '∞'} pods
                                  {room.capacity_pods && room.pod_count !== undefined && room.pod_count >= room.capacity_pods && ' (Full)'}
                                </span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground">
                        Choose which room this pod will be assigned to
                      </p>
                    </>
                  )}
                </div>
              </>
            )}

            <div className="space-y-2">
              <Label htmlFor="device-token">Device Token</Label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Input
                    id="device-token"
                    type={showToken ? 'text' : 'password'}
                    value={deviceToken}
                    onChange={(e) => setDeviceToken(e.target.value)}
                    placeholder="Enter TagoIO device token"
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
              <p className="text-xs text-muted-foreground">
                Get this from your TagoIO device settings under the Tokens tab
              </p>
            </div>

            {validatedDeviceInfo && (
              <Alert>
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <AlertDescription>
                  <strong>Device:</strong> {validatedDeviceInfo.deviceName}
                  <br />
                  <span className="text-xs text-muted-foreground">
                    ID: {validatedDeviceInfo.deviceId}
                  </span>
                </AlertDescription>
              </Alert>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={closeDialog} disabled={saving || validating}>
              Cancel
            </Button>
            <Button
              variant="outline"
              onClick={handleValidate}
              disabled={validating || !deviceToken || saving}
            >
              {validating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Test Connection
            </Button>
            <Button onClick={handleSave} disabled={saving || !deviceToken}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
