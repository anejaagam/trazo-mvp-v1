'use client'

/**
 * Cultivar List Component
 * Display and manage cultivars (varieties/strains)
 * Adapted from prototype with shadcn/ui components and Supabase integration
 */

import { useState } from 'react'
import { Plus, Search, Edit, Archive } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
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

interface CultivarListProps {
  cultivars: Cultivar[]
  onCreateClick: () => void
  onEditClick: (cultivar: Cultivar) => void
  userRole: RoleKey | null
}

export function CultivarList({ cultivars, onCreateClick, onEditClick, userRole }: CultivarListProps) {
  const { can } = usePermissions(userRole, [])
  const [searchTerm, setSearchTerm] = useState('')

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
          <Button onClick={onCreateClick}>
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
                  <TableHead>Common Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Growing Days</TableHead>
                  <TableHead>Expected Yield</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {activeCultivars.map((cultivar) => (
                  <TableRow key={cultivar.id}>
                    <TableCell className="font-medium">{cultivar.name}</TableCell>
                    <TableCell>{cultivar.common_name || '-'}</TableCell>
                    <TableCell>
                      {cultivar.category && (
                        <Badge variant="outline">{cultivar.category}</Badge>
                      )}
                    </TableCell>
                    <TableCell>{cultivar.growing_days || '-'}</TableCell>
                    <TableCell>{cultivar.expected_yield || '-'}</TableCell>
                    <TableCell className="text-right">
                      {can('cultivar:edit') && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onEditClick(cultivar)}
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
                  <TableHead>Common Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {archivedCultivars.map((cultivar) => (
                  <TableRow key={cultivar.id}>
                    <TableCell className="font-medium text-muted-foreground">
                      {cultivar.name}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {cultivar.common_name || '-'}
                    </TableCell>
                    <TableCell>
                      {cultivar.category && (
                        <Badge variant="outline" className="opacity-50">
                          {cultivar.category}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {can('cultivar:edit') && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onEditClick(cultivar)}
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
              <Button onClick={onCreateClick} className="mt-4">
                <Plus className="mr-2 h-4 w-4" />
                Add Your First Cultivar
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
