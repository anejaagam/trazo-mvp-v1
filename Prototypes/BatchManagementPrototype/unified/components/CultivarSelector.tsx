/**
 * Cultivar Selector Component
 * 
 * Domain-aware cultivar selection with search and filtering
 */

import { useState, useMemo } from 'react';
import { useDomain } from '../contexts/DomainContext';
import { Search, Plus } from 'lucide-react';
import type { DomainCultivar } from '../types/domains';

interface CultivarSelectorProps {
  cultivars: DomainCultivar[];
  selectedId?: string;
  onSelect: (cultivar: DomainCultivar) => void;
  onCreateNew?: () => void;
  placeholder?: string;
  error?: string;
}

export function CultivarSelector({
  cultivars,
  selectedId,
  onSelect,
  onCreateNew,
  placeholder,
  error,
}: CultivarSelectorProps) {
  const { config } = useDomain();
  const terminology = config.terminology;
  
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Find selected cultivar
  const selectedCultivar = useMemo(
    () => cultivars.find(c => c.id === selectedId),
    [cultivars, selectedId]
  );

  // Filter cultivars based on search
  const filteredCultivars = useMemo(() => {
    if (!searchTerm) return cultivars;
    
    const search = searchTerm.toLowerCase();
    return cultivars.filter(c => 
      c.name.toLowerCase().includes(search) ||
      c.description?.toLowerCase().includes(search)
    );
  }, [cultivars, searchTerm]);

  const handleSelect = (cultivar: DomainCultivar) => {
    onSelect(cultivar);
    setIsOpen(false);
    setSearchTerm('');
  };

  return (
    <div className="relative">
      {/* Selected Value / Trigger */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full px-3 py-2 text-left border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
          error ? 'border-red-500' : 'border-gray-300'
        } ${!selectedCultivar ? 'text-gray-400' : 'text-gray-900'}`}
      >
        {selectedCultivar ? selectedCultivar.name : placeholder || `Select ${terminology.cultivar}`}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-gray-300 rounded-md shadow-lg max-h-80 overflow-hidden">
          {/* Search */}
          <div className="p-2 border-b border-gray-200">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={`Search ${terminology.cultivars}...`}
                className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                autoFocus
              />
            </div>
          </div>

          {/* Create New Button */}
          {onCreateNew && (
            <button
              onClick={() => {
                onCreateNew();
                setIsOpen(false);
              }}
              className="w-full px-4 py-2 text-left text-blue-600 hover:bg-blue-50 flex items-center gap-2 border-b border-gray-200"
            >
              <Plus className="w-4 h-4" />
              <span>Create New {terminology.cultivar}</span>
            </button>
          )}

          {/* Cultivar List */}
          <div className="overflow-y-auto max-h-60">
            {filteredCultivars.length === 0 ? (
              <div className="px-4 py-8 text-center text-gray-500">
                No {terminology.cultivars} found
              </div>
            ) : (
              filteredCultivars.map((cultivar) => (
                <button
                  key={cultivar.id}
                  onClick={() => handleSelect(cultivar)}
                  className={`w-full px-4 py-2 text-left hover:bg-gray-50 ${
                    cultivar.id === selectedId ? 'bg-blue-50' : ''
                  }`}
                >
                  <div className="font-medium text-gray-900">{cultivar.name}</div>
                  {cultivar.description && (
                    <div className="text-sm text-gray-500 truncate">
                      {cultivar.description}
                    </div>
                  )}
                </button>
              ))
            )}
          </div>
        </div>
      )}

      {/* Click outside to close */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Error message */}
      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
    </div>
  );
}
