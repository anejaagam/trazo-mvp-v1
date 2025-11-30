'use client'

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { CalendarIcon, Loader2 } from 'lucide-react'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { getAssignableScopes, assignRecipeToScope } from '@/app/actions/recipes'
import type { RecipeScopeType } from '@/types/recipe'

interface AssignRecipeDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  recipeId: string
  recipeName: string
  recipeVersionId: string
  organizationId: string
  userId: string
}

export function AssignRecipeDialog({
  open,
  onOpenChange,
  recipeId,
  recipeName,
  recipeVersionId,
  organizationId,
  userId,
}: AssignRecipeDialogProps) {
  const [scopeType, setScopeType] = useState<RecipeScopeType>('pod')
  const [scopeId, setScopeId] = useState('')
  const [startDate, setStartDate] = useState<Date>(new Date())
  const [scopes, setScopes] = useState<Array<{ id: string; name: string; location?: string }>>([])
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  // Fetch available scopes when scope type changes
  useEffect(() => {
    async function fetchScopes() {
      setLoading(true)
      setScopeId('') // Reset selection
      const { data, error } = await getAssignableScopes(organizationId, scopeType)
      if (error) {
        console.error('Error fetching scopes:', error)
        toast.error('Failed to load available locations')
        setScopes([])
      } else {
        setScopes(data || [])
      }
      setLoading(false)
    }

    if (open) {
      fetchScopes()
    }
  }, [scopeType, organizationId, open])

  const handleAssign = async () => {
    if (!scopeId) {
      toast.error('Please select a location')
      return
    }

    setSubmitting(true)
    try {
      const selectedScope = scopes.find(s => s.id === scopeId)
      const scopeName = selectedScope?.name || 'Unknown'

      const { error } = await assignRecipeToScope(
        recipeId,
        recipeVersionId,
        scopeType,
        scopeId,
        scopeName,
        userId,
        startDate.toISOString()
      )

      if (error) {
        throw error
      }

      toast.success(`Recipe "${recipeName}" assigned to ${scopeName}`)
      onOpenChange(false)
      
      // Reset form
      setScopeId('')
      setStartDate(new Date())
    } catch (error) {
      console.error('Error assigning recipe:', error)
      toast.error('Failed to assign recipe')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Assign Recipe</DialogTitle>
          <DialogDescription>
            Assign &quot;{recipeName}&quot; to a pod, room, batch, or batch group
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Scope Type Selection */}
          <div className="space-y-2">
            <Label htmlFor="scope-type">Assign To</Label>
            <Select
              value={scopeType}
              onValueChange={(value) => setScopeType(value as RecipeScopeType)}
            >
              <SelectTrigger id="scope-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pod">Pod</SelectItem>
                <SelectItem value="room">Room</SelectItem>
                <SelectItem value="batch">Batch</SelectItem>
                <SelectItem value="batch_group">Batch Group</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Scope Selection */}
          <div className="space-y-2">
            <Label htmlFor="scope-id">
              Select {scopeType === 'pod' ? 'Pod' : scopeType === 'room' ? 'Room' : scopeType === 'batch' ? 'Batch' : 'Batch Group'}
            </Label>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : scopes.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">
                No {scopeType}s available
              </p>
            ) : (
              <Select value={scopeId} onValueChange={setScopeId}>
                <SelectTrigger id="scope-id">
                  <SelectValue placeholder={`Select a ${scopeType}`} />
                </SelectTrigger>
                <SelectContent>
                  {scopes.map((scope) => (
                    <SelectItem key={scope.id} value={scope.id}>
                      {scope.name}
                      {scope.location && (
                        <span className="text-muted-foreground ml-2">
                          ({scope.location})
                        </span>
                      )}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Start Date Selection */}
          <div className="space-y-2">
            <Label>Start Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    'w-full justify-start text-left font-normal',
                    !startDate && 'text-muted-foreground'
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {startDate ? format(startDate, 'PPP') : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={startDate}
                  onSelect={(date) => date && setStartDate(date)}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleAssign} 
            disabled={submitting || !scopeId}
          >
            {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Assign Recipe
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
