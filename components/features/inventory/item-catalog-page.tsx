'use client'

import { useState } from 'react'
import { ItemCatalog } from './item-catalog'
import { ItemFormDialog } from './item-form-dialog'
import { ReceiveInventoryDialog } from './receive-inventory-dialog'
import { IssueInventoryDialog } from './issue-inventory-dialog'
import { AdjustInventoryDialog } from './adjust-inventory-dialog'
import { ItemDetailSheet } from './item-detail-sheet'
import { DeleteItemsDialog } from './delete-items-dialog'
import type { InventoryItemWithStock } from '@/types/inventory'

interface ItemCatalogPageProps {
  organizationId: string
  siteId: string
  userId: string
  userRole: string
}

export function ItemCatalogPage({
  organizationId,
  siteId,
  userId,
  userRole,
}: ItemCatalogPageProps) {
  const [selectedItem, setSelectedItem] = useState<InventoryItemWithStock | null>(null)
  const [itemFormOpen, setItemFormOpen] = useState(false)
  const [receiveDialogOpen, setReceiveDialogOpen] = useState(false)
  const [issueDialogOpen, setIssueDialogOpen] = useState(false)
  const [adjustDialogOpen, setAdjustDialogOpen] = useState(false)
  const [detailSheetOpen, setDetailSheetOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [itemsToDelete, setItemsToDelete] = useState<InventoryItemWithStock[]>([])
  const [refreshKey, setRefreshKey] = useState(0)

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1)
  }

  const handleCreateItem = () => {
    setSelectedItem(null)
    setItemFormOpen(true)
  }

  const handleEditItem = (item: InventoryItemWithStock) => {
    setSelectedItem(item)
    setItemFormOpen(true)
  }

  const handleReceiveInventory = (item?: InventoryItemWithStock) => {
    setSelectedItem(item || null)
    setReceiveDialogOpen(true)
  }

  const handleIssueInventory = (item?: InventoryItemWithStock) => {
    setSelectedItem(item || null)
    setIssueDialogOpen(true)
  }

  const handleAdjustInventory = (item?: InventoryItemWithStock) => {
    setSelectedItem(item || null)
    setAdjustDialogOpen(true)
  }

  const handleItemSelect = (item: InventoryItemWithStock) => {
    setSelectedItem(item)
    setDetailSheetOpen(true)
  }

  const handleDeleteItem = (item: InventoryItemWithStock) => {
    setItemsToDelete([item])
    setDeleteDialogOpen(true)
  }

  const handleBatchDelete = (items: InventoryItemWithStock[]) => {
    setItemsToDelete(items)
    setDeleteDialogOpen(true)
  }

  return (
    <>
      <ItemCatalog
        key={refreshKey}
        organizationId={organizationId}
        siteId={siteId}
        userRole={userRole}
        onItemSelect={handleItemSelect}
        onCreateItem={handleCreateItem}
        onEditItem={handleEditItem}
        onReceiveInventory={handleReceiveInventory}
        onIssueInventory={handleIssueInventory}
        onAdjustInventory={handleAdjustInventory}
        onDeleteItem={handleDeleteItem}
        onBatchDelete={handleBatchDelete}
      />

      {/* Item Form Dialog */}
      <ItemFormDialog
        open={itemFormOpen}
        onOpenChange={setItemFormOpen}
        organizationId={organizationId}
        siteId={siteId}
        userId={userId}
        userRole={userRole}
        item={selectedItem || undefined}
        onSuccess={() => {
          setItemFormOpen(false)
          handleRefresh()
        }}
      />

      {/* Receive Inventory Dialog */}
      <ReceiveInventoryDialog
        open={receiveDialogOpen}
        onOpenChange={setReceiveDialogOpen}
        organizationId={organizationId}
        siteId={siteId}
        userId={userId}
        userRole={userRole}
        preSelectedItem={selectedItem || undefined}
        onSuccess={() => {
          setReceiveDialogOpen(false)
          handleRefresh()
        }}
      />

      {/* Issue Inventory Dialog */}
      <IssueInventoryDialog
        open={issueDialogOpen}
        onOpenChange={setIssueDialogOpen}
        organizationId={organizationId}
        siteId={siteId}
        userId={userId}
        userRole={userRole}
        preSelectedItem={selectedItem || undefined}
        onSuccess={() => {
          setIssueDialogOpen(false)
          handleRefresh()
        }}
      />

      {/* Adjust Inventory Dialog */}
      <AdjustInventoryDialog
        open={adjustDialogOpen}
        onOpenChange={setAdjustDialogOpen}
        organizationId={organizationId}
        siteId={siteId}
        userId={userId}
        userRole={userRole}
        preSelectedItem={selectedItem || undefined}
        onSuccess={() => {
          setAdjustDialogOpen(false)
          handleRefresh()
        }}
      />

      {/* Item Detail Sheet */}
      <ItemDetailSheet
        item={selectedItem}
        open={detailSheetOpen}
        onOpenChange={setDetailSheetOpen}
        userRole={userRole}
        onEdit={(item) => {
          setDetailSheetOpen(false)
          handleEditItem(item)
        }}
        onReceive={(item) => {
          setDetailSheetOpen(false)
          handleReceiveInventory(item)
        }}
        onIssue={(item) => {
          setDetailSheetOpen(false)
          handleIssueInventory(item)
        }}
        onAdjust={(item) => {
          setDetailSheetOpen(false)
          handleAdjustInventory(item)
        }}
      />

      {/* Delete Items Dialog */}
      <DeleteItemsDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        items={itemsToDelete}
        onSuccess={() => {
          setDeleteDialogOpen(false)
          handleRefresh()
        }}
      />
    </>
  )
}
