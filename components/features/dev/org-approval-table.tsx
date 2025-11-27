'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Check, X, Loader2, Building2, MapPin, Leaf } from 'lucide-react'
import { toast } from 'sonner'
import { approveOrganization, rejectOrganization, type OrganizationWithApproval } from '@/lib/supabase/queries/organization-approval'
import { formatDistanceToNow } from 'date-fns'

interface OrgApprovalTableProps {
  organizations: OrganizationWithApproval[]
  developerId: string
}

export function OrgApprovalTable({ organizations, developerId }: OrgApprovalTableProps) {
  const router = useRouter()
  const [loadingId, setLoadingId] = useState<string | null>(null)

  const handleApprove = async (orgId: string, orgName: string) => {
    setLoadingId(orgId)
    try {
      const { success, error } = await approveOrganization(orgId, developerId)
      
      if (success) {
        toast.success('Organization approved', {
          description: `${orgName} can now access the platform.`,
        })
        router.refresh()
      } else {
        toast.error('Failed to approve organization', {
          description: error || 'Please try again.',
        })
      }
    } catch {
      toast.error('An error occurred', {
        description: 'Please try again later.',
      })
    } finally {
      setLoadingId(null)
    }
  }

  const handleReject = async (orgId: string, orgName: string) => {
    setLoadingId(orgId)
    try {
      const { success, error } = await rejectOrganization(orgId, developerId)
      
      if (success) {
        toast.success('Organization rejected', {
          description: `${orgName} has been denied access.`,
        })
        router.refresh()
      } else {
        toast.error('Failed to reject organization', {
          description: error || 'Please try again.',
        })
      }
    } catch {
      toast.error('An error occurred', {
        description: 'Please try again later.',
      })
    } finally {
      setLoadingId(null)
    }
  }

  if (organizations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-purple-200 bg-purple-50/50 py-12 dark:border-purple-800 dark:bg-purple-900/10">
        <Building2 className="mb-3 h-10 w-10 text-purple-400" />
        <p className="text-sm text-muted-foreground">No pending organizations</p>
        <p className="text-xs text-muted-foreground">All caught up!</p>
      </div>
    )
  }

  const getJurisdictionLabel = (jurisdiction: string) => {
    const labels: Record<string, string> = {
      'oregon_cannabis': 'Oregon Cannabis',
      'maryland_cannabis': 'Maryland Cannabis',
      'canada_cannabis': 'Canada Cannabis',
      'primus_gfs': 'PrimusGFS',
    }
    return labels[jurisdiction] || jurisdiction
  }

  return (
    <div className="rounded-lg border border-purple-200 dark:border-purple-800">
      <Table>
        <TableHeader>
          <TableRow className="bg-purple-50 dark:bg-purple-900/20">
            <TableHead>Organization</TableHead>
            <TableHead>Contact</TableHead>
            <TableHead>Jurisdiction</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Region</TableHead>
            <TableHead>Created</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {organizations.map((org) => (
            <TableRow key={org.id}>
              <TableCell>
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="font-medium">{org.name}</p>
                    {org.license_number && (
                      <p className="text-xs text-muted-foreground">
                        License: {org.license_number}
                      </p>
                    )}
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <div>
                  <p className="text-sm">{org.contact_email || '—'}</p>
                  <p className="text-xs text-muted-foreground">
                    {org.contact_phone || 'No phone'}
                  </p>
                </div>
              </TableCell>
              <TableCell>
                <Badge variant="outline" className="text-xs">
                  {getJurisdictionLabel(org.jurisdiction)}
                </Badge>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-1">
                  <Leaf className="h-3 w-3 text-green-500" />
                  <span className="text-sm capitalize">{org.plant_type}</span>
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-1">
                  <MapPin className="h-3 w-3 text-muted-foreground" />
                  <span className="text-sm uppercase">{org.data_region}</span>
                </div>
              </TableCell>
              <TableCell>
                <p className="text-sm text-muted-foreground">
                  {formatDistanceToNow(new Date(org.created_at), { addSuffix: true })}
                </p>
              </TableCell>
              <TableCell className="text-right">
                <div className="flex items-center justify-end gap-2">
                  {/* Approve Button */}
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 border-green-200 text-green-600 hover:bg-green-50 dark:border-green-800 dark:text-green-400 dark:hover:bg-green-900/20"
                        disabled={loadingId === org.id}
                      >
                        {loadingId === org.id ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <Check className="h-3 w-3" />
                        )}
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Approve Organization</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to approve <strong>{org.name}</strong>?
                          <br />
                          <br />
                          They will be able to access the TRAZO platform and manage their cultivation operations.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          className="bg-green-600 hover:bg-green-700"
                          onClick={() => handleApprove(org.id, org.name)}
                        >
                          Approve
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>

                  {/* Reject Button */}
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 border-red-200 text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/20"
                        disabled={loadingId === org.id}
                      >
                        {loadingId === org.id ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <X className="h-3 w-3" />
                        )}
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Reject Organization</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to reject <strong>{org.name}</strong>?
                          <br />
                          <br />
                          They will not be able to access the TRAZO platform. You can manually notify them of the reason.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          className="bg-red-600 hover:bg-red-700"
                          onClick={() => handleReject(org.id, org.name)}
                        >
                          Reject
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
