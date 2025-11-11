import { useState } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Badge } from './ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import { Cultivar, StrainType } from '../types/cultivar';
import { Leaf, Plus, Edit, Archive } from 'lucide-react';

interface CultivarManagementProps {
  cultivars: Cultivar[];
  onCreateCultivar: (cultivar: Omit<Cultivar, 'id' | 'createdAt'>) => void;
  onUpdateCultivar: (id: string, cultivar: Partial<Cultivar>) => void;
}

export function CultivarManagement({ cultivars, onCreateCultivar, onUpdateCultivar }: CultivarManagementProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCultivar, setEditingCultivar] = useState<Cultivar | null>(null);
  
  const [name, setName] = useState('');
  const [type, setType] = useState<'seed' | 'clone'>('seed');
  const [strainType, setStrainType] = useState<StrainType>('hybrid');
  const [genetics, setGenetics] = useState('');
  const [description, setDescription] = useState('');
  const [terpenes, setTerpenes] = useState('');
  const [growthCharacteristics, setGrowthCharacteristics] = useState('');
  const [thcMin, setThcMin] = useState('');
  const [thcMax, setThcMax] = useState('');
  const [cbdMin, setCbdMin] = useState('');
  const [cbdMax, setCbdMax] = useState('');
  const [floweringTime, setFloweringTime] = useState('');
  const [expectedYield, setExpectedYield] = useState('');

  const activeCultivars = cultivars.filter(c => c.isActive);
  const archivedCultivars = cultivars.filter(c => !c.isActive);

  const resetForm = () => {
    setName('');
    setType('seed');
    setStrainType('hybrid');
    setGenetics('');
    setDescription('');
    setTerpenes('');
    setGrowthCharacteristics('');
    setThcMin('');
    setThcMax('');
    setCbdMin('');
    setCbdMax('');
    setFloweringTime('');
    setExpectedYield('');
    setEditingCultivar(null);
  };

  const handleOpenCreate = () => {
    resetForm();
    setDialogOpen(true);
  };

  const handleOpenEdit = (cultivar: Cultivar) => {
    setEditingCultivar(cultivar);
    setName(cultivar.name);
    setType(cultivar.type);
    setStrainType(cultivar.strainType);
    setGenetics(cultivar.genetics);
    setDescription(cultivar.description || '');
    setTerpenes(cultivar.terpeneProfile?.join(', ') || '');
    setGrowthCharacteristics(cultivar.growthCharacteristics || '');
    setThcMin(cultivar.thcRange?.min.toString() || '');
    setThcMax(cultivar.thcRange?.max.toString() || '');
    setCbdMin(cultivar.cbdRange?.min.toString() || '');
    setCbdMax(cultivar.cbdRange?.max.toString() || '');
    setFloweringTime(cultivar.floweringTime?.toString() || '');
    setExpectedYield(cultivar.expectedYield?.toString() || '');
    setDialogOpen(true);
  };

  const handleSubmit = () => {
    const cultivarData = {
      name,
      type,
      strainType,
      genetics,
      description: description || undefined,
      terpeneProfile: terpenes ? terpenes.split(',').map(t => t.trim()) : undefined,
      growthCharacteristics: growthCharacteristics || undefined,
      thcRange: thcMin && thcMax ? { min: parseFloat(thcMin), max: parseFloat(thcMax) } : undefined,
      cbdRange: cbdMin && cbdMax ? { min: parseFloat(cbdMin), max: parseFloat(cbdMax) } : undefined,
      floweringTime: floweringTime ? parseInt(floweringTime) : undefined,
      expectedYield: expectedYield ? parseFloat(expectedYield) : undefined,
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

  const getStrainTypeBadgeColor = (strainType: StrainType) => {
    switch (strainType) {
      case 'indica':
      case 'indica-dominant':
        return 'bg-purple-100 text-purple-800';
      case 'sativa':
      case 'sativa-dominant':
        return 'bg-orange-100 text-orange-800';
      case 'hybrid':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-gray-900">Cannabis Strain Library</h2>
          <p className="text-gray-600">Manage marijuana strain genetics and cultivation parameters</p>
        </div>
        <Button onClick={handleOpenCreate}>
          <Plus className="w-4 h-4 mr-2" />
          Add Strain
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500">Active Strains</p>
              <p className="text-gray-900">{activeCultivars.length}</p>
            </div>
            <Leaf className="w-8 h-8 text-green-600" />
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
              <p className="text-gray-500">Clone Lines</p>
              <p className="text-gray-900">{activeCultivars.filter(c => c.type === 'clone').length}</p>
            </div>
            <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center text-purple-600">
              C
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500">Avg THC</p>
              <p className="text-gray-900">
                {activeCultivars.length > 0
                  ? `${(
                      activeCultivars
                        .filter(c => c.thcRange)
                        .reduce((sum, c) => sum + ((c.thcRange!.min + c.thcRange!.max) / 2), 0) /
                      activeCultivars.filter(c => c.thcRange).length
                    ).toFixed(1)}%`
                  : 'N/A'}
              </p>
            </div>
            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center text-green-600">
              %
            </div>
          </div>
        </Card>
      </div>

      {/* Active Strains */}
      <div>
        <h3 className="text-gray-900 mb-4">Active Cannabis Strains</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {activeCultivars.map(cultivar => (
            <Card key={cultivar.id} className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Leaf className="w-5 h-5 text-green-600" />
                  <div>
                    <h4 className="text-gray-900">{cultivar.name}</h4>
                    <p className="text-gray-600">{cultivar.genetics}</p>
                  </div>
                </div>
                <div className="flex flex-col gap-1">
                  <Badge className={cultivar.type === 'seed' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'}>
                    {cultivar.type}
                  </Badge>
                  <Badge className={getStrainTypeBadgeColor(cultivar.strainType)}>
                    {cultivar.strainType}
                  </Badge>
                </div>
              </div>

              {cultivar.description && (
                <p className="text-gray-600 mb-3">{cultivar.description}</p>
              )}

              <div className="space-y-2 mb-3">
                {cultivar.thcRange && (
                  <div className="flex justify-between text-gray-700">
                    <span>THC:</span>
                    <span>{cultivar.thcRange.min}-{cultivar.thcRange.max}%</span>
                  </div>
                )}
                {cultivar.cbdRange && cultivar.cbdRange.max > 0 && (
                  <div className="flex justify-between text-gray-700">
                    <span>CBD:</span>
                    <span>{cultivar.cbdRange.min}-{cultivar.cbdRange.max}%</span>
                  </div>
                )}
                {cultivar.terpeneProfile && cultivar.terpeneProfile.length > 0 && (
                  <div className="flex justify-between text-gray-700">
                    <span>Terpenes:</span>
                    <span className="text-right">{cultivar.terpeneProfile.slice(0, 2).join(', ')}</span>
                  </div>
                )}
                {cultivar.floweringTime && (
                  <div className="flex justify-between text-gray-700">
                    <span>Flowering:</span>
                    <span>{cultivar.floweringTime} days</span>
                  </div>
                )}
                {cultivar.expectedYield && (
                  <div className="flex justify-between text-gray-700">
                    <span>Yield:</span>
                    <span>{cultivar.expectedYield}g/plant</span>
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
              <Leaf className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600">No active cannabis strains</p>
              <p className="text-gray-500 mb-4">Add your first strain to start tracking genetics</p>
              <Button onClick={handleOpenCreate}>
                <Plus className="w-4 h-4 mr-2" />
                Add First Strain
              </Button>
            </Card>
          )}
        </div>
      </div>

      {/* Strain Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingCultivar ? 'Edit Cannabis Strain' : 'Add New Cannabis Strain'}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Strain Name <span className="text-red-600">*</span></Label>
                <Input
                  id="name"
                  placeholder="e.g., Blue Dream"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="mt-2"
                />
              </div>

              <div>
                <Label htmlFor="type">Propagation Type <span className="text-red-600">*</span></Label>
                <Select value={type} onValueChange={(val) => setType(val as 'seed' | 'clone')}>
                  <SelectTrigger id="type" className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="seed">Seed</SelectItem>
                    <SelectItem value="clone">Clone</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="strain-type">Strain Type <span className="text-red-600">*</span></Label>
              <Select value={strainType} onValueChange={(val) => setStrainType(val as StrainType)}>
                <SelectTrigger id="strain-type" className="mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="indica">Indica</SelectItem>
                  <SelectItem value="sativa">Sativa</SelectItem>
                  <SelectItem value="hybrid">Hybrid</SelectItem>
                  <SelectItem value="indica-dominant">Indica-Dominant Hybrid</SelectItem>
                  <SelectItem value="sativa-dominant">Sativa-Dominant Hybrid</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="genetics">Genetics/Lineage <span className="text-red-600">*</span></Label>
              <Input
                id="genetics"
                placeholder="e.g., Blueberry x Haze"
                value={genetics}
                onChange={(e) => setGenetics(e.target.value)}
                className="mt-2"
              />
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Describe effects, aroma, and flavor profile..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="mt-2"
              />
            </div>

            <div>
              <Label htmlFor="terpenes">Terpene Profile</Label>
              <Input
                id="terpenes"
                placeholder="e.g., Myrcene, Limonene, Caryophyllene (comma-separated)"
                value={terpenes}
                onChange={(e) => setTerpenes(e.target.value)}
                className="mt-2"
              />
            </div>

            <div>
              <Label htmlFor="growth">Growth Characteristics</Label>
              <Textarea
                id="growth"
                placeholder="e.g., Tall plants with moderate stretch, requires support..."
                value={growthCharacteristics}
                onChange={(e) => setGrowthCharacteristics(e.target.value)}
                rows={2}
                className="mt-2"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>THC Range (%)</Label>
                <div className="flex gap-2 mt-2">
                  <Input
                    type="number"
                    step="0.1"
                    placeholder="Min"
                    value={thcMin}
                    onChange={(e) => setThcMin(e.target.value)}
                  />
                  <Input
                    type="number"
                    step="0.1"
                    placeholder="Max"
                    value={thcMax}
                    onChange={(e) => setThcMax(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <Label>CBD Range (%)</Label>
                <div className="flex gap-2 mt-2">
                  <Input
                    type="number"
                    step="0.1"
                    placeholder="Min"
                    value={cbdMin}
                    onChange={(e) => setCbdMin(e.target.value)}
                  />
                  <Input
                    type="number"
                    step="0.1"
                    placeholder="Max"
                    value={cbdMax}
                    onChange={(e) => setCbdMax(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="flowering-time">Flowering Time (days)</Label>
                <Input
                  id="flowering-time"
                  type="number"
                  placeholder="e.g., 63"
                  value={floweringTime}
                  onChange={(e) => setFloweringTime(e.target.value)}
                  className="mt-2"
                />
              </div>

              <div>
                <Label htmlFor="expected-yield">Expected Yield (grams/plant)</Label>
                <Input
                  id="expected-yield"
                  type="number"
                  step="1"
                  placeholder="e.g., 450"
                  value={expectedYield}
                  onChange={(e) => setExpectedYield(e.target.value)}
                  className="mt-2"
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
            <Button onClick={handleSubmit} disabled={!name || !genetics}>
              {editingCultivar ? 'Update' : 'Create'} Strain
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
