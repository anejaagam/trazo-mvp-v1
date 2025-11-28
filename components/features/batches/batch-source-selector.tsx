'use client'

import { useState, useEffect } from 'react'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Package, Leaf, AlertTriangle, Check, ChevronsUpDown, Search, Info } from 'lucide-react'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import {
  requiresSourceTracking,
  getStatePlantBatchConfig,
  isOpenLoopState,
} from '@/lib/jurisdiction/plant-batch-config'

type SourceType = 'from_package' | 'from_mother' | 'no_source'

interface SourcePackage {
  id: string
  lot_code: string
  item_name: string
  compliance_package_uid: string | null
  quantity_remaining: number
  unit_of_measure: string
}

interface MotherPlant {
  id: string
  plant_tag: string
  name: string
  cultivar_name: string | null
  clone_count: number
  status: string
}

interface BatchSourceSelectorProps {
  siteId: string
  organizationId: string
  stateCode: string
  sourceType: SourceType
  sourcePackageTag?: string
  sourceMotherPlantTag?: string
  onSourceTypeChange: (type: SourceType) => void
  onSourcePackageChange: (tag: string, packageId?: string) => void
  onSourceMotherPlantChange: (tag: string, plantId?: string) => void
  disabled?: boolean
  className?: string
}

export function BatchSourceSelector({
  siteId,
  organizationId,
  stateCode,
  sourceType,
  sourcePackageTag,
  sourceMotherPlantTag,
  onSourceTypeChange,
  onSourcePackageChange,
  onSourceMotherPlantChange,
  disabled = false,
  className,
}: BatchSourceSelectorProps) {
  const [packages, setPackages] = useState<SourcePackage[]>([])
  const [motherPlants, setMotherPlants] = useState<MotherPlant[]>([])
  const [isLoadingPackages, setIsLoadingPackages] = useState(false)
  const [isLoadingMothers, setIsLoadingMothers] = useState(false)
  const [packageSearchOpen, setPackageSearchOpen] = useState(false)
  const [motherSearchOpen, setMotherSearchOpen] = useState(false)
  const [manualPackageTag, setManualPackageTag] = useState('')
  const [manualMotherTag, setManualMotherTag] = useState('')

  const config = getStatePlantBatchConfig(stateCode)
  const isSourceRequired = requiresSourceTracking(stateCode)
  const isClosedLoop = !isOpenLoopState(stateCode)

  // For closed loop states, source is REQUIRED for Metrc push
  // This is more strict than just requiresSourceTracking
  const sourceIsRequired = isClosedLoop || isSourceRequired

  // Load packages with compliance UIDs
  useEffect(() => {
    if (sourceType !== 'from_package') return

    const loadPackages = async () => {
      setIsLoadingPackages(true)
      try {
        const supabase = createClient()
        const { data, error } = await supabase
          .from('inventory_lots')
          .select(
            `
            id,
            lot_code,
            compliance_package_uid,
            quantity_remaining,
            unit_of_measure,
            item:inventory_items!inner(name)
          `
          )
          .eq('is_active', true)
          .gt('quantity_remaining', 0)
          .not('compliance_package_uid', 'is', null)
          .order('created_at', { ascending: false })
          .limit(100)

        if (error) throw error

        const formattedPackages: SourcePackage[] = (data || []).map((lot: any) => ({
          id: lot.id,
          lot_code: lot.lot_code,
          item_name: lot.item?.name || 'Unknown Item',
          compliance_package_uid: lot.compliance_package_uid,
          quantity_remaining: lot.quantity_remaining,
          unit_of_measure: lot.unit_of_measure,
        }))

        setPackages(formattedPackages)
      } catch (error) {
        console.error('Error loading packages:', error)
      } finally {
        setIsLoadingPackages(false)
      }
    }

    loadPackages()
  }, [sourceType, organizationId, siteId])

  // Load mother plants
  useEffect(() => {
    if (sourceType !== 'from_mother') return

    const loadMotherPlants = async () => {
      setIsLoadingMothers(true)
      try {
        const supabase = createClient()
        const { data, error } = await supabase
          .from('mother_plants')
          .select(
            `
            id,
            plant_tag,
            name,
            clone_count,
            status,
            cultivar:cultivars(name)
          `
          )
          .eq('organization_id', organizationId)
          .eq('status', 'active')
          .order('name', { ascending: true })
          .limit(100)

        if (error) throw error

        const formattedPlants: MotherPlant[] = (data || []).map((plant: any) => ({
          id: plant.id,
          plant_tag: plant.plant_tag,
          name: plant.name,
          cultivar_name: plant.cultivar?.name || null,
          clone_count: plant.clone_count,
          status: plant.status,
        }))

        setMotherPlants(formattedPlants)
      } catch (error) {
        console.error('Error loading mother plants:', error)
      } finally {
        setIsLoadingMothers(false)
      }
    }

    loadMotherPlants()
  }, [sourceType, organizationId])

  const handlePackageSelect = (pkg: SourcePackage) => {
    onSourcePackageChange(pkg.compliance_package_uid || '', pkg.id)
    setPackageSearchOpen(false)
  }

  const handleMotherSelect = (plant: MotherPlant) => {
    onSourceMotherPlantChange(plant.plant_tag, plant.id)
    setMotherSearchOpen(false)
  }

  const handleManualPackageSubmit = () => {
    if (manualPackageTag.trim()) {
      onSourcePackageChange(manualPackageTag.trim())
      setManualPackageTag('')
    }
  }

  const handleManualMotherSubmit = () => {
    if (manualMotherTag.trim()) {
      onSourceMotherPlantChange(manualMotherTag.trim())
      setManualMotherTag('')
    }
  }

  return (
    <Card className={cn('w-full', className)}>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Leaf className="h-4 w-4" />
          Source Traceability
          {sourceIsRequired && (
            <Badge variant="destructive" className="text-xs">
              Required
            </Badge>
          )}
        </CardTitle>
        <CardDescription>
          {isClosedLoop ? (
            <>
              <strong>{stateCode} is a CLOSED LOOP state.</strong> Plant batches cannot be created
              in Metrc without a source package or mother plant.
            </>
          ) : isSourceRequired ? (
            `${stateCode} requires source tracking for all plant batches.`
          ) : (
            'Optional source tracking for compliance traceability.'
          )}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Source Type Selection */}
        <div className="space-y-2">
          <Label>Source Type</Label>
          <Select
            value={sourceType}
            onValueChange={(value: SourceType) => {
              onSourceTypeChange(value)
              // Clear existing selections when type changes
              if (value !== 'from_package') onSourcePackageChange('')
              if (value !== 'from_mother') onSourceMotherPlantChange('')
            }}
            disabled={disabled}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select source type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="from_package">
                <div className="flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  From Package (Seeds/Clones)
                </div>
              </SelectItem>
              <SelectItem value="from_mother">
                <div className="flex items-center gap-2">
                  <Leaf className="h-4 w-4" />
                  From Mother Plant (Clone)
                </div>
              </SelectItem>
              {/* Only show "no source" option for Open Loop states that don't require tracking */}
              {!sourceIsRequired && (
                <SelectItem value="no_source">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    No Source Tracking
                  </div>
                </SelectItem>
              )}
            </SelectContent>
          </Select>
        </div>

        {/* Package Source Selection */}
        {sourceType === 'from_package' && (
          <div className="space-y-3">
            <Label>Source Package</Label>

            {/* Package Picker */}
            <Popover open={packageSearchOpen} onOpenChange={setPackageSearchOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={packageSearchOpen}
                  className="w-full justify-between"
                  disabled={disabled}
                >
                  {sourcePackageTag || 'Select a package...'}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[400px] p-0" align="start">
                <Command>
                  <CommandInput placeholder="Search packages..." />
                  <CommandList>
                    <CommandEmpty>
                      {isLoadingPackages ? 'Loading...' : 'No packages found.'}
                    </CommandEmpty>
                    <CommandGroup heading="Available Packages">
                      {packages.map((pkg) => (
                        <CommandItem
                          key={pkg.id}
                          value={pkg.compliance_package_uid || pkg.lot_code}
                          onSelect={() => handlePackageSelect(pkg)}
                        >
                          <Check
                            className={cn(
                              'mr-2 h-4 w-4',
                              sourcePackageTag === pkg.compliance_package_uid
                                ? 'opacity-100'
                                : 'opacity-0'
                            )}
                          />
                          <div className="flex flex-col">
                            <span className="font-medium">{pkg.item_name}</span>
                            <span className="text-xs text-muted-foreground">
                              {pkg.compliance_package_uid} &bull; {pkg.quantity_remaining}{' '}
                              {pkg.unit_of_measure}
                            </span>
                          </div>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>

            {/* Manual Entry Option */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Or enter manually:</span>
            </div>
            <div className="flex gap-2">
              <Input
                placeholder="Enter package tag..."
                value={manualPackageTag}
                onChange={(e) => setManualPackageTag(e.target.value)}
                disabled={disabled}
                className="flex-1"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleManualPackageSubmit}
                disabled={disabled || !manualPackageTag.trim()}
              >
                Set
              </Button>
            </div>

            {sourcePackageTag && (
              <div className="flex items-center gap-2 p-2 bg-green-50 dark:bg-green-950 rounded-md">
                <Check className="h-4 w-4 text-green-600" />
                <span className="text-sm">
                  Selected: <strong>{sourcePackageTag}</strong>
                </span>
              </div>
            )}
          </div>
        )}

        {/* Mother Plant Source Selection */}
        {sourceType === 'from_mother' && (
          <div className="space-y-3">
            <Label>Source Mother Plant</Label>

            {/* Mother Plant Picker */}
            <Popover open={motherSearchOpen} onOpenChange={setMotherSearchOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={motherSearchOpen}
                  className="w-full justify-between"
                  disabled={disabled}
                >
                  {sourceMotherPlantTag || 'Select a mother plant...'}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[400px] p-0" align="start">
                <Command>
                  <CommandInput placeholder="Search mother plants..." />
                  <CommandList>
                    <CommandEmpty>
                      {isLoadingMothers ? 'Loading...' : 'No mother plants found.'}
                    </CommandEmpty>
                    <CommandGroup heading="Active Mother Plants">
                      {motherPlants.map((plant) => (
                        <CommandItem
                          key={plant.id}
                          value={plant.plant_tag}
                          onSelect={() => handleMotherSelect(plant)}
                        >
                          <Check
                            className={cn(
                              'mr-2 h-4 w-4',
                              sourceMotherPlantTag === plant.plant_tag
                                ? 'opacity-100'
                                : 'opacity-0'
                            )}
                          />
                          <div className="flex flex-col">
                            <span className="font-medium">{plant.name}</span>
                            <span className="text-xs text-muted-foreground">
                              {plant.plant_tag} &bull; {plant.cultivar_name || 'Unknown strain'}{' '}
                              &bull; {plant.clone_count} clones
                            </span>
                          </div>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>

            {/* Manual Entry Option */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Or enter manually:</span>
            </div>
            <div className="flex gap-2">
              <Input
                placeholder="Enter mother plant tag..."
                value={manualMotherTag}
                onChange={(e) => setManualMotherTag(e.target.value)}
                disabled={disabled}
                className="flex-1"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleManualMotherSubmit}
                disabled={disabled || !manualMotherTag.trim()}
              >
                Set
              </Button>
            </div>

            {sourceMotherPlantTag && (
              <div className="flex items-center gap-2 p-2 bg-green-50 dark:bg-green-950 rounded-md">
                <Check className="h-4 w-4 text-green-600" />
                <span className="text-sm">
                  Selected: <strong>{sourceMotherPlantTag}</strong>
                </span>
              </div>
            )}
          </div>
        )}

        {/* No Source Warning */}
        {sourceType === 'no_source' && sourceIsRequired && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              {isClosedLoop ? (
                <>
                  <strong>{stateCode} is a CLOSED LOOP state.</strong> You cannot push this batch
                  to Metrc without selecting a source package or mother plant. Metrc requires all
                  plant batches to originate from tracked inventory.
                </>
              ) : (
                `${stateCode} requires source traceability. Please select a source type.`
              )}
            </AlertDescription>
          </Alert>
        )}

        {/* State-specific Info */}
        {config && (
          <div className="flex items-start gap-2 text-xs text-muted-foreground p-2 bg-muted rounded-md">
            <Info className="h-4 w-4 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p>{config.complianceNotes || `${stateCode} compliance rules apply.`}</p>
              {isClosedLoop && (
                <p className="font-medium">
                  Metrc endpoint: Use <code className="bg-background px-1 rounded">POST /packages/v2/plantings</code>{' '}
                  or <code className="bg-background px-1 rounded">POST /plants/v2/plantings</code>
                </p>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export type { SourceType, BatchSourceSelectorProps }
