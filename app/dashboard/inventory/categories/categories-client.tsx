'use client'

/**
 * Inventory Categories Client Component
 * 
 * Allows org admins and site managers to create, edit, and manage inventory categories
 */

import { useEffect, useState } from 'react'
import { usePermissions } from '@/hooks/use-permissions'
import { createClient } from '@/lib/supabase/client'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Plus,
  MoreVertical,
  Edit,
  Trash2,
  Package,
  AlertCircle,
  Loader2,
  FolderOpen,
} from 'lucide-react'
import type { InventoryCategory } from '@/types/inventory'
import type { RoleKey } from '@/lib/rbac/types'

interface CategoriesPageClientProps {
  organizationId: string
  userRole: string
}

interface CategoryFormData {
  name: string
  description: string
  track_lot_numbers: boolean
  track_expiry: boolean
  require_coa: boolean
}

const defaultFormData: CategoryFormData = {
  name: '',
  description: '',
  track_lot_numbers: true,
  track_expiry: true,
  require_coa: false,
}

export function CategoriesPageClient({ organizationId, userRole }: CategoriesPageClientProps) {
  const { can } = usePermissions(userRole as RoleKey)
  
  const [categories, setCategories] = useState<InventoryCategory[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<InventoryCategory | null>(null)
  const [formData, setFormData] = useState<CategoryFormData>(defaultFormData)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  // Delete confirmation
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [categoryToDelete, setCategoryToDelete] = useState<InventoryCategory | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const canManageCategories = can('inventory:create') || userRole === 'org_admin'

  useEffect(() => {
    loadCategories()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [organizationId])

  async function loadCategories() {
    if (!organizationId) return
    
    try {
      setIsLoading(true)
      setError(null)
      
      const supabase = createClient()
      const { data, error: queryError } = await supabase
        .from('inventory_categories')
        .select('*')
        .eq('organization_id', organizationId)
        .order('name')
      
      if (queryError) throw queryError
      setCategories(data || [])
    } catch (err) {
      console.error('Error loading categories:', err)
      setError('Failed to load categories')
    } finally {
      setIsLoading(false)
    }
  }

  function handleCreate() {
    setEditingCategory(null)
    setFormData(defaultFormData)
    setFormError(null)
    setDialogOpen(true)
  }

  function handleEdit(category: InventoryCategory) {
    setEditingCategory(category)
    setFormData({
      name: category.name,
      description: category.description || '',
      track_lot_numbers: category.track_lot_numbers,
      track_expiry: category.track_expiry,
      require_coa: category.require_coa,
    })
    setFormError(null)
    setDialogOpen(true)
  }

  function handleDeleteClick(category: InventoryCategory) {
    setCategoryToDelete(category)
    setDeleteDialogOpen(true)
  }

  async function handleSubmit() {
    if (!formData.name.trim()) {
      setFormError('Name is required')
      return
    }

    try {
      setIsSubmitting(true)
      setFormError(null)
      
      const supabase = createClient()
      
      if (editingCategory) {
        // Update existing category
        const { error: updateError } = await supabase
          .from('inventory_categories')
          .update({
            name: formData.name.trim(),
            description: formData.description.trim() || null,
            track_lot_numbers: formData.track_lot_numbers,
            track_expiry: formData.track_expiry,
            require_coa: formData.require_coa,
          })
          .eq('id', editingCategory.id)
        
        if (updateError) throw updateError
      } else {
        // Create new category
        const { error: insertError } = await supabase
          .from('inventory_categories')
          .insert({
            organization_id: organizationId,
            name: formData.name.trim(),
            description: formData.description.trim() || null,
            track_lot_numbers: formData.track_lot_numbers,
            track_expiry: formData.track_expiry,
            require_coa: formData.require_coa,
            is_active: true,
            created_at: new Date().toISOString(),
          })
        
        if (insertError) throw insertError
      }
      
      setDialogOpen(false)
      loadCategories()
    } catch (err) {
      console.error('Error saving category:', err)
      setFormError('Failed to save category')
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleDelete() {
    if (!categoryToDelete) return
    
    try {
      setIsDeleting(true)
      
      const supabase = createClient()
      
      // Soft delete by setting is_active to false
      const { error: deleteError } = await supabase
        .from('inventory_categories')
        .update({ is_active: false })
        .eq('id', categoryToDelete.id)
      
      if (deleteError) throw deleteError
      
      setDeleteDialogOpen(false)
      setCategoryToDelete(null)
      loadCategories()
    } catch (err) {
      console.error('Error deleting category:', err)
    } finally {
      setIsDeleting(false)
    }
  }

  async function handleRestore(category: InventoryCategory) {
    try {
      const supabase = createClient()
      
      const { error: restoreError } = await supabase
        .from('inventory_categories')
        .update({ is_active: true })
        .eq('id', category.id)
      
      if (restoreError) throw restoreError
      
      loadCategories()
    } catch (err) {
      console.error('Error restoring category:', err)
    }
  }

  if (!can('inventory:view')) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          You do not have permission to view inventory categories.
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FolderOpen className="h-5 w-5" />
                Categories
              </CardTitle>
              <CardDescription>
                Organize your inventory items into categories for easier management and filtering
              </CardDescription>
            </div>
            {canManageCategories && (
              <Button onClick={handleCreate}>
                <Plus className="h-4 w-4 mr-2" />
                Add Category
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {/* Loading State */}
          {isLoading && (
            <div className="text-center py-12">
              <Loader2 className="h-8 w-8 mx-auto mb-4 text-muted-foreground animate-spin" />
              <p className="text-muted-foreground">Loading categories...</p>
            </div>
          )}

          {/* Error State */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Empty State */}
          {!isLoading && !error && categories.length === 0 && (
            <div className="text-center py-12">
              <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-medium mb-2">No categories yet</h3>
              <p className="text-muted-foreground mb-4">
                Create categories to organize your inventory items
              </p>
              {canManageCategories && (
                <Button onClick={handleCreate}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create First Category
                </Button>
              )}
            </div>
          )}

          {/* Categories Table */}
          {!isLoading && !error && categories.length > 0 && (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="text-center">Lot Tracking</TableHead>
                    <TableHead className="text-center">Expiry Tracking</TableHead>
                    <TableHead className="text-center">Require COA</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                    <TableHead className="w-[80px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {categories.map((category) => (
                    <TableRow key={category.id} className={!category.is_active ? 'opacity-50' : ''}>
                      <TableCell className="font-medium">{category.name}</TableCell>
                      <TableCell className="text-muted-foreground max-w-[300px] truncate">
                        {category.description || '—'}
                      </TableCell>
                      <TableCell className="text-center">
                        {category.track_lot_numbers ? (
                          <Badge variant="default">Yes</Badge>
                        ) : (
                          <Badge variant="outline">No</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        {category.track_expiry ? (
                          <Badge variant="default">Yes</Badge>
                        ) : (
                          <Badge variant="outline">No</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        {category.require_coa ? (
                          <Badge variant="default">Yes</Badge>
                        ) : (
                          <Badge variant="outline">No</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        {category.is_active ? (
                          <Badge variant="default">Active</Badge>
                        ) : (
                          <Badge variant="secondary">Inactive</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {canManageCategories && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" aria-label="Category actions">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleEdit(category)}>
                                <Edit className="h-4 w-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                              {category.is_active ? (
                                <DropdownMenuItem 
                                  onClick={() => handleDeleteClick(category)}
                                  className="text-destructive focus:text-destructive"
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Deactivate
                                </DropdownMenuItem>
                              ) : (
                                <DropdownMenuItem onClick={() => handleRestore(category)}>
                                  <Plus className="h-4 w-4 mr-2" />
                                  Restore
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingCategory ? 'Edit Category' : 'Create Category'}
            </DialogTitle>
            <DialogDescription>
              {editingCategory 
                ? 'Update the category details below'
                : 'Add a new category to organize your inventory items'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Nutrients & Fertilizers"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Brief description of what items belong in this category"
                rows={3}
              />
            </div>
            
            <div className="space-y-3 pt-2">
              <Label>Tracking Options</Label>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="track_lot_numbers"
                  checked={formData.track_lot_numbers}
                  onCheckedChange={(checked) => 
                    setFormData({ ...formData, track_lot_numbers: checked as boolean })
                  }
                />
                <Label htmlFor="track_lot_numbers" className="font-normal">
                  Track lot numbers for items in this category
                </Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="track_expiry"
                  checked={formData.track_expiry}
                  onCheckedChange={(checked) => 
                    setFormData({ ...formData, track_expiry: checked as boolean })
                  }
                />
                <Label htmlFor="track_expiry" className="font-normal">
                  Track expiration dates for items in this category
                </Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="require_coa"
                  checked={formData.require_coa}
                  onCheckedChange={(checked) => 
                    setFormData({ ...formData, require_coa: checked as boolean })
                  }
                />
                <Label htmlFor="require_coa" className="font-normal">
                  Require Certificate of Analysis (COA) for items
                </Label>
              </div>
            </div>
            
            {formError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{formError}</AlertDescription>
              </Alert>
            )}
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {editingCategory ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Deactivate Category</DialogTitle>
            <DialogDescription>
              Are you sure you want to deactivate &quot;{categoryToDelete?.name}&quot;? 
              Items in this category will remain but the category won&apos;t appear in filters. 
              You can restore it later.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
              {isDeleting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Deactivate
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
