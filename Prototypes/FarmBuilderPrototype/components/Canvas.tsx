import { useRef } from 'react';
import { useDrop } from 'react-dnd';
import { ComponentType, PlacedComponent, FarmDimensions } from './FarmLayoutEditor';
import { PlacedComponentView } from './PlacedComponentView';
import { DragLayer } from './DragLayer';

interface CanvasProps {
  placedComponents: PlacedComponent[];
  selectedComponent: PlacedComponent | null;
  onDrop: (type: ComponentType, x: number, y: number) => void;
  onSelect: (component: PlacedComponent | null) => void;
  onUpdateComponent: (id: string, updates: Partial<PlacedComponent>) => void;
  showGrid: boolean;
  zoom: number;
  dimensions: FarmDimensions;
  pixelsPerFoot: number;
}

export function Canvas({
  placedComponents,
  selectedComponent,
  onDrop,
  onSelect,
  onUpdateComponent,
  showGrid,
  zoom,
  dimensions,
  pixelsPerFoot,
}: CanvasProps) {
  const canvasRef = useRef<HTMLDivElement>(null);
  
  // Calculate canvas size based on farm dimensions (in feet, converted to pixels)
  const canvasWidth = dimensions.length * pixelsPerFoot;
  const canvasHeight = dimensions.width * pixelsPerFoot;
  
  // Grid size represents 10 feet
  const gridSize = 10 * pixelsPerFoot;

  const [{ isOver }, drop] = useDrop({
    accept: ['component', 'placed-component'],
    drop: (item: { type: ComponentType; id?: string; offsetX?: number; offsetY?: number }, monitor) => {
      const offset = monitor.getClientOffset();
      const canvasRect = canvasRef.current?.getBoundingClientRect();
      
      if (offset && canvasRect) {
        const scale = zoom / 100;
        
        if (item.id) {
          // Moving existing component - convert from pixels to feet
          const xPixels = (offset.x - canvasRect.left - (item.offsetX || 0)) / scale;
          const yPixels = (offset.y - canvasRect.top - (item.offsetY || 0)) / scale;
          const xFeet = xPixels / pixelsPerFoot;
          const yFeet = yPixels / pixelsPerFoot;
          onUpdateComponent(item.id, { x: Math.max(0, xFeet), y: Math.max(0, yFeet) });
        } else {
          // Dropping new component - convert from pixels to feet
          const xPixels = (offset.x - canvasRect.left) / scale;
          const yPixels = (offset.y - canvasRect.top) / scale;
          const xFeet = xPixels / pixelsPerFoot;
          const yFeet = yPixels / pixelsPerFoot;
          onDrop(item.type, Math.max(0, xFeet), Math.max(0, yFeet));
        }
      }
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
  });

  const handleCanvasClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onSelect(null);
    }
  };

  return (
    <div className="flex-1 overflow-auto bg-neutral-100 p-8">
      <DragLayer />
      <div
        ref={(node) => {
          canvasRef.current = node;
          drop(node);
        }}
        onClick={handleCanvasClick}
        className={`
          relative bg-white rounded-lg shadow-sm
          transition-all duration-200
          ${isOver ? 'ring-2 ring-green-500 ring-opacity-50' : ''}
        `}
        style={{
          width: `${canvasWidth * zoom / 100}px`,
          height: `${canvasHeight * zoom / 100}px`,
          backgroundImage: showGrid
            ? `
              linear-gradient(to right, #e5e7eb 1px, transparent 1px),
              linear-gradient(to bottom, #e5e7eb 1px, transparent 1px)
            `
            : 'none',
          backgroundSize: showGrid ? `${gridSize * zoom / 100}px ${gridSize * zoom / 100}px` : 'auto',
        }}
      >
        {/* Grid Labels */}
        {showGrid && (
          <>
            {/* Horizontal labels (top) */}
            <div className="absolute left-0 right-0 pointer-events-none" style={{ top: '-24px' }}>
              {Array.from({ length: Math.floor(dimensions.length / 10) + 1 }).map((_, i) => (
                <div
                  key={`h-${i}`}
                  className="absolute text-xs text-neutral-500"
                  style={{
                    left: `${i * gridSize * zoom / 100}px`,
                  }}
                >
                  {i * 10}ft
                </div>
              ))}
            </div>
            
            {/* Vertical labels (left) */}
            <div className="absolute top-0 bottom-0 pointer-events-none" style={{ left: '-40px', width: '36px' }}>
              {Array.from({ length: Math.floor(dimensions.width / 10) + 1 }).map((_, i) => (
                <div
                  key={`v-${i}`}
                  className="absolute text-xs text-neutral-500 text-right"
                  style={{
                    top: `${i * gridSize * zoom / 100}px`,
                    right: '4px',
                  }}
                >
                  {i * 10}ft
                </div>
              ))}
            </div>
          </>
        )}
        
        {placedComponents.map((component) => (
          <PlacedComponentView
            key={component.id}
            component={component}
            isSelected={selectedComponent?.id === component.id}
            onSelect={onSelect}
            onUpdate={onUpdateComponent}
            pixelsPerFoot={pixelsPerFoot}
            zoom={zoom}
          />
        ))}
      </div>
    </div>
  );
}
