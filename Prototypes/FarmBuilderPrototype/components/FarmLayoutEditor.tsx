import { useState } from 'react';
import { TopToolbar } from './TopToolbar';
import { LeftSidebar } from './LeftSidebar';
import { RightSidebar } from './RightSidebar';
import { Canvas } from './Canvas';
import { StatusBar } from './StatusBar';
import { FarmSettings } from './FarmSettings';
import { PresetSelector } from './PresetSelector';
import { FloorSelector } from './FloorSelector';
import { ImportanceAlert } from './ImportanceAlert';

export type ComponentType = 'pod-40ft' | 'pod-20ft' | 'pod-10ft' | 'washroom' | 'breakroom' | 'storage' | 'pathway' | 'custom-room';
export type SensorType = 'temperature' | 'humidity' | 'co2' | 'light' | 'ph' | 'ec';

export interface Sensor {
  id: string;
  type: SensorType;
  name: string;
  status: 'active' | 'inactive' | 'warning';
}

export interface PlacedComponent {
  id: string;
  type: ComponentType;
  x: number;
  y: number;
  width: number;  // in feet
  height: number; // in feet
  rotation: number; // in degrees
  name: string;
  capacity?: number;
  notes?: string;
  sensors: Sensor[];
  floor: number;
}

export interface FarmDimensions {
  length: number; // in feet
  width: number;  // in feet
}

export interface Floor {
  id: number;
  name: string;
  components: PlacedComponent[];
}

export interface HistoryState {
  floors: Floor[];
}

export interface Preset {
  id: string;
  name: string;
  description: string;
  dimensions: FarmDimensions;
  floors: Floor[];
}

// Scale: 1 foot = 4 pixels for proper visualization
const PIXELS_PER_FOOT = 4;

export function FarmLayoutEditor() {
  const [dimensions, setDimensions] = useState<FarmDimensions>({ length: 100, width: 80 });
  const [floors, setFloors] = useState<Floor[]>([
    { id: 1, name: 'Floor 1', components: [] }
  ]);
  const [currentFloor, setCurrentFloor] = useState(1);
  const [selectedComponent, setSelectedComponent] = useState<PlacedComponent | null>(null);
  const [showGrid, setShowGrid] = useState(true);
  const [zoom, setZoom] = useState(100);
  const [history, setHistory] = useState<HistoryState[]>([{ floors: [{ id: 1, name: 'Floor 1', components: [] }] }]);
  const [historyIndex, setHistoryIndex] = useState(0);

  const currentFloorData = floors.find(f => f.id === currentFloor);
  const placedComponents = currentFloorData?.components || [];

  const addToHistory = (floors: Floor[]) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push({ floors: floors.map(f => ({ ...f, components: [...f.components] })) });
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  const getDefaultDimensions = (type: ComponentType): { width: number; height: number } => {
    switch (type) {
      case 'pod-40ft':
        return { width: 40, height: 8 }; // 40ft x 8ft shipping container
      case 'pod-20ft':
        return { width: 20, height: 8 }; // 20ft x 8ft shipping container
      case 'pod-10ft':
        return { width: 10, height: 8 }; // 10ft x 8ft shipping container
      case 'washroom':
        return { width: 8, height: 6 };
      case 'breakroom':
        return { width: 12, height: 10 };
      case 'storage':
        return { width: 10, height: 10 };
      case 'pathway':
        return { width: 4, height: 20 };
      case 'custom-room':
        return { width: 15, height: 12 };
      default:
        return { width: 10, height: 10 };
    }
  };

  const getComponentLabel = (type: ComponentType): string => {
    switch (type) {
      case 'pod-40ft':
        return '40ft Pod';
      case 'pod-20ft':
        return '20ft Pod';
      case 'pod-10ft':
        return '10ft Pod';
      case 'washroom':
        return 'Washroom';
      case 'breakroom':
        return 'Break Room';
      case 'storage':
        return 'Storage';
      case 'pathway':
        return 'Pathway';
      case 'custom-room':
        return 'Custom Room';
      default:
        return 'Component';
    }
  };

  const handleDrop = (type: ComponentType, x: number, y: number) => {
    const dims = getDefaultDimensions(type);
    const newComponent: PlacedComponent = {
      id: `${type}-${Date.now()}`,
      type,
      x,
      y,
      width: dims.width,
      height: dims.height,
      rotation: 0,
      name: `${getComponentLabel(type)} ${placedComponents.filter(c => c.type === type).length + 1}`,
      capacity: type.startsWith('pod-') ? 100 : type === 'washroom' ? 4 : type === 'breakroom' ? 20 : undefined,
      notes: '',
      sensors: [],
      floor: currentFloor,
    };
    
    const updatedFloors = floors.map(f => 
      f.id === currentFloor 
        ? { ...f, components: [...f.components, newComponent] }
        : f
    );
    setFloors(updatedFloors);
    setSelectedComponent(newComponent);
    addToHistory(updatedFloors);
  };

  const handleUpdateComponent = (id: string, updates: Partial<PlacedComponent>) => {
    const updatedFloors = floors.map(f => 
      f.id === currentFloor
        ? { ...f, components: f.components.map(c => c.id === id ? { ...c, ...updates } : c) }
        : f
    );
    setFloors(updatedFloors);
    if (selectedComponent?.id === id) {
      setSelectedComponent({ ...selectedComponent, ...updates });
    }
    addToHistory(updatedFloors);
  };

  const handleDeleteComponent = (id: string) => {
    const updatedFloors = floors.map(f => 
      f.id === currentFloor
        ? { ...f, components: f.components.filter(c => c.id !== id) }
        : f
    );
    setFloors(updatedFloors);
    if (selectedComponent?.id === id) {
      setSelectedComponent(null);
    }
    addToHistory(updatedFloors);
  };

  const handleAddSensor = (componentId: string, sensorType: SensorType) => {
    const newSensor: Sensor = {
      id: `sensor-${Date.now()}`,
      type: sensorType,
      name: `${sensorType.toUpperCase()} Sensor`,
      status: 'active',
    };

    handleUpdateComponent(componentId, {
      sensors: [...(placedComponents.find(c => c.id === componentId)?.sensors || []), newSensor],
    });
  };

  const handleRemoveSensor = (componentId: string, sensorId: string) => {
    const component = placedComponents.find(c => c.id === componentId);
    if (component) {
      handleUpdateComponent(componentId, {
        sensors: component.sensors.filter(s => s.id !== sensorId),
      });
    }
  };

  const handleAddFloor = () => {
    const newFloorId = Math.max(...floors.map(f => f.id), 0) + 1;
    const newFloor: Floor = {
      id: newFloorId,
      name: `Floor ${newFloorId}`,
      components: [],
    };
    const updatedFloors = [...floors, newFloor];
    setFloors(updatedFloors);
    setCurrentFloor(newFloorId);
    addToHistory(updatedFloors);
  };

  const handleRemoveFloor = (floorId: number) => {
    if (floors.length <= 1) return;
    const updatedFloors = floors.filter(f => f.id !== floorId);
    setFloors(updatedFloors);
    if (currentFloor === floorId) {
      setCurrentFloor(updatedFloors[0].id);
    }
    setSelectedComponent(null);
    addToHistory(updatedFloors);
  };

  const handleRenameFloor = (floorId: number, name: string) => {
    const updatedFloors = floors.map(f => 
      f.id === floorId ? { ...f, name } : f
    );
    setFloors(updatedFloors);
    addToHistory(updatedFloors);
  };

  const handleUndo = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      setFloors(history[newIndex].floors);
      setSelectedComponent(null);
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      setFloors(history[newIndex].floors);
      setSelectedComponent(null);
    }
  };

  const handleSave = () => {
    const data = JSON.stringify({ 
      dimensions, 
      floors,
      version: '2.0',
      pixelsPerFoot: PIXELS_PER_FOOT,
    }, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `farm-layout-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleLoad = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          try {
            const data = JSON.parse(event.target?.result as string);
            setDimensions(data.dimensions || { length: 100, width: 80 });
            setFloors(data.floors || [{ id: 1, name: 'Floor 1', components: [] }]);
            setCurrentFloor(data.floors?.[0]?.id || 1);
            setSelectedComponent(null);
            addToHistory(data.floors || [{ id: 1, name: 'Floor 1', components: [] }]);
          } catch (error) {
            console.error('Error loading file:', error);
          }
        };
        reader.readAsText(file);
      }
    };
    input.click();
  };

  const handleLoadPreset = (preset: Preset) => {
    setDimensions(preset.dimensions);
    setFloors(preset.floors);
    setCurrentFloor(preset.floors[0]?.id || 1);
    setSelectedComponent(null);
    addToHistory(preset.floors);
  };

  return (
    <div className="h-screen flex flex-col bg-neutral-50">
      <TopToolbar
        onSave={handleSave}
        onLoad={handleLoad}
        onUndo={handleUndo}
        onRedo={handleRedo}
        onZoomIn={() => setZoom(Math.min(200, zoom + 10))}
        onZoomOut={() => setZoom(Math.max(50, zoom - 10))}
        onToggleGrid={() => setShowGrid(!showGrid)}
        canUndo={historyIndex > 0}
        canRedo={historyIndex < history.length - 1}
        showGrid={showGrid}
        zoom={zoom}
      />
      
      <div className="flex flex-1 overflow-hidden">
        <LeftSidebar />
        
        <main className="flex-1 flex flex-col overflow-hidden">
          <div className="p-4 bg-white border-b border-neutral-200 space-y-4">
            <ImportanceAlert />
            
            <FarmSettings
              dimensions={dimensions}
              onDimensionsChange={setDimensions}
            />
            
            <FloorSelector
              floors={floors}
              currentFloor={currentFloor}
              onFloorChange={setCurrentFloor}
              onAddFloor={handleAddFloor}
              onRemoveFloor={handleRemoveFloor}
              onRenameFloor={handleRenameFloor}
            />
            
            <PresetSelector onLoadPreset={handleLoadPreset} />
          </div>
          
          <Canvas
            placedComponents={placedComponents}
            selectedComponent={selectedComponent}
            onDrop={handleDrop}
            onSelect={setSelectedComponent}
            onUpdateComponent={handleUpdateComponent}
            showGrid={showGrid}
            zoom={zoom}
            dimensions={dimensions}
            pixelsPerFoot={PIXELS_PER_FOOT}
          />
          
          <StatusBar
            units="feet"
            totalComponents={placedComponents.length}
            currentFloor={currentFloorData?.name || ''}
            totalFloors={floors.length}
            dimensions={dimensions}
          />
        </main>
        
        <RightSidebar
          selectedComponent={selectedComponent}
          onUpdateComponent={handleUpdateComponent}
          onDeleteComponent={handleDeleteComponent}
          onAddSensor={handleAddSensor}
          onRemoveSensor={handleRemoveSensor}
        />
      </div>
    </div>
  );
}
