import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import { Alert, AlertDescription } from '../../components/ui/alert';
import { 
  Package, 
  QrCode, 
  CheckCircle,
  AlertTriangle,
  Leaf,
  Shield
} from 'lucide-react';
import { IProduceBatch, IProduceCultivar } from '../types/domains/produce';

interface PackagingDetails {
  packagingType: PackagingType;
  containerSize: string;
  unitsPerContainer: number;
  totalContainers: number;
  netWeight: number;
  grossWeight: number;
  packagingMaterial: string;
  lotNumber: string;
  packDate: string;
  useByDate?: string;
}

interface LabelingInfo {
  productName: string;
  varietyName: string;
  growerName: string;
  growerAddress: string;
  countryOfOrigin: string;
  placeOfOrigin: string;
  harvestDate: string;
  barcodeType: 'UPC' | 'EAN' | 'QR' | 'GS1';
  barcodeValue: string;
  nutritionalInfoIncluded: boolean;
}

interface FoodSafetyCompliance {
  gapCertified: boolean;
  organicCertified: boolean;
  fsmaCompliant: boolean;
  traceLotNumber: string;
  coolChainMaintained: boolean;
  lastInspectionDate?: string;
  allergenWarnings: string[];
  handlingInstructions: string;
}

type PackagingType = 
  | 'clamshell' 
  | 'bag' 
  | 'box' 
  | 'carton' 
  | 'bulk_bin' 
  | 'pallet' 
  | 'tote' 
  | 'other';

interface ProducePackagingProps {
  batch: IProduceBatch;
  cultivar?: IProduceCultivar;
  onPackagingComplete?: (details: PackagingDetails & LabelingInfo & FoodSafetyCompliance) => void;
}

export const ProducePackaging: React.FC<ProducePackagingProps> = ({
  batch,
  cultivar,
  onPackagingComplete
}) => {
  const [packagingDetails, setPackagingDetails] = useState<PackagingDetails>({
    packagingType: 'clamshell',
    containerSize: '1 lb',
    unitsPerContainer: 1,
    totalContainers: 0,
    netWeight: 0,
    grossWeight: 0,
    packagingMaterial: 'PET plastic',
    lotNumber: `LOT-${batch.id.slice(-8)}`,
    packDate: new Date().toISOString().split('T')[0] || '',
    useByDate: undefined
  });

  const [labelingInfo, setLabelingInfo] = useState<LabelingInfo>({
    productName: cultivar?.name || batch.cultivarId || '',
    varietyName: cultivar?.name || '',
    growerName: 'Sample Grower',
    growerAddress: '123 Farm Road, City, State 12345',
    countryOfOrigin: 'USA',
    placeOfOrigin: 'California',
    harvestDate: batch.estimatedHarvestDate || new Date().toISOString().split('T')[0] || '',
    barcodeType: 'QR',
    barcodeValue: `BATCH-${batch.id}`,
    nutritionalInfoIncluded: false
  });

  const [foodSafety, setFoodSafety] = useState<FoodSafetyCompliance>({
    gapCertified: batch.gapCertified || false,
    organicCertified: batch.organicCertified || false,
    fsmaCompliant: true,
    traceLotNumber: packagingDetails.lotNumber,
    coolChainMaintained: true,
    lastInspectionDate: undefined,
    allergenWarnings: [],
    handlingInstructions: 'Keep refrigerated. Wash before consuming.'
  });

  const packagingTypeOptions: { value: PackagingType; label: string }[] = [
    { value: 'clamshell', label: 'Clamshell (plastic container)' },
    { value: 'bag', label: 'Bag (mesh/plastic)' },
    { value: 'box', label: 'Box (cardboard)' },
    { value: 'carton', label: 'Carton (waxed cardboard)' },
    { value: 'bulk_bin', label: 'Bulk Bin' },
    { value: 'pallet', label: 'Pallet' },
    { value: 'tote', label: 'Tote' },
    { value: 'other', label: 'Other' }
  ];

  const barcodeTypeOptions = [
    { value: 'UPC', label: 'UPC (Universal Product Code)' },
    { value: 'EAN', label: 'EAN (European Article Number)' },
    { value: 'QR', label: 'QR Code' },
    { value: 'GS1', label: 'GS1 DataBar' }
  ];

  const commonAllergens = [
    'Contains nuts',
    'Processed in facility with nuts',
    'May contain sulfites',
    'Contains soy',
    'Processed on shared equipment with wheat'
  ];

  const handlePackagingChange = (field: keyof PackagingDetails, value: string | number) => {
    setPackagingDetails(prev => ({ ...prev, [field]: value }));
  };

  const handleLabelingChange = (field: keyof LabelingInfo, value: string | boolean) => {
    setLabelingInfo(prev => ({ ...prev, [field]: value }));
  };

  const handleFoodSafetyChange = (field: keyof FoodSafetyCompliance, value: string | boolean | string[]) => {
    setFoodSafety(prev => ({ ...prev, [field]: value }));
  };

  const validatePackaging = (): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];

    if (!packagingDetails.lotNumber) errors.push('Lot number is required');
    if (packagingDetails.totalContainers <= 0) errors.push('Total containers must be greater than 0');
    if (packagingDetails.netWeight <= 0) errors.push('Net weight must be greater than 0');
    if (!labelingInfo.productName) errors.push('Product name is required');
    if (!labelingInfo.harvestDate) errors.push('Harvest date is required');
    if (!labelingInfo.barcodeValue) errors.push('Barcode value is required');
    if (foodSafety.gapCertified && !foodSafety.lastInspectionDate) {
      errors.push('GAP certification requires last inspection date');
    }

    return { isValid: errors.length === 0, errors };
  };

  const handleCompletePackaging = () => {
    const validation = validatePackaging();
    if (validation.isValid) {
      onPackagingComplete?.({
        ...packagingDetails,
        ...labelingInfo,
        ...foodSafety
      });
    }
  };

  const validation = validatePackaging();

  return (
    <div className="space-y-4">
      {/* Validation Errors */}
      {!validation.isValid && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <div className="font-medium mb-1">Please fix the following errors:</div>
            <ul className="list-disc list-inside text-sm">
              {validation.errors.map((error, idx) => (
                <li key={idx}>{error}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {/* Packaging Details */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Packaging Details
          </CardTitle>
          <CardDescription>Configure packaging type and quantities</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="packaging-type">Packaging Type</Label>
              <select
                id="packaging-type"
                value={packagingDetails.packagingType}
                onChange={(e) => handlePackagingChange('packagingType', e.target.value)}
                className="w-full p-2 border rounded-md"
              >
                {packagingTypeOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="container-size">Container Size</Label>
              <Input
                id="container-size"
                value={packagingDetails.containerSize}
                onChange={(e) => handlePackagingChange('containerSize', e.target.value)}
                placeholder="e.g., 1 lb, 500g, 12 oz"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="units-per-container">Units per Container</Label>
              <Input
                id="units-per-container"
                type="number"
                value={packagingDetails.unitsPerContainer}
                onChange={(e) => handlePackagingChange('unitsPerContainer', parseInt(e.target.value))}
                min={1}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="total-containers">Total Containers</Label>
              <Input
                id="total-containers"
                type="number"
                value={packagingDetails.totalContainers}
                onChange={(e) => handlePackagingChange('totalContainers', parseInt(e.target.value))}
                min={0}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="net-weight">Net Weight (lbs)</Label>
              <Input
                id="net-weight"
                type="number"
                step={0.1}
                value={packagingDetails.netWeight}
                onChange={(e) => handlePackagingChange('netWeight', parseFloat(e.target.value))}
                min={0}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="gross-weight">Gross Weight (lbs)</Label>
              <Input
                id="gross-weight"
                type="number"
                step={0.1}
                value={packagingDetails.grossWeight}
                onChange={(e) => handlePackagingChange('grossWeight', parseFloat(e.target.value))}
                min={0}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="packaging-material">Packaging Material</Label>
              <Input
                id="packaging-material"
                value={packagingDetails.packagingMaterial}
                onChange={(e) => handlePackagingChange('packagingMaterial', e.target.value)}
                placeholder="e.g., PET plastic, cardboard"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="lot-number">Lot Number</Label>
              <Input
                id="lot-number"
                value={packagingDetails.lotNumber}
                onChange={(e) => handlePackagingChange('lotNumber', e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="pack-date">Pack Date</Label>
              <Input
                id="pack-date"
                type="date"
                value={packagingDetails.packDate}
                onChange={(e) => handlePackagingChange('packDate', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="use-by-date">Use By Date (Optional)</Label>
              <Input
                id="use-by-date"
                type="date"
                value={packagingDetails.useByDate || ''}
                onChange={(e) => handlePackagingChange('useByDate', e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Labeling Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <QrCode className="h-5 w-5" />
            Labeling Information
          </CardTitle>
          <CardDescription>Product labeling and traceability details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="product-name">Product Name</Label>
              <Input
                id="product-name"
                value={labelingInfo.productName}
                onChange={(e) => handleLabelingChange('productName', e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="variety-name">Variety Name</Label>
              <Input
                id="variety-name"
                value={labelingInfo.varietyName}
                onChange={(e) => handleLabelingChange('varietyName', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="grower-name">Grower Name</Label>
              <Input
                id="grower-name"
                value={labelingInfo.growerName}
                onChange={(e) => handleLabelingChange('growerName', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="harvest-date">Harvest Date</Label>
              <Input
                id="harvest-date"
                type="date"
                value={labelingInfo.harvestDate}
                onChange={(e) => handleLabelingChange('harvestDate', e.target.value)}
                required
              />
            </div>

            <div className="col-span-2 space-y-2">
              <Label htmlFor="grower-address">Grower Address</Label>
              <Input
                id="grower-address"
                value={labelingInfo.growerAddress}
                onChange={(e) => handleLabelingChange('growerAddress', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="country-origin">Country of Origin</Label>
              <Input
                id="country-origin"
                value={labelingInfo.countryOfOrigin}
                onChange={(e) => handleLabelingChange('countryOfOrigin', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="place-origin">Place of Origin</Label>
              <Input
                id="place-origin"
                value={labelingInfo.placeOfOrigin}
                onChange={(e) => handleLabelingChange('placeOfOrigin', e.target.value)}
                placeholder="State/Region"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="barcode-type">Barcode Type</Label>
              <select
                id="barcode-type"
                value={labelingInfo.barcodeType}
                onChange={(e) => handleLabelingChange('barcodeType', e.target.value)}
                className="w-full p-2 border rounded-md"
              >
                {barcodeTypeOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="barcode-value">Barcode Value</Label>
              <Input
                id="barcode-value"
                value={labelingInfo.barcodeValue}
                onChange={(e) => handleLabelingChange('barcodeValue', e.target.value)}
                required
              />
            </div>

            <div className="col-span-2">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={labelingInfo.nutritionalInfoIncluded}
                  onChange={(e) => handleLabelingChange('nutritionalInfoIncluded', e.target.checked)}
                />
                <span className="text-sm">Include nutritional information on label</span>
              </label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Food Safety & Compliance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Food Safety & Compliance
          </CardTitle>
          <CardDescription>Certifications and safety requirements</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Leaf className="h-4 w-4 text-green-600" />
                <span className="font-medium">Certifications</span>
              </div>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={foodSafety.gapCertified}
                  onChange={(e) => handleFoodSafetyChange('gapCertified', e.target.checked)}
                />
                <span className="text-sm">GAP Certified (Good Agricultural Practices)</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={foodSafety.organicCertified}
                  onChange={(e) => handleFoodSafetyChange('organicCertified', e.target.checked)}
                />
                <span className="text-sm">USDA Organic Certified</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={foodSafety.fsmaCompliant}
                  onChange={(e) => handleFoodSafetyChange('fsmaCompliant', e.target.checked)}
                />
                <span className="text-sm">FSMA Compliant</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={foodSafety.coolChainMaintained}
                  onChange={(e) => handleFoodSafetyChange('coolChainMaintained', e.target.checked)}
                />
                <span className="text-sm">Cool Chain Maintained</span>
              </label>
            </div>

            <div className="space-y-2">
              <Label htmlFor="trace-lot">Trace Lot Number</Label>
              <Input
                id="trace-lot"
                value={foodSafety.traceLotNumber}
                onChange={(e) => handleFoodSafetyChange('traceLotNumber', e.target.value)}
                required
              />
              
              {foodSafety.gapCertified && (
                <>
                  <Label htmlFor="last-inspection">Last Inspection Date</Label>
                  <Input
                    id="last-inspection"
                    type="date"
                    value={foodSafety.lastInspectionDate || ''}
                    onChange={(e) => handleFoodSafetyChange('lastInspectionDate', e.target.value)}
                  />
                </>
              )}
            </div>

            <div className="col-span-2 space-y-2">
              <Label>Allergen Warnings</Label>
              <div className="grid grid-cols-2 gap-2">
                {commonAllergens.map(allergen => (
                  <label key={allergen} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={foodSafety.allergenWarnings.includes(allergen)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          handleFoodSafetyChange('allergenWarnings', [...foodSafety.allergenWarnings, allergen]);
                        } else {
                          handleFoodSafetyChange(
                            'allergenWarnings', 
                            foodSafety.allergenWarnings.filter(a => a !== allergen)
                          );
                        }
                      }}
                    />
                    <span className="text-sm">{allergen}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="col-span-2 space-y-2">
              <Label htmlFor="handling-instructions">Handling Instructions</Label>
              <Textarea
                id="handling-instructions"
                value={foodSafety.handlingInstructions}
                onChange={(e) => handleFoodSafetyChange('handlingInstructions', e.target.value)}
                rows={3}
                placeholder="Storage and handling instructions for consumers"
              />
            </div>
          </div>

          {/* Compliance Status */}
          <div className="border-t pt-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {validation.isValid ? (
                  <>
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <span className="font-medium text-green-600">Ready for Packaging</span>
                  </>
                ) : (
                  <>
                    <AlertTriangle className="h-5 w-5 text-orange-600" />
                    <span className="font-medium text-orange-600">Incomplete Information</span>
                  </>
                )}
              </div>
              <div className="flex gap-2">
                {foodSafety.gapCertified && <Badge variant="outline">GAP</Badge>}
                {foodSafety.organicCertified && <Badge variant="outline">Organic</Badge>}
                {foodSafety.fsmaCompliant && <Badge variant="outline">FSMA</Badge>}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Complete Packaging Button */}
      <div className="flex justify-end">
        <Button 
          onClick={handleCompletePackaging}
          disabled={!validation.isValid}
          className="w-full sm:w-auto"
        >
          <Package className="h-4 w-4 mr-2" />
          Complete Packaging
        </Button>
      </div>
    </div>
  );
};
