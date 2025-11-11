import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { BatchGenealogy } from '../types/cultivar';
import { GitBranch, Package, Sprout, FileText } from 'lucide-react';

interface BatchGenealogyViewProps {
  genealogy: BatchGenealogy | null;
  cultivarName: string;
}

export function BatchGenealogyView({ genealogy, cultivarName }: BatchGenealogyViewProps) {
  if (!genealogy) {
    return (
      <Card className="p-6">
        <p className="text-gray-600">No genealogy information available for this batch.</p>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="flex items-center gap-2 mb-6">
        <GitBranch className="w-5 h-5 text-blue-600" />
        <h3 className="text-gray-900">Batch Genealogy</h3>
      </div>

      <div className="space-y-4">
        {/* Cultivar Info */}
        <div className="p-4 bg-blue-50 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Sprout className="w-5 h-5 text-blue-600" />
            <p className="text-gray-900">Cultivar</p>
          </div>
          <p className="text-gray-700">{cultivarName}</p>
        </div>

        {/* Source Type */}
        <div className="p-4 bg-gray-50 rounded-lg">
          <p className="text-gray-500 mb-2">Source Type</p>
          <Badge className={
            genealogy.source === 'seed' ? 'bg-green-100 text-green-800' :
            genealogy.source === 'transplant' ? 'bg-indigo-100 text-indigo-800' :
            'bg-purple-100 text-purple-800'
          }>
            {genealogy.source.replace('_', ' ')}
          </Badge>
        </div>

        {/* Seed Information */}
        {genealogy.source === 'seed' && (
          <>
            {genealogy.seedVendor && (
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-gray-500 mb-1">Seed Vendor</p>
                <p className="text-gray-900">{genealogy.seedVendor}</p>
              </div>
            )}
            
            {genealogy.seedLotNumber && (
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <Package className="w-4 h-4 text-gray-500" />
                  <p className="text-gray-500">Seed Lot Number</p>
                </div>
                <p className="text-gray-900 font-mono">{genealogy.seedLotNumber}</p>
              </div>
            )}
          </>
        )}

        {/* Transplant/Cutting Information */}
        {(genealogy.source === 'transplant' || genealogy.source === 'cutting') && (
          <>
            {genealogy.parentBatchId && (
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-gray-500 mb-1">Parent Batch</p>
                <p className="text-gray-900">{genealogy.parentBatchId}</p>
              </div>
            )}
            
            {genealogy.motherPlantId && (
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-gray-500 mb-1">Source Plant ID</p>
                <p className="text-gray-900 font-mono">{genealogy.motherPlantId}</p>
              </div>
            )}
          </>
        )}

        {/* Generation */}
        {genealogy.generationNumber && (
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-gray-500 mb-1">Generation</p>
            <p className="text-gray-900">Generation {genealogy.generationNumber}</p>
          </div>
        )}

        {/* Notes */}
        {genealogy.notes && (
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-2 mb-1">
              <FileText className="w-4 h-4 text-gray-500" />
              <p className="text-gray-500">Notes</p>
            </div>
            <p className="text-gray-700">{genealogy.notes}</p>
          </div>
        )}
      </div>
    </Card>
  );
}
