/**
 * Cultivar Management Component
 * 
 * Full cultivar management interface with search and CRUD operations
 */

import { useState } from 'react';
import { useDomain } from '../contexts/DomainContext';
import { CultivarModal } from './CultivarModal';
import { Search, Plus, Edit, Trash2 } from 'lucide-react';
import type { DomainCultivar } from '../types/domains';
import { isCannabisCultivar, isProduceCultivar } from '../types/domains';

interface CultivarManagementProps {
  cultivars: DomainCultivar[];
  onCreateCultivar: (cultivar: Partial<DomainCultivar>) => Promise<void>;
  onUpdateCultivar: (id: string, cultivar: Partial<DomainCultivar>) => Promise<void>;
  onDeleteCultivar: (id: string) => Promise<void>;
}

export function CultivarManagement({
  cultivars,
  onCreateCultivar,
  onUpdateCultivar,
  onDeleteCultivar,
}: CultivarManagementProps) {
  const { config } = useDomain();
  const terminology = config.terminology;
  
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [selectedCultivar, setSelectedCultivar] = useState<DomainCultivar | undefined>();

  // Filter cultivars
  const filteredCultivars = cultivars.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCreate = () => {
    setSelectedCultivar(undefined);
    setModalMode('create');
    setIsModalOpen(true);
  };

  const handleEdit = (cultivar: DomainCultivar) => {
    setSelectedCultivar(cultivar);
    setModalMode('edit');
    setIsModalOpen(true);
  };

  const handleSave = async (cultivar: Partial<DomainCultivar>) => {
    if (modalMode === 'create') {
      await onCreateCultivar(cultivar);
    } else if (selectedCultivar) {
      await onUpdateCultivar(selectedCultivar.id, cultivar);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm(`Are you sure you want to delete this ${terminology.cultivar}?`)) {
      await onDeleteCultivar(id);
    }
  };

  // Render cannabis-specific info
  const renderCannabisInfo = (cultivar: DomainCultivar) => {
    if (!isCannabisCultivar(cultivar)) return null;
    
    return (
      <div className="mt-2 flex flex-wrap gap-2">
        {cultivar.strainType && (
          <span className="px-2 py-1 text-xs font-medium rounded-full bg-purple-100 text-purple-800">
            {cultivar.strainType}
          </span>
        )}
        {cultivar.thcRange && (
          <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
            THC: {cultivar.thcRange.min}-{cultivar.thcRange.max}%
          </span>
        )}
        {cultivar.cbdRange && (
          <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
            CBD: {cultivar.cbdRange.min}-{cultivar.cbdRange.max}%
          </span>
        )}
      </div>
    );
  };

  // Render produce-specific info
  const renderProduceInfo = (cultivar: DomainCultivar) => {
    if (!isProduceCultivar(cultivar)) return null;
    
    return (
      <div className="mt-2 flex flex-wrap gap-2">
        {cultivar.category && (
          <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
            {cultivar.category.replace('_', ' ')}
          </span>
        )}
        {cultivar.storageLife && (
          <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
            Storage: {cultivar.storageLife} days
          </span>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            {terminology.cultivar} Management
          </h1>
          <p className="text-gray-500 mt-1">
            Manage {terminology.cultivars.toLowerCase()} for {config.name} production
          </p>
        </div>
        
        <button
          onClick={handleCreate}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus className="w-5 h-5" />
          Add {terminology.cultivar}
        </button>
      </div>

      {/* Search */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={`Search ${terminology.cultivars.toLowerCase()}...`}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Cultivar Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredCultivars.map((cultivar) => (
          <div
            key={cultivar.id}
            className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900">
                  {cultivar.name}
                </h3>
                {cultivar.description && (
                  <p className="mt-1 text-sm text-gray-500 line-clamp-2">
                    {cultivar.description}
                  </p>
                )}
                
                {/* Domain-specific info */}
                {renderCannabisInfo(cultivar)}
                {renderProduceInfo(cultivar)}
              </div>
              
              <div className="flex gap-2 ml-4">
                <button
                  onClick={() => handleEdit(cultivar)}
                  className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded"
                  title="Edit"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(cultivar.id)}
                  className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded"
                  title="Delete"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredCultivars.length === 0 && (
        <div className="bg-white p-12 rounded-lg shadow-sm border border-gray-200 text-center">
          <p className="text-gray-500">
            {searchTerm 
              ? `No ${terminology.cultivars.toLowerCase()} found matching "${searchTerm}"`
              : `No ${terminology.cultivars.toLowerCase()} yet. Create your first one to get started.`
            }
          </p>
        </div>
      )}

      {/* Modal */}
      <CultivarModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSave}
        cultivar={selectedCultivar}
        mode={modalMode}
      />
    </div>
  );
}
