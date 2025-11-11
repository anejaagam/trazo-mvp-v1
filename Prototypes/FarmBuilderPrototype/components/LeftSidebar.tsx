import { useDrag } from 'react-dnd';
import { Container, DoorClosed, Coffee, Package, Route, PlusSquare } from 'lucide-react';
import { ComponentType } from './FarmLayoutEditor';

interface ComponentItem {
  type: ComponentType;
  label: string;
  icon: React.ReactNode;
  color: string;
  description?: string;
}

const components: ComponentItem[] = [
  { 
    type: 'pod-40ft', 
    label: '40ft Pod', 
    icon: <Container className="h-5 w-5" />, 
    color: 'bg-green-100 text-green-700 border-green-300',
    description: '40\' × 8\' shipping container'
  },
  { 
    type: 'pod-20ft', 
    label: '20ft Pod', 
    icon: <Container className="h-4 w-4" />, 
    color: 'bg-green-100 text-green-700 border-green-300',
    description: '20\' × 8\' shipping container'
  },
  { 
    type: 'pod-10ft', 
    label: '10ft Pod', 
    icon: <Container className="h-3.5 w-3.5" />, 
    color: 'bg-green-100 text-green-700 border-green-300',
    description: '10\' × 8\' shipping container'
  },
  { 
    type: 'custom-room', 
    label: 'Custom Room', 
    icon: <PlusSquare className="h-5 w-5" />, 
    color: 'bg-emerald-100 text-emerald-700 border-emerald-300',
    description: 'Customizable space'
  },
  { 
    type: 'washroom', 
    label: 'Washroom', 
    icon: <DoorClosed className="h-5 w-5" />, 
    color: 'bg-blue-100 text-blue-700 border-blue-300' 
  },
  { 
    type: 'breakroom', 
    label: 'Break Room', 
    icon: <Coffee className="h-5 w-5" />, 
    color: 'bg-amber-100 text-amber-700 border-amber-300' 
  },
  { 
    type: 'storage', 
    label: 'Storage', 
    icon: <Package className="h-5 w-5" />, 
    color: 'bg-purple-100 text-purple-700 border-purple-300' 
  },
  { 
    type: 'pathway', 
    label: 'Pathway', 
    icon: <Route className="h-5 w-5" />, 
    color: 'bg-neutral-100 text-neutral-700 border-neutral-300' 
  },
];

function DraggableComponent({ item }: { item: ComponentItem }) {
  const [{ isDragging }, drag] = useDrag({
    type: 'component',
    item: { type: item.type },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  return (
    <div
      ref={drag}
      className={`
        ${item.color}
        border-2 rounded-lg p-3 cursor-move
        transition-all duration-200
        hover:shadow-md hover:scale-105
        ${isDragging ? 'opacity-50' : 'opacity-100'}
      `}
    >
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center w-6">
          {item.icon}
        </div>
        <div className="flex-1">
          <div className="text-sm">{item.label}</div>
          {item.description && (
            <div className="text-xs opacity-70 mt-0.5">{item.description}</div>
          )}
        </div>
      </div>
    </div>
  );
}

export function LeftSidebar() {
  return (
    <aside className="w-64 bg-white border-r border-neutral-200 p-4 overflow-y-auto">
      <div className="mb-3">
        <h2 className="text-neutral-800">Components</h2>
        <p className="text-xs text-neutral-500 mt-1">
          Drag to add to canvas
        </p>
      </div>
      
      <div className="space-y-2">
        <div className="text-xs text-neutral-600 mb-2">Shipping Container Pods</div>
        {components.filter(c => c.type.startsWith('pod-')).map((item) => (
          <DraggableComponent key={item.type} item={item} />
        ))}
        
        <div className="text-xs text-neutral-600 mt-4 mb-2">Facilities</div>
        {components.filter(c => !c.type.startsWith('pod-')).map((item) => (
          <DraggableComponent key={item.type} item={item} />
        ))}
      </div>
      
      <div className="mt-6 p-3 bg-green-50 rounded-lg border border-green-200">
        <p className="text-xs text-neutral-600">
          <strong>Tip:</strong> All components are to scale (1 ft = 4px). Drag pods and facilities onto the canvas, then add sensors for monitoring.
        </p>
      </div>
    </aside>
  );
}
