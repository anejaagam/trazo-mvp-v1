import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { FarmLayoutEditor } from './components/FarmLayoutEditor';

export default function App() {
  return (
    <DndProvider backend={HTML5Backend}>
      <FarmLayoutEditor />
    </DndProvider>
  );
}
