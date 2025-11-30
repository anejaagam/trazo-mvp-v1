'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Truck,
  Package,
  Calendar,
  MapPin,
  AlertCircle,
  CheckCircle2,
  Clock,
  ExternalLink,
} from 'lucide-react'
import { formatDate } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import { ReceiveTransferDialog } from './receive-transfer-dialog'

interface TransferManifest {
  id: string
  manifest_number: string
  metrc_manifest_number?: string
  transfer_direction: 'outgoing' | 'incoming'
  status: string
  recipient_license_number: string
  recipient_facility_name: string
  shipper_license_number?: string
  shipper_facility_name?: string
  estimated_departure_datetime: string
  estimated_arrival_datetime: string
  actual_departure_datetime?: string
  actual_arrival_datetime?: string
  driver_name?: string
  vehicle_license_plate?: string
  metrc_sync_status: string
  created_at: string
  packages?: Array<{
    id: string
    package_label: string
    item_name: string
    quantity: number
    unit_of_measure: string
    accepted?: boolean
    rejected?: boolean
  }>
}

interface TransferListProps {
  organizationId: string
  siteId?: string
  onTransferSelect?: (transferId: string) => void
}

const statusColors: Record<string, string> = {
  draft: 'bg-gray-500',
  submitted: 'bg-blue-500',
  in_transit: 'bg-yellow-500',
  received: 'bg-green-500',
  rejected: 'bg-red-500',
  cancelled: 'bg-gray-400',
}

const statusLabels: Record<string, string> = {
  draft: 'Draft',
  submitted: 'Submitted',
  in_transit: 'In Transit',
  received: 'Received',
  rejected: 'Rejected',
  cancelled: 'Cancelled',
}

export function TransferList({ organizationId, siteId, onTransferSelect }: TransferListProps) {
  const [transfers, setTransfers] = useState<TransferManifest[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<string>('all')

  useEffect(() => {
    loadTransfers()
  }, [organizationId, siteId])

  const loadTransfers = async () => {
    try {
      setLoading(true)
      const supabase = createClient()

      let query = supabase
        .from('transfer_manifests')
        .select(`
          *,
          packages:transfer_manifest_packages(
            id,
            package_label,
            item_name,
            quantity,
            unit_of_measure,
            accepted,
            rejected
          )
        `)
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false })

      if (siteId) {
        query = query.eq('site_id', siteId)
      }

      const { data, error } = await query

      if (error) {
        console.error('Failed to load transfers:', error)
        setTransfers([])
      } else {
        setTransfers(data as TransferManifest[])
      }
    } catch (error) {
      console.error('Failed to load transfers:', error)
      setTransfers([])
    } finally {
      setLoading(false)
    }
  }

  const filteredTransfers = transfers.filter((transfer) => {
    if (activeTab === 'all') return true
    if (activeTab === 'outgoing') return transfer.transfer_direction === 'outgoing'
    if (activeTab === 'incoming') return transfer.transfer_direction === 'incoming'
    if (activeTab === 'pending') {
      return ['draft', 'submitted', 'in_transit'].includes(transfer.status)
    }
    return transfer.status === activeTab
  })

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="text-center text-muted-foreground">Loading transfers...</div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Truck className="h-5 w-5" />
          Transfer Manifests
        </CardTitle>
        <CardDescription>Outgoing and incoming cannabis transfers</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="outgoing">Outgoing</TabsTrigger>
            <TabsTrigger value="incoming">Incoming</TabsTrigger>
            <TabsTrigger value="pending">Pending</TabsTrigger>
            <TabsTrigger value="received">Received</TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab}>
            {filteredTransfers.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No transfers found
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Manifest #</TableHead>
                    <TableHead>Direction</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>From/To</TableHead>
                    <TableHead>Packages</TableHead>
                    <TableHead>Departure</TableHead>
                    <TableHead>Arrival</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTransfers.map((transfer) => (
                    <TableRow key={transfer.id}>
                      <TableCell>
                        <div className="font-medium">{transfer.manifest_number}</div>
                        {transfer.metrc_manifest_number && (
                          <div className="text-xs text-muted-foreground flex items-center gap-1">
                            <ExternalLink className="h-3 w-3" />
                            {transfer.metrc_manifest_number}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={transfer.transfer_direction === 'outgoing' ? 'default' : 'outline'}>
                          {transfer.transfer_direction === 'outgoing' ? 'Outgoing' : 'Incoming'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={statusColors[transfer.status]}>
                          {statusLabels[transfer.status]}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {transfer.transfer_direction === 'outgoing' ? (
                            <>
                              <div className="font-medium">{transfer.recipient_facility_name}</div>
                              <div className="text-muted-foreground">{transfer.recipient_license_number}</div>
                            </>
                          ) : (
                            <>
                              <div className="font-medium">{transfer.shipper_facility_name}</div>
                              <div className="text-muted-foreground">{transfer.shipper_license_number}</div>
                            </>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm">
                          <Package className="h-3 w-3" />
                          {transfer.packages?.length || 0}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {formatDate(transfer.estimated_departure_datetime)}
                        </div>
                        {transfer.actual_departure_datetime && (
                          <div className="text-xs text-green-600">
                            Actual: {formatDate(transfer.actual_departure_datetime)}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {formatDate(transfer.estimated_arrival_datetime)}
                        </div>
                        {transfer.actual_arrival_datetime && (
                          <div className="text-xs text-green-600">
                            Actual: {formatDate(transfer.actual_arrival_datetime)}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        {transfer.transfer_direction === 'incoming' &&
                         transfer.status === 'in_transit' && (
                          <ReceiveTransferDialog
                            manifestId={transfer.id}
                            manifestNumber={transfer.manifest_number}
                            packages={(transfer.packages || []).map(pkg => ({
                              id: pkg.id,
                              packageLabel: pkg.package_label,
                              itemName: pkg.item_name,
                              quantity: pkg.quantity,
                              unitOfMeasure: pkg.unit_of_measure,
                            }))}
                            onReceived={loadTransfers}
                            trigger={
                              <Button size="sm" variant="outline">
                                <CheckCircle2 className="h-4 w-4 mr-1" />
                                Receive
                              </Button>
                            }
                          />
                        )}
                        {transfer.status === 'draft' && (
                          <Button size="sm" variant="ghost">
                            Edit
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
