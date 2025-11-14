export type AllocationMethod = 'FIFO' | 'LIFO' | 'FEFO'

interface IssueInventoryForBatchParams {
  itemId: string
  organizationId: string
  siteId: string
  batchId: string
  quantity: number
  allocationMethod?: AllocationMethod
  lotId?: string
  fromLocation?: string | null
  toLocation?: string | null
  reason?: string | null
  notes?: string | null
}

interface ReceiveInventoryForBatchParams {
  itemId: string
  organizationId: string
  siteId: string
  batchId: string
  quantity: number
  unitOfMeasure: string
  lotCode: string
  receivedDate?: string
  expiryDate?: string | null
  storageLocation?: string | null
  supplierName?: string | null
  notes?: string | null
}

async function handleApiResponse(response: Response) {
  const payload = await response.json().catch(() => ({}))
  if (!response.ok) {
    const message =
      payload?.error || payload?.message || `Request failed with status ${response.status}`
    throw new Error(message)
  }
  return payload
}

export async function issueInventoryForBatch(params: IssueInventoryForBatchParams) {
  const {
    itemId,
    organizationId,
    siteId,
    batchId,
    quantity,
    allocationMethod = 'FIFO',
    lotId,
    fromLocation,
    toLocation,
    reason,
    notes,
  } = params

  const body: Record<string, unknown> = {
    item_id: itemId,
    quantity,
    organization_id: organizationId,
    site_id: siteId,
    batch_id: batchId,
    to_location: toLocation ?? undefined,
    from_location: fromLocation ?? undefined,
    reason: reason ?? undefined,
    notes: notes ?? undefined,
  }

  if (lotId) {
    body.lot_allocations = [{ lot_id: lotId, quantity }]
    body.allocation_method = 'manual'
  } else {
    body.allocation_method = allocationMethod
  }

  const response = await fetch('/api/inventory/issue', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })

  return handleApiResponse(response)
}

export async function receiveInventoryForBatch(params: ReceiveInventoryForBatchParams) {
  const {
    itemId,
    organizationId,
    siteId,
    batchId,
    quantity,
    unitOfMeasure,
    lotCode,
    receivedDate,
    expiryDate,
    storageLocation,
    supplierName,
    notes,
  } = params

  const body = {
    item_id: itemId,
    quantity_received: quantity,
    unit_of_measure: unitOfMeasure,
    lot_code: lotCode,
    received_date: receivedDate || new Date().toISOString(),
    expiry_date: expiryDate || undefined,
    storage_location: storageLocation || undefined,
    supplier_name: supplierName || undefined,
    notes: notes || undefined,
    organization_id: organizationId,
    site_id: siteId,
    batch_id: batchId,
  }

  const response = await fetch('/api/inventory/receive', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })

  return handleApiResponse(response)
}

export function getDefaultLotCode(batchNumber: string) {
  const date = new Date()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${batchNumber}-${date.getFullYear()}${month}${day}`
}
