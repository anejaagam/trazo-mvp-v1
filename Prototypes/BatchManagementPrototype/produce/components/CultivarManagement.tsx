import { useState } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Badge } from './ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from './ui/dialog';
import { ProduceVariety } from '../types/cultivar';
import { Sprout, Plus, Edit, Archive } from 'lucide-react';

interface CultivarManagementProps {
  cultivars: ProduceVariety[];
  onCreateCultivar: (cultivar: Omit<ProduceVariety, 'id' | 'createdAt'>) => void;
  onUpdateCultivar: (id: string, cultivar: Partial<ProduceVariety>) => void;
}

export function CultivarManagement({ cultivars, onCreateCultivar, onUpdateCultivar }: CultivarManagementProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCultivar, setEditingCultivar] = useState<ProduceVariety | null>(null);
  
  const [name, setName] = useState('');
  const [commonName, setCommonName] = useState('');
  const [scientificName, setScientificName] = useState('');
  const [category, setCategory] = useState<'vegetable' | 'fruit' | 'herb' | 'leafy_green' | 'root_vegetable'>('vegetable');
  const [type, setType] = useState<'seed' | 'transplant' | 'cutting'>('seed');
  const [description, setDescription] = useState('');
  const [growingDays, setGrowingDays] = useState('');
  const [expectedYield, setExpectedYield] = useState('');
  const [flavorProfile, setFlavorProfile] = useState('');
  const [storageLife, setStorageLife] = useState('');
  const [tempMin, setTempMin] = useState('');
  const [tempMax, setTempMax] = useState('');

  const activeCultivars = cultivars.filter(c => c.isActive);
  const archivedCultivars = cultivars.filter(c => !c.isActive);

  const resetForm = () => {
    setName('');
    setCommonName('');
    setScientificName('');
    setCategory('vegetable');
    setType('seed');
    setDescription('');
    setGrowingDays('');
    setExpectedYield('');
    setFlavorProfile('');
    setStorageLife('');
    setTempMin('');
    setTempMax('');
    setEditingCultivar(null);
  };

  const handleOpenCreate = () => {
    resetForm();
    setDialogOpen(true);
  };

  const handleOpenEdit = (cultivar: ProduceVariety) => {
    setEditingCultivar(cultivar);
    setName(cultivar.name);
    setCommonName(cultivar.commonName);
    setScientificName(cultivar.scientificName || '');
    setCategory(cultivar.category);
    setType(cultivar.type);
    setDescription(cultivar.description || '');
    setGrowingDays(cultivar.growingDays?.toString() || '');
    setExpectedYield(cultivar.expectedYield?.toString() || '');
    setFlavorProfile(cultivar.flavorProfile || '');
    setStorageLife(cultivar.storageLife?.toString() || '');
    setTempMin(cultivar.optimalTemp?.min.toString() || '');
    setTempMax(cultivar.optimalTemp?.max.toString() || '');
    setDialogOpen(true);
  };

  const handleSubmit = () => {
    const cultivarData = {
      name,
      commonName,
      scientificName: scientificName || undefined,
      category,
      type,
      description: description || undefined,
      growingDays: growingDays ? parseInt(growingDays) : undefined,
      expectedYield: expectedYield ? parseFloat(expectedYield) : undefined,
      flavorProfile: flavorProfile || undefined,
      storageLife: storageLife ? parseInt(storageLife) : undefined,
      optimalTemp: tempMin && tempMax ? { min: parseFloat(tempMin), max: parseFloat(tempMax) } : undefined,
      isActive: true,
    };

    if (editingCultivar) {
      onUpdateCultivar(editingCultivar.id, cultivarData);
    } else {
      onCreateCultivar(cultivarData);
    }

    setDialogOpen(false);
    resetForm();
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      vegetable: 'bg-green-100 text-green-800',
      fruit: 'bg-red-100 text-red-800',
      herb: 'bg-purple-100 text-purple-800',
      leafy_green: 'bg-emerald-100 text-emerald-800',
      root_vegetable: 'bg-orange-100 text-orange-800',
    };
    return colors[category] || 'bg-gray-100 text-gray-800';
  };

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      seed: 'bg-blue-100 text-blue-800',
      transplant: 'bg-indigo-100 text-indigo-800',
      cutting: 'bg-violet-100 text-violet-800',
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-gray-900">Variety Library</h2>
          <p className="text-gray-600">Manage produce varieties and cultivation parameters</p>
        </div>
        <Button onClick={handleOpenCreate}>
          <Plus className="w-4 h-4 mr-2" />
          Add Variety
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500">Active Varieties</p>
              <p className="text-gray-900">{activeCultivars.length}</p>
            </div>
            <Sprout className="w-8 h-8 text-green-600" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500">Seed Varieties</p>
              <p className="text-gray-900">{activeCultivars.filter(c => c.type === 'seed').length}</p>
            </div>
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600">
              S
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500">Transplants</p>
              <p className="text-gray-900">{activeCultivars.filter(c => c.type === 'transplant').length}</p>
            </div>
            <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600">
              T
            </div>
          </div>
        </Card>
      </div>

      {/* Active Varieties */}
      <div>
        <h3 className="text-gray-900 mb-4">Active Varieties</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {activeCultivars.map(cultivar => (
            <Card key={cultivar.id} className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Sprout className="w-5 h-5 text-green-600" />
                  <div>
                    <h4 className="text-gray-900">{cultivar.name}</h4>
                    <p className="text-gray-600">{cultivar.commonName}</p>
                  </div>
                </div>
                <div className="flex flex-col gap-1">
                  <Badge className={getCategoryColor(cultivar.category)}>
                    {cultivar.category.replace('_', ' ')}
                  </Badge>
                  <Badge className={getTypeColor(cultivar.type)}>
                    {cultivar.type}
                  </Badge>
                </div>
              </div>

              {cultivar.scientificName && (
                <p className="text-gray-500 italic mb-2">{cultivar.scientificName}</p>
              )}

              {cultivar.description && (
                <p className="text-gray-600 mb-3">{cultivar.description}</p>
              )}

              <div className="space-y-2 mb-4">
                {cultivar.growingDays && (
                  <div className="flex justify-between text-gray-700">
                    <span>Days to Maturity:</span>
                    <span>{cultivar.growingDays} days</span>
                  </div>
                )}
                {cultivar.expectedYield && (
                  <div className="flex justify-between text-gray-700">
                    <span>Expected Yield:</span>
                    <span>{cultivar.expectedYield} lbs</span>
                  </div>
                )}
                {cultivar.flavorProfile && (
                  <div className="flex justify-between text-gray-700">
                    <span>Flavor:</span>
                    <span className="text-right">{cultivar.flavorProfile}</span>
                  </div>
                )}
                {cultivar.storageLife && (
                  <div className="flex justify-between text-gray-700">
                    <span>Storage Life:</span>
                    <span>{cultivar.storageLife} days</span>
                  </div>
                )}
                {cultivar.optimalTemp && (
                  <div className="flex justify-between text-gray-700">
                    <span>Optimal Temp:</span>
                    <span>{cultivar.optimalTemp.min}-{cultivar.optimalTemp.max}°F</span>
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="flex-1" onClick={() => handleOpenEdit(cultivar)}>
                  <Edit className="w-4 h-4 mr-1" />
                  Edit
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onUpdateCultivar(cultivar.id, { isActive: false })}
                >
                  <Archive className="w-4 h-4" />
                </Button>
              </div>
            </Card>
          ))}

          {activeCultivars.length === 0 && (
            <Card className="p-8 col-span-3 text-center">
              <Sprout className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600">No active varieties</p>
              <p className="text-gray-500 mb-4">Add your first variety to start tracking produce</p>
              <Button onClick={handleOpenCreate}>
                <Plus className="w-4 h-4 mr-2" />
                Add First Variety
              </Button>
            </Card>
          )}
        </div>
      </div>

      {/* Variety Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingCultivar ? 'Edit Variety' : 'Add New Variety'}</DialogTitle>
            <DialogDescription>
              {editingCultivar ? 'Update variety information and growing parameters.' : 'Add a new produce variety to your library.'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Variety Name <span className="text-red-600">*</span></Label>
                <Input
                  id="name"
                  placeholder="e.g., Roma VF"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="mt-2"
                />
              </div>

              <div>
                <Label htmlFor="common-name">Common Name <span className="text-red-600">*</span></Label>
                <Input
                  id="common-name"
                  placeholder="e.g., Roma Tomato"
                  value={commonName}
                  onChange={(e) => setCommonName(e.target.value)}
                  className="mt-2"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="scientific-name">Scientific Name</Label>
              <Input
                id="scientific-name"
                placeholder="e.g., Solanum lycopersicum"
                value={scientificName}
                onChange={(e) => setScientificName(e.target.value)}
                className="mt-2"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="category">Category <span className="text-red-600">*</span></Label>
                <Select value={category} onValueChange={(val) => setCategory(val as typeof category)}>
                  <SelectTrigger id="category" className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="vegetable">Vegetable</SelectItem>
                    <SelectItem value="fruit">Fruit</SelectItem>
                    <SelectItem value="herb">Herb</SelectItem>
                    <SelectItem value="leafy_green">Leafy Green</SelectItem>
                    <SelectItem value="root_vegetable">Root Vegetable</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="type">Type <span className="text-red-600">*</span></Label>
                <Select value={type} onValueChange={(val) => setType(val as typeof type)}>
                  <SelectTrigger id="type" className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="seed">Seed</SelectItem>
                    <SelectItem value="transplant">Transplant</SelectItem>
                    <SelectItem value="cutting">Cutting</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Describe the variety characteristics..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="mt-2"
              />
            </div>

            <div>
              <Label htmlFor="flavor-profile">Flavor Profile</Label>
              <Input
                id="flavor-profile"
                placeholder="e.g., Sweet, aromatic, tangy"
                value={flavorProfile}
                onChange={(e) => setFlavorProfile(e.target.value)}
                className="mt-2"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="growing-days">Days to Maturity</Label>
                <Input
                  id="growing-days"
                  type="number"
                  placeholder="e.g., 75"
                  value={growingDays}
                  onChange={(e) => setGrowingDays(e.target.value)}
                  className="mt-2"
                />
              </div>

              <div>
                <Label htmlFor="storage-life">Storage Life (days)</Label>
                <Input
                  id="storage-life"
                  type="number"
                  placeholder="e.g., 7"
                  value={storageLife}
                  onChange={(e) => setStorageLife(e.target.value)}
                  className="mt-2"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="expected-yield">Expected Yield (lbs per plant or sq ft)</Label>
              <Input
                id="expected-yield"
                type="number"
                step="0.1"
                placeholder="e.g., 2.5"
                value={expectedYield}
                onChange={(e) => setExpectedYield(e.target.value)}
                className="mt-2"
              />
            </div>

            <div>
              <Label>Optimal Temperature Range (°F)</Label>
              <div className="flex gap-2 mt-2">
                <Input
                  type="number"
                  placeholder="Min"
                  value={tempMin}
                  onChange={(e) => setTempMin(e.target.value)}
                />
                <Input
                  type="number"
                  placeholder="Max"
                  value={tempMax}
                  onChange={(e) => setTempMax(e.target.value)}
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setDialogOpen(false);
              resetForm();
            }}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={!name || !commonName}>
              {editingCultivar ? 'Update Variety' : 'Create Variety'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
