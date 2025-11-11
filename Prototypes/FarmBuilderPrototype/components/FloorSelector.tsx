import { useState } from 'react';
import { Layers, Plus, X, Edit2, Check } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Floor } from './FarmLayoutEditor';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from './ui/tooltip';

interface FloorSelectorProps {
  floors: Floor[];
  currentFloor: number;
  onFloorChange: (floorId: number) => void;
  onAddFloor: () => void;
  onRemoveFloor: (floorId: number) => void;
  onRenameFloor: (floorId: number, name: string) => void;
}

export function FloorSelector({
  floors,
  currentFloor,
  onFloorChange,
  onAddFloor,
  onRemoveFloor,
  onRenameFloor,
}: FloorSelectorProps) {
  const [editingFloor, setEditingFloor] = useState<number | null>(null);
  const [editName, setEditName] = useState('');

  const handleStartEdit = (floor: Floor) => {
    setEditingFloor(floor.id);
    setEditName(floor.name);
  };

  const handleSaveEdit = (floorId: number) => {
    if (editName.trim()) {
      onRenameFloor(floorId, editName.trim());
    }
    setEditingFloor(null);
  };

  return (
    <TooltipProvider>
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 text-neutral-700">
          <Layers className="h-4 w-4" />
          <span className="text-sm">Floors:</span>
        </div>
        
        <div className="flex items-center gap-2">
          {floors.map((floor) => (
            <div
              key={floor.id}
              className={`
                flex items-center gap-1 px-3 py-1.5 rounded-lg border-2 transition-all
                ${currentFloor === floor.id 
                  ? 'bg-green-600 text-white border-green-700' 
                  : 'bg-white text-neutral-700 border-neutral-300 hover:border-green-400'}
              `}
            >
              {editingFloor === floor.id ? (
                <div className="flex items-center gap-1">
                  <Input
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSaveEdit(floor.id);
                      if (e.key === 'Escape') setEditingFloor(null);
                    }}
                    className="h-6 w-24 text-xs"
                    autoFocus
                  />
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => handleSaveEdit(floor.id)}
                    className="h-6 w-6"
                  >
                    <Check className="h-3 w-3" />
                  </Button>
                </div>
              ) : (
                <>
                  <button
                    onClick={() => onFloorChange(floor.id)}
                    className="text-sm"
                  >
                    {floor.name}
                  </button>
                  
                  {currentFloor === floor.id && (
                    <>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button
                            onClick={() => handleStartEdit(floor)}
                            className="hover:opacity-70"
                          >
                            <Edit2 className="h-3 w-3" />
                          </button>
                        </TooltipTrigger>
                        <TooltipContent>Rename Floor</TooltipContent>
                      </Tooltip>
                      
                      {floors.length > 1 && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button
                              onClick={() => onRemoveFloor(floor.id)}
                              className="hover:opacity-70"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </TooltipTrigger>
                          <TooltipContent>Remove Floor</TooltipContent>
                        </Tooltip>
                      )}
                    </>
                  )}
                </>
              )}
            </div>
          ))}
          
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="sm"
                variant="outline"
                onClick={onAddFloor}
                className="h-8"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Add Floor</TooltipContent>
          </Tooltip>
        </div>
      </div>
    </TooltipProvider>
  );
}
