import { useDragLayer } from 'react-dnd';
import { Container, DoorClosed, Coffee, Package, Route, PlusSquare } from 'lucide-react';

const componentConfig = {
  'pod-40ft': { icon: Container, color: 'bg-gradient-to-br from-green-100 to-green-200 border-green-500 text-green-800' },
  'pod-20ft': { icon: Container, color: 'bg-gradient-to-br from-green-100 to-green-200 border-green-500 text-green-800' },
  'pod-10ft': { icon: Container, color: 'bg-gradient-to-br from-green-100 to-green-200 border-green-500 text-green-800' },
  'washroom': { icon: DoorClosed, color: 'bg-gradient-to-br from-blue-100 to-blue-200 border-blue-500 text-blue-800' },
  'breakroom': { icon: Coffee, color: 'bg-gradient-to-br from-amber-100 to-amber-200 border-amber-500 text-amber-800' },
  'storage': { icon: Package, color: 'bg-gradient-to-br from-purple-100 to-purple-200 border-purple-500 text-purple-800' },
  'pathway': { icon: Route, color: 'bg-gradient-to-br from-neutral-100 to-neutral-200 border-neutral-400 text-neutral-700' },
  'custom-room': { icon: PlusSquare, color: 'bg-gradient-to-br from-emerald-100 to-emerald-200 border-emerald-500 text-emerald-800' },
};

export function DragLayer() {
  const { isDragging, item, currentOffset } = useDragLayer((monitor) => ({
    item: monitor.getItem(),
    currentOffset: monitor.getClientOffset(),
    isDragging: monitor.isDragging(),
  }));

  if (!isDragging || !currentOffset || !item || item.type === 'component') {
    return null;
  }

  const config = componentConfig[item.type as keyof typeof componentConfig];
  if (!config) return null;

  const Icon = config.icon;

  return (
    <div
      className="fixed pointer-events-none z-50"
      style={{
        left: 0,
        top: 0,
        width: '100%',
        height: '100%',
      }}
    >
      <div
        className={`
          absolute rounded-xl border-2 overflow-hidden opacity-80
          ${config.color}
          shadow-2xl
        `}
        style={{
          left: `${currentOffset.x - (item.offsetX || 0)}px`,
          top: `${currentOffset.y - (item.offsetY || 0)}px`,
          width: `${item.width}px`,
          height: `${item.height}px`,
          transform: `rotate(${item.rotation || 0}deg)`,
          transformOrigin: 'center center',
          boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
        }}
      >
        <div className="absolute top-2 left-2" style={{ opacity: 0.9 }}>
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </div>
  );
}
