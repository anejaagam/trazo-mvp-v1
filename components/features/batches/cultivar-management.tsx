'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Plus, Leaf, Sprout, Link2, Unlink, RefreshCw, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react'
import { getCultivarsClient, createCultivarClient, updateCultivarClient, getCultivarUsageStatsClient, deleteCultivarClient, type CultivarUsageStats } from '@/lib/supabase/queries/cultivars-client'
import type { Cultivar } from '@/types/batch'
import type { InsertCultivar } from '@/lib/supabase/queries/cultivars'
import { toast } from 'sonner'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Textarea } from '@/components/ui/textarea'
import type { PlantType } from '@/lib/jurisdiction/types'
import { useSite } from '@/hooks/use-site'

interface CachedStrain {
  id: string
  metrc_strain_id: number
  name: string
  testing_status: string | null
  thc_level: number | null
  cbd_level: number | null
  is_linked_to_cultivar: boolean
}

interface CultivarManagementProps {
  organizationId: string
  userId: string
  isOpen: boolean
  onClose: () => void
  plantType: PlantType
  siteId?: string
}

const cultivarSchema = z.object({
  name: z.string().min(3, 'Name required'),
  domainType: z.enum(['cannabis', 'produce']),
  strainType: z.string().optional().nullable(),
  genetics: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
})

type CultivarFormValues = z.infer<typeof cultivarSchema>

export function CultivarManagement({ organizationId, userId, isOpen, onClose, plantType, siteId: propSiteId }: CultivarManagementProps) {
  const { siteId: contextSiteId } = useSite()
  const siteId = propSiteId || contextSiteId

  const [cultivars, setCultivars] = useState<Cultivar[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(false)
  const [selectedCultivar, setSelectedCultivar] = useState<Cultivar | null>(null)
  const [usageMap, setUsageMap] = useState<Record<string, CultivarUsageStats>>({})
  const [showForm, setShowForm] = useState(false)

  // Metrc strain linking state
  const [cachedStrains, setCachedStrains] = useState<CachedStrain[]>([])
  const [loadingStrains, setLoadingStrains] = useState(false)
  const [syncingStrains, setSyncingStrains] = useState(false)
  const [linkingCultivar, setLinkingCultivar] = useState<string | null>(null)
  const [selectedStrainId, setSelectedStrainId] = useState<string>('')

  const initialFormValues: CultivarFormValues = {
    name: '',
    domainType: plantType,
    strainType: '',
    genetics: '',
    notes: '',
  }

  const form = useForm<CultivarFormValues>({
    resolver: zodResolver(cultivarSchema),
    defaultValues: initialFormValues,
  })

  useEffect(() => {
    form.setValue('domainType', plantType, { shouldDirty: false })
  }, [form, plantType])

  // Load cached strains from Metrc
  const loadStrains = useCallback(async () => {
    if (!siteId || plantType !== 'cannabis') return
    setLoadingStrains(true)
    try {
      const response = await fetch(`/api/compliance/metrc/strains?site_id=${siteId}`)
      if (response.ok) {
        const data = await response.json()
        setCachedStrains(data.strains || [])
      }
    } catch (error) {
      console.error('Error loading strains:', error)
    } finally {
      setLoadingStrains(false)
    }
  }, [siteId, plantType])

  // Sync strains from Metrc
  const syncStrains = async () => {
    if (!siteId) {
      toast.error('No site selected')
      return
    }
    setSyncingStrains(true)
    try {
      const response = await fetch('/api/compliance/metrc/strains/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ siteId }),
      })
      const data = await response.json()
      if (response.ok && data.success) {
        toast.success(`Synced ${data.data.synced} strains from Metrc`)
        await loadStrains()
      } else {
        toast.error(data.error || 'Failed to sync strains')
      }
    } catch (error) {
      console.error('Error syncing strains:', error)
      toast.error('Failed to sync strains')
    } finally {
      setSyncingStrains(false)
    }
  }

  // Link cultivar to Metrc strain
  const linkCultivarToStrain = async (cultivarId: string, metrcStrainId: number) => {
    if (!siteId) {
      toast.error('No site selected')
      return
    }
    setLinkingCultivar(cultivarId)
    try {
      const response = await fetch(`/api/cultivars/${cultivarId}/link-strain`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ metrcStrainId, siteId }),
      })
      const data = await response.json()
      if (response.ok && data.success) {
        toast.success(`Linked to Metrc strain: ${data.linked_strain.name}`)
        await loadCultivars()
        await loadStrains()
      } else {
        toast.error(data.error || 'Failed to link cultivar')
      }
    } catch (error) {
      console.error('Error linking cultivar:', error)
      toast.error('Failed to link cultivar')
    } finally {
      setLinkingCultivar(null)
      setSelectedStrainId('')
    }
  }

  // Unlink cultivar from Metrc strain
  const unlinkCultivar = async (cultivarId: string) => {
    setLinkingCultivar(cultivarId)
    try {
      const response = await fetch(`/api/cultivars/${cultivarId}/link-strain`, {
        method: 'DELETE',
      })
      const data = await response.json()
      if (response.ok && data.success) {
        toast.success('Unlinked from Metrc strain')
        await loadCultivars()
        await loadStrains()
      } else {
        toast.error(data.error || 'Failed to unlink cultivar')
      }
    } catch (error) {
      console.error('Error unlinking cultivar:', error)
      toast.error('Failed to unlink cultivar')
    } finally {
      setLinkingCultivar(null)
    }
  }

  const loadCultivars = useCallback(async () => {
    setLoading(true)
    const { data, error } = await getCultivarsClient(organizationId, {
      domain_type: plantType,
      is_active: true,
    })
    if (error) {
      toast.error('Unable to load cultivars')
    } else {
      setCultivars(data ?? [])
    }
    setLoading(false)
  }, [organizationId, plantType])

  useEffect(() => {
    if (isOpen) {
      loadCultivars()
      if (plantType === 'cannabis') {
        loadStrains()
      }
    }
  }, [isOpen, loadCultivars, loadStrains, plantType])

  const filteredCultivars = useMemo(() => {
    const term = search.toLowerCase()
    return cultivars.filter((cultivar) => cultivar.name.toLowerCase().includes(term))
  }, [cultivars, search])

  const handleSave = async (values: CultivarFormValues) => {
    try {
      setLoading(true)
      if (selectedCultivar) {
        await updateCultivarClient(selectedCultivar.id, {
          name: values.name,
          strain_type: plantType === 'cannabis' ? values.strainType || null : undefined,
          genetics: values.genetics || null,
          harvest_notes: values.notes || null,
        })
        toast.success('Cultivar updated')
      } else {
        const newCultivar: InsertCultivar = {
          organization_id: organizationId,
          name: values.name,
          strain_type: plantType === 'cannabis' ? values.strainType || 'hybrid' : undefined,
          genetics: values.genetics || null,
          harvest_notes: values.notes || null,
          created_by: userId,
        }
        await createCultivarClient(newCultivar)
        toast.success('Cultivar created')
      }
      setSelectedCultivar(null)
      setShowForm(false)
      form.reset(initialFormValues)
      await loadCultivars()
    } catch (error) {
      console.error(error)
      toast.error('Unable to save cultivar')
    } finally {
      setLoading(false)
    }
  }

  const startCreate = () => {
    setSelectedCultivar(null)
    setShowForm(true)
    form.reset(initialFormValues)
  }

  const handleEdit = (cultivar: Cultivar) => {
    setSelectedCultivar(cultivar)
    setShowForm(true)
    form.reset({
      name: cultivar.name,
      domainType: plantType,
      strainType: cultivar.strain_type && cultivar.strain_type !== 'produce' ? cultivar.strain_type : '',
      genetics: cultivar.genetics ?? '',
      notes: cultivar.harvest_notes ?? '',
    })
  }

  const handleUsage = async (cultivarId: string) => {
    if (usageMap[cultivarId]) return
    const { data, error } = await getCultivarUsageStatsClient(cultivarId)
    if (error) {
      toast.error('Unable to load usage stats')
      return
    }
    setUsageMap((prev) => ({ ...prev, [cultivarId]: data! }))
  }

  const handleDelete = async (cultivar: Cultivar) => {
    if (!window.confirm('Archive this cultivar?')) return
    const { error } = await deleteCultivarClient(cultivar.id)
    if (error) {
      toast.error('Unable to archive cultivar')
      return
    }
    toast.success('Cultivar archived')
    if (selectedCultivar?.id === cultivar.id) {
      setShowForm(false)
      setSelectedCultivar(null)
      form.reset(initialFormValues)
    }
    loadCultivars()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Cultivar management</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <Input
              placeholder="Search cultivars"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="md:w-1/3"
            />
            <div className="flex gap-2">
              {plantType === 'cannabis' && siteId && (
                <Button
                  variant="outline"
                  onClick={syncStrains}
                  disabled={syncingStrains}
                >
                  {syncingStrains ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="mr-2 h-4 w-4" />
                  )}
                  {syncingStrains ? 'Syncing...' : 'Sync Strains'}
                </Button>
              )}
              <Button variant="outline" onClick={startCreate}>
                <Plus className="mr-2 h-4 w-4" />
                Add cultivar
              </Button>
            </div>
          </div>

          {/* Strain sync status */}
          {plantType === 'cannabis' && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              {loadingStrains ? (
                <span className="flex items-center gap-1">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Loading strains...
                </span>
              ) : cachedStrains.length > 0 ? (
                <span>{cachedStrains.length} Metrc strains available for linking</span>
              ) : (
                <span className="text-yellow-600">No Metrc strains cached. Click &quot;Sync Strains&quot; to fetch from Metrc.</span>
              )}
            </div>
          )}

          {loading && <p className="text-sm text-muted-foreground">Loading cultivars…</p>}

          <div className="grid gap-4 md:grid-cols-2">
            {filteredCultivars.map((cultivar) => {
              const usage = usageMap[cultivar.id]
              const domain = cultivar.strain_type && cultivar.strain_type !== 'produce' ? 'cannabis' : 'produce'
              const isLinkedToMetrc = !!cultivar.metrc_strain_id
              const linkedStrain = cachedStrains.find(s => s.metrc_strain_id === cultivar.metrc_strain_id)

              return (
                <Card key={cultivar.id}>
                  <CardHeader className="flex items-start justify-between space-y-0">
                    <div>
                      <CardTitle className="text-base">{cultivar.name}</CardTitle>
                      <CardDescription>{cultivar.genetics || 'No genetics info'}</CardDescription>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <Badge variant="outline" className="gap-1">
                        {domain === 'cannabis' ? <Leaf className="h-3 w-3" /> : <Sprout className="h-3 w-3" />}
                        {domain === 'cannabis' ? 'Cannabis' : 'Produce'}
                      </Badge>
                      {domain === 'cannabis' && (
                        <Badge
                          variant={isLinkedToMetrc ? 'default' : 'secondary'}
                          className={`gap-1 text-xs ${isLinkedToMetrc ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}
                        >
                          {isLinkedToMetrc ? (
                            <>
                              <CheckCircle2 className="h-3 w-3" />
                              Metrc Linked
                            </>
                          ) : (
                            <>
                              <AlertCircle className="h-3 w-3" />
                              Not Linked
                            </>
                          )}
                        </Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm">
                    <p className="text-muted-foreground">{cultivar.harvest_notes || 'No notes'}</p>

                    {/* Metrc Strain Info */}
                    {domain === 'cannabis' && isLinkedToMetrc && linkedStrain && (
                      <div className="rounded-md border border-green-200 bg-green-50 p-2 text-xs">
                        <p className="font-medium text-green-800">Metrc Strain: {linkedStrain.name}</p>
                        {linkedStrain.thc_level && <p className="text-green-700">THC: {linkedStrain.thc_level}%</p>}
                        {linkedStrain.cbd_level && <p className="text-green-700">CBD: {linkedStrain.cbd_level}%</p>}
                      </div>
                    )}

                    {/* Metrc Strain Linking - Show for cannabis cultivars */}
                    {domain === 'cannabis' && !isLinkedToMetrc && cachedStrains.length > 0 && (
                      <div className="rounded-md border p-2">
                        <p className="mb-2 text-xs font-medium">Link to Metrc Strain:</p>
                        <div className="flex gap-2">
                          <Select
                            value={linkingCultivar === cultivar.id ? selectedStrainId : ''}
                            onValueChange={(value) => {
                              setLinkingCultivar(cultivar.id)
                              setSelectedStrainId(value)
                            }}
                          >
                            <SelectTrigger className="h-8 text-xs">
                              <SelectValue placeholder="Select strain..." />
                            </SelectTrigger>
                            <SelectContent>
                              {cachedStrains.map((strain) => (
                                <SelectItem key={strain.metrc_strain_id} value={String(strain.metrc_strain_id)}>
                                  {strain.name}
                                  {strain.is_linked_to_cultivar && ' (already linked)'}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8"
                            disabled={linkingCultivar === cultivar.id && !selectedStrainId}
                            onClick={() => {
                              if (selectedStrainId && linkingCultivar === cultivar.id) {
                                linkCultivarToStrain(cultivar.id, parseInt(selectedStrainId))
                              }
                            }}
                          >
                            {linkingCultivar === cultivar.id && selectedStrainId ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <Link2 className="h-3 w-3" />
                            )}
                          </Button>
                        </div>
                      </div>
                    )}

                    {usage && (
                      <div className="rounded-md border p-2 text-xs">
                        <p>Total batches: {usage.total_batches}</p>
                        <p>Active: {usage.active_batches}</p>
                        <p>Completed: {usage.completed_batches}</p>
                      </div>
                    )}
                    <div className="flex flex-wrap gap-2">
                      <Button size="sm" variant="ghost" onClick={() => handleEdit(cultivar)}>
                        Edit
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => handleUsage(cultivar.id)}>
                        Usage
                      </Button>
                      {domain === 'cannabis' && isLinkedToMetrc && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => unlinkCultivar(cultivar.id)}
                          disabled={linkingCultivar === cultivar.id}
                        >
                          {linkingCultivar === cultivar.id ? (
                            <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                          ) : (
                            <Unlink className="mr-1 h-3 w-3" />
                          )}
                          Unlink
                        </Button>
                      )}
                      <Button size="sm" variant="ghost" className="text-destructive" onClick={() => handleDelete(cultivar)}>
                        Archive
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
            {!filteredCultivars.length && !loading && (
              <Card className="col-span-2">
                <CardHeader>
                  <CardTitle>No cultivars</CardTitle>
                  <CardDescription>Use the Add Cultivar button to seed your library.</CardDescription>
                </CardHeader>
              </Card>
            )}
          </div>

          {showForm && (
            <div className="rounded-md border p-4">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(handleSave)} className="space-y-4">
                  <div className="grid gap-4">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Name</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <FormField
                    control={form.control}
                    name="strainType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Strain / category</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            value={field.value ?? ''}
                            onChange={(event) => field.onChange(event.target.value)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="genetics"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Genetics</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            value={field.value ?? ''}
                            onChange={(event) => field.onChange(event.target.value)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Notes</FormLabel>
                        <FormControl>
                          <Textarea
                            rows={3}
                            {...field}
                            value={field.value ?? ''}
                            onChange={(event) => field.onChange(event.target.value)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="flex justify-end gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setSelectedCultivar(null)
                        setShowForm(false)
                        form.reset(initialFormValues)
                      }}
                      className="border-red-200 text-red-700 hover:bg-red-50 hover:text-red-800"
                    >
                      Cancel
                    </Button>
                    <Button type="submit" disabled={loading}>
                      {selectedCultivar ? 'Save changes' : 'Create cultivar'}
                    </Button>
                  </div>
                </form>
              </Form>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
