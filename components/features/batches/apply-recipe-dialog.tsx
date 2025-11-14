import { useEffect, useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'

interface RecipeOption {
  id: string
  name: string
  current_version_id: string | null
  plant_types?: string[] | null
}

interface ApplyRecipeDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  organizationId: string
  batchId: string
  batchNumber: string
  userId: string
  onApplied: () => void
}

export function ApplyRecipeDialog({
  open,
  onOpenChange,
  organizationId,
  batchId,
  batchNumber,
  userId,
  onApplied,
}: ApplyRecipeDialogProps) {
  const [recipes, setRecipes] = useState<RecipeOption[]>([])
  const [selectedRecipeId, setSelectedRecipeId] = useState<string>('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!open) return
    let isMounted = true
    async function fetchRecipes() {
      try {
        const response = await fetch(`/api/recipes/list?organizationId=${organizationId}`)
        if (!response.ok) throw new Error('Failed to load recipes')
        const payload = await response.json()
        if (isMounted) {
          setRecipes(payload.data || [])
        }
      } catch (error) {
        console.error('Failed to fetch recipes', error)
        if (isMounted) {
          setRecipes([])
          toast.error('Unable to load recipes')
        }
      }
    }
    fetchRecipes()
    return () => {
      isMounted = false
    }
  }, [open, organizationId])

  const handleApply = async () => {
    if (!selectedRecipeId) {
      toast.error('Select a recipe first')
      return
    }

    const recipe = recipes.find((item) => item.id === selectedRecipeId)
    if (!recipe?.current_version_id) {
      toast.error('Recipe is missing a published version')
      return
    }

    try {
      setLoading(true)
      const response = await fetch('/api/recipes/activate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          recipeId: recipe.id,
          recipeVersionId: recipe.current_version_id,
          scopeType: 'batch',
          scopeId: batchId,
          scopeName: batchNumber,
          userId,
        }),
      })

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}))
        throw new Error(payload?.error || 'Failed to activate recipe')
      }

      toast.success('Recipe applied to batch')
      onApplied()
      onOpenChange(false)
      setSelectedRecipeId('')
    } catch (error) {
      console.error('Failed to apply recipe', error)
      toast.error(error instanceof Error ? error.message : 'Unable to apply recipe')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Apply recipe to batch</DialogTitle>
          <DialogDescription>Select a published recipe to link to this batch.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="recipe-select">Recipe</Label>
            <Select value={selectedRecipeId} onValueChange={setSelectedRecipeId}>
              <SelectTrigger id="recipe-select">
                <SelectValue placeholder="Select recipe" />
              </SelectTrigger>
              <SelectContent>
                {recipes.map((recipe) => (
                  <SelectItem key={recipe.id} value={recipe.id}>
                    {recipe.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleApply} disabled={loading || !selectedRecipeId}>
            {loading ? 'Applying...' : 'Apply Recipe'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
