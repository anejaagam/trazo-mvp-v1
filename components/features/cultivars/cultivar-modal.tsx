'use client'

/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import type { Cultivar } from '@/types/batch'

// Validation schemas
const cannabisSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  strain_type: z.enum(['indica', 'sativa', 'hybrid', 'cbd', 'auto']).optional(),
  genetics: z.string().optional(),
  breeder: z.string().optional(),
  thc_range_min: z.number().min(0).max(100).optional(),
  thc_range_max: z.number().min(0).max(100).optional(),
  cbd_range_min: z.number().min(0).max(100).optional(),
  cbd_range_max: z.number().min(0).max(100).optional(),
  flowering_days: z.number().min(1).optional(),
  harvest_notes: z.string().optional(),
  grow_characteristics: z.string().optional(),
})

const produceSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  category: z.enum(['vegetable', 'fruit', 'herb', 'berry', 'leafy_green', 'root_vegetable', 'mushroom']),
  flavor_profile: z.string().optional(),
  storage_life_days: z.number().min(1).optional(),
  optimal_temp_c_min: z.number().optional(),
  optimal_temp_c_max: z.number().optional(),
  optimal_humidity_min: z.number().min(0).max(100).optional(),
  optimal_humidity_max: z.number().min(0).max(100).optional(),
  grow_characteristics: z.string().optional(),
})

type CannabisFormData = z.infer<typeof cannabisSchema>
type ProduceFormData = z.infer<typeof produceSchema>

interface CultivarModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  cultivar?: Cultivar
  onSave: (data: Partial<Cultivar>) => Promise<void>
  plantType: 'cannabis' | 'produce'
}

export function CultivarModal({ open, onOpenChange, cultivar, onSave, plantType }: CultivarModalProps) {
  const [loading, setLoading] = useState(false)
  const isEdit = !!cultivar

  const cannabisForm = useForm<CannabisFormData>({
    resolver: zodResolver(cannabisSchema),
    defaultValues: {
      name: '',
      genetics: '',
      breeder: '',
      harvest_notes: '',
      grow_characteristics: '',
    },
  })

  const produceForm = useForm<ProduceFormData>({
    resolver: zodResolver(produceSchema),
    defaultValues: {
      name: '',
      category: 'vegetable',
      flavor_profile: '',
      grow_characteristics: '',
    },
  })

  const form = plantType === 'cannabis' ? cannabisForm : produceForm

  // Reset form when cultivar changes (for editing) or when modal opens
  React.useEffect(() => {
    if (open) {
      if (cultivar && plantType === 'cannabis') {
        cannabisForm.reset({
          name: cultivar.name,
          strain_type: cultivar.strain_type as any,
          genetics: cultivar.genetics || '',
          breeder: cultivar.breeder || '',
          thc_range_min: cultivar.thc_range_min ?? undefined,
          thc_range_max: cultivar.thc_range_max ?? undefined,
          cbd_range_min: cultivar.cbd_range_min ?? undefined,
          cbd_range_max: cultivar.cbd_range_max ?? undefined,
          flowering_days: cultivar.flowering_days ?? undefined,
          harvest_notes: cultivar.harvest_notes || '',
          grow_characteristics: cultivar.grow_characteristics || '',
        })
      } else if (cultivar && plantType === 'produce') {
        produceForm.reset({
          name: cultivar.name,
          category: cultivar.category as any,
          flavor_profile: cultivar.flavor_profile || '',
          storage_life_days: cultivar.storage_life_days,
          optimal_temp_c_min: cultivar.optimal_temp_c_min,
          optimal_temp_c_max: cultivar.optimal_temp_c_max,
          optimal_humidity_min: cultivar.optimal_humidity_min,
          optimal_humidity_max: cultivar.optimal_humidity_max,
          grow_characteristics: cultivar.grow_characteristics || '',
        })
      } else {
        // Reset to empty form for new cultivar
        form.reset()
      }
    }
  }, [open, cultivar, plantType, cannabisForm, produceForm, form])

  const onSubmit = async (data: CannabisFormData | ProduceFormData) => {
    try {
      setLoading(true)
      await onSave(data as Partial<Cultivar>)
      onOpenChange(false)
      form.reset()
    } catch (error) {
      console.error('Error saving cultivar:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Cultivar' : 'Create New Cultivar'}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? 'Update the cultivar information below.'
              : `Add a new ${plantType === 'cannabis' ? 'cannabis strain' : 'produce variety'} to your library.`}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {plantType === 'cannabis' ? (
              <CannabisFields form={cannabisForm} />
            ) : (
              <ProduceFields form={produceForm} />
            )}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isEdit ? 'Update' : 'Create'} Cultivar
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

function CannabisFields({ form }: { form: any }) {
  return (
    <Tabs defaultValue="basic" className="w-full">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="basic">Basic Info</TabsTrigger>
        <TabsTrigger value="cannabinoids">Cannabinoids</TabsTrigger>
        <TabsTrigger value="growing">Growing</TabsTrigger>
      </TabsList>

      <TabsContent value="basic" className="space-y-4 mt-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Strain Name *</FormLabel>
              <FormControl>
                <Input placeholder="e.g., Blue Dream, OG Kush" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="strain_type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Strain Type</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select strain type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="indica">Indica</SelectItem>
                  <SelectItem value="sativa">Sativa</SelectItem>
                  <SelectItem value="hybrid">Hybrid</SelectItem>
                  <SelectItem value="cbd">CBD</SelectItem>
                  <SelectItem value="auto">Auto-flowering</SelectItem>
                </SelectContent>
              </Select>
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
                <Input placeholder="e.g., Blueberry × Haze" {...field} />
              </FormControl>
              <FormDescription>Parent strains or lineage</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="breeder"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Breeder</FormLabel>
              <FormControl>
                <Input placeholder="e.g., DJ Short Seeds" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </TabsContent>

      <TabsContent value="cannabinoids" className="space-y-4 mt-4">
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="thc_range_min"
            render={({ field }) => (
              <FormItem>
                <FormLabel>THC Min (%)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.1"
                    min="0"
                    max="100"
                    placeholder="0"
                    value={field.value ?? ''}
                    onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="thc_range_max"
            render={({ field }) => (
              <FormItem>
                <FormLabel>THC Max (%)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.1"
                    min="0"
                    max="100"
                    placeholder="0"
                    value={field.value ?? ''}
                    onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="cbd_range_min"
            render={({ field }) => (
              <FormItem>
                <FormLabel>CBD Min (%)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.1"
                    min="0"
                    max="100"
                    placeholder="0"
                    value={field.value ?? ''}
                    onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="cbd_range_max"
            render={({ field }) => (
              <FormItem>
                <FormLabel>CBD Max (%)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.1"
                    min="0"
                    max="100"
                    placeholder="0"
                    value={field.value ?? ''}
                    onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </TabsContent>

      <TabsContent value="growing" className="space-y-4 mt-4">
        <FormField
          control={form.control}
          name="flowering_days"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Flowering Time (days)</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min="1"
                  placeholder="e.g., 56"
                  value={field.value ?? ''}
                  onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                />
              </FormControl>
              <FormDescription>Typical flowering period in days</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="grow_characteristics"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Growing Characteristics</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="e.g., Vigorous growth, responds well to topping, prefers warmer temperatures"
                  className="min-h-[100px]"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="harvest_notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Harvest Notes</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="e.g., Dense buds, prone to mold in high humidity, trim carefully"
                  className="min-h-[100px]"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </TabsContent>
    </Tabs>
  )
}

function ProduceFields({ form }: { form: any }) {
  return (
    <Tabs defaultValue="basic" className="w-full">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="basic">Basic Info</TabsTrigger>
        <TabsTrigger value="storage">Storage & Growth</TabsTrigger>
      </TabsList>

      <TabsContent value="basic" className="space-y-4 mt-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Variety Name *</FormLabel>
              <FormControl>
                <Input placeholder="e.g., Cherry Tomato, Romaine Lettuce" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="category"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Category *</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="vegetable">Vegetable</SelectItem>
                  <SelectItem value="fruit">Fruit</SelectItem>
                  <SelectItem value="herb">Herb</SelectItem>
                  <SelectItem value="berry">Berry</SelectItem>
                  <SelectItem value="leafy_green">Leafy Green</SelectItem>
                  <SelectItem value="root_vegetable">Root Vegetable</SelectItem>
                  <SelectItem value="mushroom">Mushroom</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="flavor_profile"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Flavor Profile</FormLabel>
              <FormControl>
                <Input placeholder="e.g., Sweet, tangy, crisp" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="grow_characteristics"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Growing Characteristics</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="e.g., Fast-growing, needs support, drought-tolerant"
                  className="min-h-[100px]"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </TabsContent>

      <TabsContent value="storage" className="space-y-4 mt-4">
        <FormField
          control={form.control}
          name="storage_life_days"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Storage Life (days)</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min="1"
                  placeholder="e.g., 7"
                  value={field.value ?? ''}
                  onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                />
              </FormControl>
              <FormDescription>Typical shelf life after harvest</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="optimal_temp_c_min"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Min Temp (°C)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.1"
                    placeholder="e.g., 10"
                    value={field.value ?? ''}
                    onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="optimal_temp_c_max"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Max Temp (°C)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.1"
                    placeholder="e.g., 25"
                    value={field.value ?? ''}
                    onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="optimal_humidity_min"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Min Humidity (%)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    placeholder="e.g., 60"
                    value={field.value ?? ''}
                    onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="optimal_humidity_max"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Max Humidity (%)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    placeholder="e.g., 80"
                    value={field.value ?? ''}
                    onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </TabsContent>
    </Tabs>
  )
}
