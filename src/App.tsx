import { useState } from 'react';
import RotatingCubes from './components/RotatingCubes';
import SimpleSquare from './components/SimpleSquare';
import './App.css';
import DodecahedronWithGestures from './components/DodecahedronWithGestures';
import TorusCubeView from './components/TorusCubeView';
import InfiniteCanvasWithObjects from './components/InfiniteCanvasWithObjects';

type ExampleComponent = 'rotating-cubes' | 'simple-square' | 'dodecahedron' | 'torus-cube-view' | 'interactive-3d-canvas-with-objects';

interface Example {
  id: ExampleComponent;
  name: string;
  description: string;
  component: React.ComponentType;
}

const examples: Example[] = [
  {
    id: 'simple-square',
    name: 'Simple Square',
    description: 'A basic square with lighting',
    component: SimpleSquare
  },
  {
    id: 'rotating-cubes',
    name: 'Rotating Cubes',
    description: 'Rotating cubes with hover effects',
    component: RotatingCubes
  },
  {
    id: 'dodecahedron',
    name: 'Dodecahedron With Gestures',
    description: 'Interactive dodecahedron with gestures',
    component: DodecahedronWithGestures
  },
  {
    id: 'torus-cube-view',
    name: 'Torus Cube View',
    description: 'Interactive torus with cube view',
    component: TorusCubeView
  },
  {
    id: 'interactive-3d-canvas-with-objects',
    name: 'Interactive 3D Canvas With Objects',
    description: 'Interactive 3D canvas: place shapes and draw lines',
    component: InfiniteCanvasWithObjects
  }
];

export default function App() {
  const [selectedExampleName, setSelectedExample] = useState<ExampleComponent>('interactive-3d-canvas-with-objects');
  const selectedExample = examples.find((example) => example.id === selectedExampleName);
  const CurrentComponent = selectedExample?.component || RotatingCubes;

  return (
    <div className='app-container'>
      <div className='example-selector'>
        <h1 className='selector-title'>React Three Fiber Examples</h1>
        <div className='example-cards'>
          {examples.map((example) => (
            <button
              key={example.id}
              className={`example-card ${selectedExampleName === example.id ? 'active' : ''}`}
              onClick={() => setSelectedExample(example.id)}
            >
              <h3 className='card-title'>{example.name}</h3>
              <p className='card-description'>{example.description}</p>
            </button>
          ))}
        </div>
      </div>
      <div className='canvas-container'>
        <CurrentComponent />
      </div>
    </div>
  );
}
