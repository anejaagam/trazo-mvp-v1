import { useRef } from 'react';
import { useDrag } from 'react-dnd';
import { Resizable } from 're-resizable';
import { Container, DoorClosed, Coffee, Package, Route, Radio, PlusSquare } from 'lucide-react';
import { PlacedComponent } from './FarmLayoutEditor';
import { Badge } from './ui/badge';

interface PlacedComponentViewProps {
  component: PlacedComponent;
  isSelected: boolean;
  onSelect: (component: PlacedComponent) => void;
  onUpdate: (id: string, updates: Partial<PlacedComponent>) => void;
  pixelsPerFoot: number;
  zoom: number;
}

const componentConfig = {
  'pod-40ft': { icon: Container, color: 'bg-gradient-to-br from-green-100 to-green-200 border-green-500 text-green-800', resizable: false },
  'pod-20ft': { icon: Container, color: 'bg-gradient-to-br from-green-100 to-green-200 border-green-500 text-green-800', resizable: false },
  'pod-10ft': { icon: Container, color: 'bg-gradient-to-br from-green-100 to-green-200 border-green-500 text-green-800', resizable: false },
  'washroom': { icon: DoorClosed, color: 'bg-gradient-to-br from-blue-100 to-blue-200 border-blue-500 text-blue-800', resizable: true },
  'breakroom': { icon: Coffee, color: 'bg-gradient-to-br from-amber-100 to-amber-200 border-amber-500 text-amber-800', resizable: true },
  'storage': { icon: Package, color: 'bg-gradient-to-br from-purple-100 to-purple-200 border-purple-500 text-purple-800', resizable: true },
  'pathway': { icon: Route, color: 'bg-gradient-to-br from-neutral-100 to-neutral-200 border-neutral-400 text-neutral-700', resizable: true },
  'custom-room': { icon: PlusSquare, color: 'bg-gradient-to-br from-emerald-100 to-emerald-200 border-emerald-500 text-emerald-800', resizable: true },
};

export function PlacedComponentView({
  component,
  isSelected,
  onSelect,
  onUpdate,
  pixelsPerFoot,
  zoom,
}: PlacedComponentViewProps) {
  const config = componentConfig[component.type];
  const Icon = config.icon;
  
  const scale = zoom / 100;
  const hasSensors = component.sensors && component.sensors.length > 0;
  const componentRef = useRef<HTMLDivElement>(null);

  const [{ isDragging }, drag, preview] = useDrag({
    type: 'placed-component',
    item: () => {
      const rect = componentRef.current?.getBoundingClientRect();
      const initialOffset = { x: 0, y: 0 };
      
      if (rect) {
        initialOffset.x = rect.width / 2;
        initialOffset.y = rect.height / 2;
      }
      
      return {
        id: component.id,
        type: component.type,
        offsetX: initialOffset.x,
        offsetY: initialOffset.y,
        rotation: component.rotation,
        width: widthPx * scale,
        height: heightPx * scale,
        color: config.color,
      };
    },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  // Use empty preview to hide default drag preview
  preview(null);

  // Only apply drag to non-resizable components or when not selected
  if (!config.resizable || !isSelected) {
    drag(componentRef);
  }

  // Convert feet to pixels
  const widthPx = component.width * pixelsPerFoot;
  const heightPx = component.height * pixelsPerFoot;
  const xPx = component.x * pixelsPerFoot;
  const yPx = component.y * pixelsPerFoot;

  const handleResize = (e: MouseEvent | TouchEvent, direction: any, ref: HTMLElement, delta: { width: number; height: number }) => {
    const newWidthFt = (widthPx * scale + delta.width) / scale / pixelsPerFoot;
    const newHeightFt = (heightPx * scale + delta.height) / scale / pixelsPerFoot;
    
    onUpdate(component.id, {
      width: Math.max(1, Math.round(newWidthFt * 2) / 2), // Round to nearest 0.5 ft
      height: Math.max(1, Math.round(newHeightFt * 2) / 2),
    });
  };

  // Calculate responsive sizing
  const minDimension = Math.min(widthPx * scale, heightPx * scale);
  const iconSize = Math.max(16, Math.min(48, minDimension * 0.3));
  const fontSize = Math.max(10, Math.min(14, minDimension * 0.08));
  const showDetails = minDimension > 40;
  const showDimensions = minDimension > 60;

  const content = (
    <>
      {hasSensors && (
        <div className="absolute -top-2 -right-2 pointer-events-none z-10">
          <Badge variant="default" className="bg-green-600 text-white text-xs px-1.5 py-0.5 flex items-center gap-1 shadow-md">
            <Radio className="h-3 w-3" />
            {component.sensors.length}
          </Badge>
        </div>
      )}
      
      {/* Icon in top-left corner for better visibility */}
      <div className="absolute top-2 left-2 pointer-events-none" style={{ opacity: 0.9 }}>
        <Icon style={{ width: `${iconSize}px`, height: `${iconSize}px` }} />
      </div>
      
      {/* Name and details */}
      {showDetails && (
        <div className="absolute bottom-0 left-0 right-0 pointer-events-none">
          <div className="bg-white bg-opacity-90 backdrop-blur-sm px-2 py-1.5 rounded-b-md border-t-2 border-inherit">
            <div 
              className="text-center truncate" 
              style={{ fontSize: `${fontSize}px`, lineHeight: '1.2' }}
            >
              {component.name}
            </div>
            {showDimensions && (
              <div 
                className="text-center opacity-60 mt-0.5" 
                style={{ fontSize: `${fontSize * 0.85}px`, lineHeight: '1.2' }}
              >
                {component.width}' × {component.height}'
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Type indicator for pods */}
      {component.type.startsWith('pod-') && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none opacity-10">
          <div 
            className="uppercase tracking-wider"
            style={{ 
              fontSize: `${Math.max(16, minDimension * 0.15)}px`,
              writingMode: widthPx > heightPx ? 'horizontal-tb' : 'vertical-rl',
            }}
          >
            {component.type === 'pod-40ft' ? '40 FT' : component.type === 'pod-20ft' ? '20 FT' : '10 FT'}
          </div>
        </div>
      )}
    </>
  );

  if (config.resizable && isSelected) {
    return (
      <div
        className="absolute"
        style={{
          left: `${xPx * scale}px`,
          top: `${yPx * scale}px`,
          transform: `rotate(${component.rotation}deg)`,
          transformOrigin: 'center center',
        }}
      >
        <Resizable
          size={{
            width: widthPx * scale,
            height: heightPx * scale,
          }}
          onResizeStop={handleResize}
          minWidth={pixelsPerFoot * scale}
          minHeight={pixelsPerFoot * scale}
          enable={{
            top: true,
            right: true,
            bottom: true,
            left: true,
            topRight: true,
            bottomRight: true,
            bottomLeft: true,
            topLeft: true,
          }}
          className={`
            rounded-lg border-2
            transition-shadow duration-200
            ${config.color}
            ring-4 ring-green-500 ring-opacity-50 shadow-lg
          `}
          style={{
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          }}
          onClick={(e) => {
            e.stopPropagation();
            onSelect(component);
          }}
          handleStyles={{
            top: { cursor: 'ns-resize' },
            right: { cursor: 'ew-resize' },
            bottom: { cursor: 'ns-resize' },
            left: { cursor: 'ew-resize' },
            topRight: { cursor: 'nesw-resize' },
            bottomRight: { cursor: 'nwse-resize' },
            bottomLeft: { cursor: 'nesw-resize' },
            topLeft: { cursor: 'nwse-resize' },
          }}
          handleClasses={{
            top: 'bg-green-500 hover:bg-green-600',
            right: 'bg-green-500 hover:bg-green-600',
            bottom: 'bg-green-500 hover:bg-green-600',
            left: 'bg-green-500 hover:bg-green-600',
            topRight: 'bg-green-500 hover:bg-green-600',
            bottomRight: 'bg-green-500 hover:bg-green-600',
            bottomLeft: 'bg-green-500 hover:bg-green-600',
            topLeft: 'bg-green-500 hover:bg-green-600',
          }}
        >
          <div className="h-full w-full cursor-move relative overflow-hidden" ref={componentRef}>
            {content}
          </div>
        </Resizable>
      </div>
    );
  }

  return (
    <div
      ref={componentRef}
      className={`
        absolute cursor-move rounded-xl border-2 overflow-hidden
        transition-all duration-300 ease-in-out
        ${config.color}
        ${isSelected 
          ? 'ring-4 ring-green-500 ring-opacity-60 shadow-2xl z-10' 
          : 'hover:shadow-xl hover:border-opacity-100'
        }
        ${isDragging ? 'opacity-60' : 'opacity-100'}
      `}
      style={{
        left: `${xPx * scale}px`,
        top: `${yPx * scale}px`,
        width: `${widthPx * scale}px`,
        height: `${heightPx * scale}px`,
        boxShadow: isSelected 
          ? '0 8px 24px rgba(0,0,0,0.2), 0 0 0 1px rgba(255,255,255,0.1) inset' 
          : '0 2px 8px rgba(0,0,0,0.08), 0 0 0 1px rgba(255,255,255,0.5) inset',
        backdropFilter: 'blur(8px)',
        transform: `rotate(${component.rotation}deg) scale(${isSelected ? 1.02 : 1})`,
        transformOrigin: 'center center',
      }}
      onClick={(e) => {
        e.stopPropagation();
        onSelect(component);
      }}
    >
      {content}
    </div>
  );
}
