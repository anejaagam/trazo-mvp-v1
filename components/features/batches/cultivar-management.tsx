'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Plus, Leaf, Sprout } from 'lucide-react'
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

interface CultivarManagementProps {
  organizationId: string
  userId: string
  isOpen: boolean
  onClose: () => void
  plantType: PlantType
}

const cultivarSchema = z.object({
  name: z.string().min(3, 'Name required'),
  domainType: z.enum(['cannabis', 'produce']),
  strainType: z.string().optional().nullable(),
  genetics: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
})

type CultivarFormValues = z.infer<typeof cultivarSchema>

export function CultivarManagement({ organizationId, userId, isOpen, onClose, plantType }: CultivarManagementProps) {
  const [cultivars, setCultivars] = useState<Cultivar[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(false)
  const [selectedCultivar, setSelectedCultivar] = useState<Cultivar | null>(null)
  const [usageMap, setUsageMap] = useState<Record<string, CultivarUsageStats>>({})
  const [showForm, setShowForm] = useState(false)

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
    }
  }, [isOpen, loadCultivars])

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
              className="md:w-1/2"
            />
            <Button variant="outline" onClick={startCreate}>
              <Plus className="mr-2 h-4 w-4" />
              Add cultivar
            </Button>
          </div>

          {loading && <p className="text-sm text-muted-foreground">Loading cultivars…</p>}

          <div className="grid gap-4 md:grid-cols-2">
            {filteredCultivars.map((cultivar) => {
              const usage = usageMap[cultivar.id]
              const domain = cultivar.strain_type && cultivar.strain_type !== 'produce' ? 'cannabis' : 'produce'
              return (
                <Card key={cultivar.id}>
                  <CardHeader className="flex items-start justify-between space-y-0">
                    <div>
                      <CardTitle className="text-base">{cultivar.name}</CardTitle>
                      <CardDescription>{cultivar.genetics || 'No genetics info'}</CardDescription>
                    </div>
                    <Badge variant="outline" className="gap-1">
                      {domain === 'cannabis' ? <Leaf className="h-3 w-3" /> : <Sprout className="h-3 w-3" />}
                      {domain === 'cannabis' ? 'Cannabis' : 'Produce'}
                    </Badge>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm">
                    <p className="text-muted-foreground">{cultivar.harvest_notes || 'No notes'}</p>
                    {usage && (
                      <div className="rounded-md border p-2 text-xs">
                        <p>Total batches: {usage.total_batches}</p>
                        <p>Active: {usage.active_batches}</p>
                        <p>Completed: {usage.completed_batches}</p>
                      </div>
                    )}
                    <div className="flex gap-2">
                      <Button size="sm" variant="ghost" onClick={() => handleEdit(cultivar)}>
                        Edit
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => handleUsage(cultivar.id)}>
                        Usage
                      </Button>
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
