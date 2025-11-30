import { useState } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Badge } from './ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import { Cultivar } from '../types/cultivar';
import { Sprout, Plus, Edit, Archive } from 'lucide-react';

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
  const [genetics, setGenetics] = useState('');
  const [description, setDescription] = useState('');
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
    setGenetics('');
    setDescription('');
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
    setGenetics(cultivar.genetics);
    setDescription(cultivar.description || '');
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
      genetics,
      description: description || undefined,
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-gray-900">Cultivar Library</h2>
          <p className="text-gray-600">Manage strain genetics and cultivation parameters</p>
        </div>
        <Button onClick={handleOpenCreate}>
          <Plus className="w-4 h-4 mr-2" />
          Add Cultivar
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500">Active Cultivars</p>
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
              <p className="text-gray-500">Clone Lines</p>
              <p className="text-gray-900">{activeCultivars.filter(c => c.type === 'clone').length}</p>
            </div>
            <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center text-purple-600">
              C
            </div>
          </div>
        </Card>
      </div>

      {/* Active Cultivars */}
      <div>
        <h3 className="text-gray-900 mb-4">Active Cultivars</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {activeCultivars.map(cultivar => (
            <Card key={cultivar.id} className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Sprout className="w-5 h-5 text-green-600" />
                  <div>
                    <h4 className="text-gray-900">{cultivar.name}</h4>
                    <p className="text-gray-600">{cultivar.genetics}</p>
                  </div>
                </div>
                <Badge className={cultivar.type === 'seed' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'}>
                  {cultivar.type}
                </Badge>
              </div>

              {cultivar.description && (
                <p className="text-gray-600 mb-3">{cultivar.description}</p>
              )}

              <div className="space-y-2 mb-4">
                {cultivar.thcRange && (
                  <div className="flex justify-between text-gray-700">
                    <span>THC Range:</span>
                    <span>{cultivar.thcRange.min}-{cultivar.thcRange.max}%</span>
                  </div>
                )}
                {cultivar.floweringTime && (
                  <div className="flex justify-between text-gray-700">
                    <span>Flowering Time:</span>
                    <span>{cultivar.floweringTime} days</span>
                  </div>
                )}
                {cultivar.expectedYield && (
                  <div className="flex justify-between text-gray-700">
                    <span>Expected Yield:</span>
                    <span>{cultivar.expectedYield} kg/plant</span>
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
              <p className="text-gray-600">No active cultivars</p>
              <p className="text-gray-500 mb-4">Add your first cultivar to start tracking genetics</p>
              <Button onClick={handleOpenCreate}>
                <Plus className="w-4 h-4 mr-2" />
                Add First Cultivar
              </Button>
            </Card>
          )}
        </div>
      </div>

      {/* Cultivar Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingCultivar ? 'Edit Cultivar' : 'Add New Cultivar'}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Cultivar Name <span className="text-red-600">*</span></Label>
                <Input
                  id="name"
                  placeholder="e.g., Blue Dream"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="mt-2"
                />
              </div>

              <div>
                <Label htmlFor="type">Type <span className="text-red-600">*</span></Label>
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
              <Label htmlFor="genetics">Genetics <span className="text-red-600">*</span></Label>
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
                placeholder="Describe the cultivar characteristics..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
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
                <Label htmlFor="expected-yield">Expected Yield (kg/plant)</Label>
                <Input
                  id="expected-yield"
                  type="number"
                  step="0.01"
                  placeholder="e.g., 0.45"
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
              {editingCultivar ? 'Update' : 'Create'} Cultivar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
