'use client'

/**
 * Cultivar List Component
 * Display and manage cultivars (varieties/strains)
 * Adapted from prototype with shadcn/ui components and Supabase integration
 */

import { useState } from 'react'
import { Plus, Search, Edit, Archive, AlertTriangle, CheckCircle2, Upload, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { usePermissions } from '@/hooks/use-permissions'
import type { Cultivar } from '@/types/batch'
import type { RoleKey } from '@/lib/rbac/types'
import { CultivarModal } from './cultivar-modal'
import { createCultivarClient, updateCultivarClient, getCultivarsClient } from '@/lib/supabase/queries/cultivars-client'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

interface CultivarListProps {
  cultivars: Cultivar[]
  userRole: RoleKey | null
  organizationId: string
  plantType: 'cannabis' | 'produce'
}

export function CultivarList({ cultivars: initialCultivars, userRole, organizationId, plantType }: CultivarListProps) {
  const { can } = usePermissions(userRole, [])
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [selectedCultivar, setSelectedCultivar] = useState<Cultivar | undefined>()
  const [cultivars, setCultivars] = useState(initialCultivars)
  const [syncingCultivarId, setSyncingCultivarId] = useState<string | null>(null)
  
  // Refresh cultivars list
  const refreshCultivars = async () => {
    const { data, error } = await getCultivarsClient(organizationId)
    if (data && !error) {
      setCultivars(data)
    }
    router.refresh()
  }
  
  // Handle create
  const handleCreateClick = () => {
    setSelectedCultivar(undefined)
    setModalOpen(true)
  }
  
  // Handle edit
  const handleEditClick = (cultivar: Cultivar) => {
    setSelectedCultivar(cultivar)
    setModalOpen(true)
  }
  
  // Handle save (create or update)
  const handleSave = async (data: Partial<Cultivar>) => {
    try {
      if (selectedCultivar) {
        // Update existing
        const { error } = await updateCultivarClient(selectedCultivar.id, data)
        if (error) throw error
        toast.success('Cultivar updated successfully')
      } else {
        // Create new - get current user ID
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        
        if (!user) {
          throw new Error('User not authenticated')
        }

        const { error } = await createCultivarClient({
          name: data.name || '',
          organization_id: organizationId,
          created_by: user.id,
          ...data,
        })
        if (error) throw error
        toast.success('Cultivar created successfully')
      }
      await refreshCultivars()
    } catch (error) {
      console.error('Error saving cultivar:', error)
      toast.error('Failed to save cultivar')
      throw error
    }
  }

  // Handle push to Metrc
  const handlePushToMetrc = async (cultivar: Cultivar) => {
    if (syncingCultivarId) return // Prevent multiple syncs at once

    setSyncingCultivarId(cultivar.id)
    try {
      const response = await fetch('/api/compliance/metrc/strains', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          cultivarId: cultivar.id,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to sync with Metrc')
      }

      if (result.success) {
        const action = result.action === 'linked' ? 'linked to existing' : 'created in'
        toast.success(`"${cultivar.name}" ${action} Metrc`)
        await refreshCultivars()
      } else {
        throw new Error(result.error || 'Sync failed')
      }
    } catch (error) {
      console.error('Error pushing to Metrc:', error)
      toast.error((error as Error).message || 'Failed to push to Metrc')
    } finally {
      setSyncingCultivarId(null)
    }
  }

  const filteredCultivars = cultivars.filter((cultivar) => {
    if (!searchTerm) return true
    return (
      cultivar.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (cultivar.common_name && cultivar.common_name.toLowerCase().includes(searchTerm.toLowerCase()))
    )
  })

  const activeCultivars = filteredCultivars.filter((c) => c.is_active)
  const archivedCultivars = filteredCultivars.filter((c) => !c.is_active)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Cultivar Management</h1>
          <p className="text-muted-foreground">
            Manage your varieties and strains
          </p>
        </div>
        {can('cultivar:create') && (
          <Button onClick={handleCreateClick}>
            <Plus className="mr-2 h-4 w-4" />
            Add Cultivar
          </Button>
        )}
      </div>

      {/* Search */}
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search cultivars..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Cultivars</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{cultivars.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Active</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeCultivars.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Archived</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{archivedCultivars.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Active Cultivars Table */}
      {activeCultivars.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Active Cultivars</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>{plantType === 'cannabis' ? 'Strain Type' : 'Category'}</TableHead>
                  <TableHead>{plantType === 'cannabis' ? 'Genetics' : 'Flavor Profile'}</TableHead>
                  <TableHead>{plantType === 'cannabis' ? 'Flowering Days' : 'Storage Life (days)'}</TableHead>
                  {plantType === 'cannabis' && <TableHead>Compliance</TableHead>}
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {activeCultivars.map((cultivar) => (
                  <TableRow key={cultivar.id} className="cursor-pointer hover:bg-muted/50" onClick={() => handleEditClick(cultivar)}>
                    <TableCell className="font-medium">{cultivar.name}</TableCell>
                    <TableCell>
                      {plantType === 'cannabis' ? (
                        cultivar.strain_type ? (
                          <Badge variant="outline">{cultivar.strain_type}</Badge>
                        ) : '-'
                      ) : (
                        cultivar.category ? (
                          <Badge variant="outline">{cultivar.category}</Badge>
                        ) : '-'
                      )}
                    </TableCell>
                    <TableCell>
                      {plantType === 'cannabis' 
                        ? (cultivar.genetics || '-')
                        : (cultivar.flavor_profile || '-')
                      }
                    </TableCell>
                    <TableCell>
                      {plantType === 'cannabis'
                        ? (cultivar.flowering_days || '-')
                        : (cultivar.storage_life_days || '-')
                      }
                    </TableCell>
                    {plantType === 'cannabis' && (
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {cultivar.metrc_strain_id ? (
                            <Badge variant="default" className="bg-green-600 hover:bg-green-700">
                              <CheckCircle2 className="mr-1 h-3 w-3" />
                              Linked
                            </Badge>
                          ) : cultivar.metrc_sync_status === 'sync_failed' ? (
                            <>
                              <Badge variant="destructive">
                                <AlertTriangle className="mr-1 h-3 w-3" />
                                Sync Failed
                              </Badge>
                              {can('compliance:sync') && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handlePushToMetrc(cultivar)
                                  }}
                                  disabled={syncingCultivarId === cultivar.id}
                                  className="h-6 px-2 text-xs"
                                >
                                  {syncingCultivarId === cultivar.id ? (
                                    <Loader2 className="h-3 w-3 animate-spin" />
                                  ) : (
                                    <>
                                      <Upload className="mr-1 h-3 w-3" />
                                      Retry
                                    </>
                                  )}
                                </Button>
                              )}
                            </>
                          ) : (
                            <>
                              <Badge variant="destructive">
                                <AlertTriangle className="mr-1 h-3 w-3" />
                                Not Compliant
                              </Badge>
                              {can('compliance:sync') && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handlePushToMetrc(cultivar)
                                  }}
                                  disabled={syncingCultivarId === cultivar.id}
                                  className="h-6 px-2 text-xs"
                                >
                                  {syncingCultivarId === cultivar.id ? (
                                    <Loader2 className="h-3 w-3 animate-spin" />
                                  ) : (
                                    <>
                                      <Upload className="mr-1 h-3 w-3" />
                                      Push to Metrc
                                    </>
                                  )}
                                </Button>
                              )}
                            </>
                          )}
                        </div>
                      </TableCell>
                    )}
                    <TableCell className="text-right">
                      {can('cultivar:edit') && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleEditClick(cultivar)
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Archived Cultivars */}
      {archivedCultivars.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Archived Cultivars</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>{plantType === 'cannabis' ? 'Strain Type' : 'Category'}</TableHead>
                  <TableHead>{plantType === 'cannabis' ? 'Genetics' : 'Flavor Profile'}</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {archivedCultivars.map((cultivar) => (
                  <TableRow key={cultivar.id} className="cursor-pointer hover:bg-muted/50" onClick={() => handleEditClick(cultivar)}>
                    <TableCell className="font-medium text-muted-foreground">
                      {cultivar.name}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {plantType === 'cannabis' ? (
                        cultivar.strain_type ? (
                          <Badge variant="outline" className="opacity-50">{cultivar.strain_type}</Badge>
                        ) : '-'
                      ) : (
                        cultivar.category ? (
                          <Badge variant="outline" className="opacity-50">{cultivar.category}</Badge>
                        ) : '-'
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {plantType === 'cannabis' 
                        ? (cultivar.genetics || '-')
                        : (cultivar.flavor_profile || '-')
                      }
                    </TableCell>
                    <TableCell className="text-right">
                      {can('cultivar:edit') && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleEditClick(cultivar)
                          }}
                        >
                          <Archive className="h-4 w-4" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {filteredCultivars.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-muted-foreground text-center">
              {searchTerm ? 'No cultivars found matching your search.' : 'No cultivars yet.'}
            </p>
            {can('cultivar:create') && !searchTerm && (
              <Button onClick={handleCreateClick} className="mt-4">
                <Plus className="mr-2 h-4 w-4" />
                Add Your First Cultivar
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Create/Edit Modal */}
      <CultivarModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        cultivar={selectedCultivar}
        onSave={handleSave}
        plantType={plantType}
      />
    </div>
  )
}
