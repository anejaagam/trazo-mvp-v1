'use client'

import { useState } from 'react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle, Loader2, Info } from 'lucide-react'
import { deleteInventoryItemAction, batchDeleteInventoryItemsAction } from '@/app/actions/inventory'
import type { InventoryItemWithStock } from '@/types/inventory'

interface DeleteItemsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  items: InventoryItemWithStock[]
  onSuccess: () => void
}

export function DeleteItemsDialog({
  open,
  onOpenChange,
  items,
  onSuccess,
}: DeleteItemsDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const handleDelete = async () => {
    setIsDeleting(true)
    setError(null)
    setSuccessMessage(null)

    try {
      let result

      if (items.length === 1) {
        // Single item delete
        result = await deleteInventoryItemAction(items[0].id)
      } else {
        // Batch delete
        result = await batchDeleteInventoryItemsAction(items.map(item => item.id))
      }

      if (result.error) {
        setError(result.error.message || 'Failed to delete items')
        setIsDeleting(false)
        return
      }

      // Show success message if items were soft deleted
      if ('message' in result && result.message) {
        setSuccessMessage(result.message)
      }

      // Success - wait a moment to show message, then close
      setTimeout(() => {
        onSuccess()
        onOpenChange(false)
        setSuccessMessage(null)
      }, successMessage ? 2000 : 0)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred')
      setIsDeleting(false)
    }
  }

  const itemCount = items.length
  const itemNames = items.length === 1 
    ? items[0].name 
    : items.length <= 3 
      ? items.map(i => i.name).join(', ')
      : `${items.length} items`

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            Delete {itemCount === 1 ? 'Item' : `${itemCount} Items`}?
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-2">
              <p>
                Are you sure you want to delete <strong>{itemNames}</strong>?
              </p>
              <p className="text-muted-foreground text-sm">
                Items with transaction history will be deactivated instead of permanently deleted.
              </p>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {successMessage && (
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>{successMessage}</AlertDescription>
          </Alert>
        )}

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault()
              handleDelete()
            }}
            disabled={isDeleting}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isDeleting ? 'Deleting...' : 'Delete'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
