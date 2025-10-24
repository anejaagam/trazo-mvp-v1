'use client'

import { useState } from 'react'
import { ItemCatalog } from './item-catalog'
import { ItemFormDialog } from './item-form-dialog'
import { ReceiveInventoryDialog } from './receive-inventory-dialog'
import { IssueInventoryDialog } from './issue-inventory-dialog'
import { ItemDetailSheet } from './item-detail-sheet'
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
  const [detailSheetOpen, setDetailSheetOpen] = useState(false)
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

  const handleItemSelect = (item: InventoryItemWithStock) => {
    setSelectedItem(item)
    setDetailSheetOpen(true)
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
      />
    </>
  )
}
