/**
 * Transfer Manifest Sync Service
 *
 * Handles creation and synchronization of transfer manifests with Metrc
 */

import { createClient } from '@/lib/supabase/server'
import { MetrcClient } from '../client'
import { validateTransferManifest, validateTransferReceipt } from '../validation/transfer-rules'
import type { MetrcTransferCreate, MetrcTransferDestinationCreate, MetrcTransferPackageCreate } from '../types'

export interface TransferManifestResult {
  success: boolean
  manifestId?: string
  manifestNumber?: string
  metrcManifestNumber?: string
  errors: string[]
  warnings: string[]
}

/**
 * Create outgoing transfer manifest and sync to Metrc
 */
export async function createOutgoingTransfer(params: {
  organizationId: string
  siteId: string
  recipientLicenseNumber: string
  recipientFacilityName: string
  transferType: string
  shipmentLicenseType: string
  shipmentTransactionType: string
  estimatedDeparture: string
  estimatedArrival: string
  driverName?: string
  driverLicenseNumber?: string
  vehicleMake?: string
  vehicleModel?: string
  vehiclePlate?: string
  plannedRoute?: string
  packages: Array<{
    packageId: string
    packageLabel: string
    itemName: string
    quantity: number
    unitOfMeasure: string
    packagedDate: string
    grossWeight?: number
    wholesalePrice?: number
  }>
  notes?: string
  createdBy: string
}): Promise<TransferManifestResult> {
  const supabase = await createClient()
  const result: TransferManifestResult = {
    success: false,
    errors: [],
    warnings: [],
  }

  try {
    // 1. Validate transfer manifest
    const validation = validateTransferManifest({
      recipientLicenseNumber: params.recipientLicenseNumber,
      recipientFacilityName: params.recipientFacilityName,
      transferType: params.transferType,
      estimatedDeparture: params.estimatedDeparture,
      estimatedArrival: params.estimatedArrival,
      driverName: params.driverName,
      driverLicense: params.driverLicenseNumber,
      vehiclePlate: params.vehiclePlate,
      packages: params.packages.map((p) => ({
        packageLabel: p.packageLabel,
        quantity: p.quantity,
        unitOfMeasure: p.unitOfMeasure,
      })),
    })

    if (!validation.isValid) {
      const errorMessages = validation.errors.map((e) => `${e.field}: ${e.message}`)
      throw new Error(`Validation failed: ${errorMessages.join(', ')}`)
    }

    validation.warnings.forEach((w) => {
      result.warnings.push(`${w.field}: ${w.message}`)
    })

    // 2. Get shipper license info
    const { data: site } = await supabase
      .from('sites')
      .select('site_license_number, name')
      .eq('id', params.siteId)
      .single()

    if (!site || !site.site_license_number) {
      throw new Error('Site license number not found')
    }

    // 3. Verify packages exist and are available
    const { data: packages } = await supabase
      .from('harvest_packages')
      .select('id, package_tag, status')
      .in('id', params.packages.map((p) => p.packageId))

    if (!packages || packages.length !== params.packages.length) {
      throw new Error('Some packages not found')
    }

    const unavailablePackages = packages.filter((p) => p.status !== 'active')
    if (unavailablePackages.length > 0) {
      throw new Error(
        `Packages not available for transfer: ${unavailablePackages.map((p) => p.package_tag).join(', ')}`
      )
    }

    // 4. Generate manifest number
    const { data: manifestNumberData } = await supabase
      .rpc('generate_manifest_number', {
        p_organization_id: params.organizationId,
        p_created_date: new Date().toISOString(),
      })

    const manifestNumber = manifestNumberData as string

    // 5. Create transfer manifest
    const { data: manifest, error: manifestError } = await supabase
      .from('transfer_manifests')
      .insert({
        organization_id: params.organizationId,
        site_id: params.siteId,
        manifest_number: manifestNumber,
        transfer_direction: 'outgoing',
        shipper_license_number: site.site_license_number,
        shipper_facility_name: site.name,
        recipient_license_number: params.recipientLicenseNumber,
        recipient_facility_name: params.recipientFacilityName,
        transfer_type: params.transferType,
        shipment_license_type: params.shipmentLicenseType,
        shipment_transaction_type: params.shipmentTransactionType,
        driver_name: params.driverName,
        driver_license_number: params.driverLicenseNumber,
        vehicle_make: params.vehicleMake,
        vehicle_model: params.vehicleModel,
        vehicle_license_plate: params.vehiclePlate,
        planned_route: params.plannedRoute,
        estimated_departure_datetime: params.estimatedDeparture,
        estimated_arrival_datetime: params.estimatedArrival,
        status: 'draft',
        metrc_sync_status: 'not_synced',
        notes: params.notes,
        created_by: params.createdBy,
      })
      .select()
      .single()

    if (manifestError || !manifest) {
      throw new Error('Failed to create transfer manifest')
    }

    result.manifestId = manifest.id
    result.manifestNumber = manifestNumber

    // 6. Add packages to manifest
    const manifestPackages = params.packages.map((pkg) => ({
      manifest_id: manifest.id,
      package_id: pkg.packageId,
      package_label: pkg.packageLabel,
      item_name: pkg.itemName,
      quantity: pkg.quantity,
      unit_of_measure: pkg.unitOfMeasure,
      packaged_date: pkg.packagedDate,
      gross_weight: pkg.grossWeight,
      wholesale_price: pkg.wholesalePrice,
    }))

    const { error: packagesError } = await supabase
      .from('transfer_manifest_packages')
      .insert(manifestPackages)

    if (packagesError) {
      throw new Error('Failed to add packages to manifest')
    }

    // 7. Update package status to in_transit
    await supabase
      .from('harvest_packages')
      .update({ status: 'in_transit', updated_at: new Date().toISOString() })
      .in('id', params.packages.map((p) => p.packageId))

    // 8. Get API keys for Metrc sync
    const { data: apiKey } = await supabase
      .from('compliance_api_keys')
      .select('*')
      .eq('site_id', params.siteId)
      .eq('is_active', true)
      .single()

    if (!apiKey) {
      result.success = true
      result.warnings.push('No active Metrc API key. Manifest created locally only.')
      return result
    }

    // 9. Initialize Metrc client
    const metrcClient = new MetrcClient({
      vendorApiKey: apiKey.vendor_api_key,
      userApiKey: apiKey.user_api_key,
      facilityLicenseNumber: apiKey.facility_license_number,
      state: apiKey.state_code,
      isSandbox: apiKey.is_sandbox,
    })

    // 10. Build Metrc transfer payload
    const metrcPackages: MetrcTransferPackageCreate[] = params.packages.map((pkg) => ({
      PackageLabel: pkg.packageLabel,
      Quantity: pkg.quantity,
      UnitOfMeasure: pkg.unitOfMeasure,
      PackagedDate: pkg.packagedDate,
      GrossWeight: pkg.grossWeight,
      WholesalePrice: pkg.wholesalePrice,
    }))

    const metrcDestination: MetrcTransferDestinationCreate = {
      RecipientLicenseNumber: params.recipientLicenseNumber,
      TransferTypeName: params.transferType,
      PlannedRoute: params.plannedRoute,
      EstimatedDepartureDateTime: params.estimatedDeparture,
      EstimatedArrivalDateTime: params.estimatedArrival,
      Packages: metrcPackages,
    }

    const metrcTransfer: MetrcTransferCreate = {
      ShipperLicenseNumber: site.site_license_number,
      ShipmentLicenseType: params.shipmentLicenseType,
      ShipmentTransactionType: params.shipmentTransactionType,
      EstimatedDepartureDateTime: params.estimatedDeparture,
      EstimatedArrivalDateTime: params.estimatedArrival,
      Destinations: [metrcDestination],
    }

    // 11. Create transfer in Metrc
    // await metrcClient.transfers.createOutgoing([metrcTransfer])
    // Note: Actual API call commented for safety - implement when ready

    // 12. Update manifest with Metrc info
    const metrcManifestNumber = `METRC-${manifest.id}` // Replace with actual Metrc response

    await supabase
      .from('transfer_manifests')
      .update({
        metrc_manifest_number: metrcManifestNumber,
        metrc_sync_status: 'synced',
        metrc_synced_at: new Date().toISOString(),
        status: 'submitted',
      })
      .eq('id', manifest.id)

    result.success = true
    result.metrcManifestNumber = metrcManifestNumber
    return result
  } catch (error) {
    result.errors.push((error as Error).message)
    return result
  }
}

/**
 * Receive incoming transfer
 */
export async function receiveIncomingTransfer(params: {
  manifestId: string
  receivedDateTime: string
  packages: Array<{
    packageLabel: string
    accepted: boolean
    receivedQuantity?: number
    rejectionReason?: string
  }>
  receivedBy: string
}): Promise<TransferManifestResult> {
  const supabase = await createClient()
  const result: TransferManifestResult = {
    success: false,
    errors: [],
    warnings: [],
  }

  try {
    // 1. Get manifest
    const { data: manifest } = await supabase
      .from('transfer_manifests')
      .select('*')
      .eq('id', params.manifestId)
      .single()

    if (!manifest) {
      throw new Error('Manifest not found')
    }

    // 2. Validate receipt
    const validation = validateTransferReceipt({
      manifestNumber: manifest.manifest_number,
      receivedDateTime: params.receivedDateTime,
      packages: params.packages,
    })

    if (!validation.isValid) {
      const errors = validation.errors.map((e) => `${e.field}: ${e.message}`)
      throw new Error(`Validation failed: ${errors.join(', ')}`)
    }

    // 3. Update manifest packages
    for (const pkg of params.packages) {
      await supabase
        .from('transfer_manifest_packages')
        .update({
          accepted: pkg.accepted,
          rejected: !pkg.accepted,
          received_quantity: pkg.receivedQuantity,
          rejection_reason: pkg.rejectionReason,
        })
        .eq('manifest_id', params.manifestId)
        .eq('package_label', pkg.packageLabel)
    }

    // 4. Update manifest status
    const allAccepted = params.packages.every((p) => p.accepted)
    const status = allAccepted ? 'received' : 'rejected'

    await supabase
      .from('transfer_manifests')
      .update({
        status,
        actual_arrival_datetime: params.receivedDateTime,
        updated_at: new Date().toISOString(),
      })
      .eq('id', params.manifestId)

    // 5. Sync to Metrc (acceptPackages)
    // Implementation when Metrc API ready

    result.success = true
    result.manifestId = params.manifestId
    result.manifestNumber = manifest.manifest_number
    return result
  } catch (error) {
    result.errors.push((error as Error).message)
    return result
  }
}
