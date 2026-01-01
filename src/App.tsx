import { useState } from 'react';
import RotatingCubes from './components/simple/RotatingCubes';
import SimpleSquare from './components/simple/SimpleSquare';
import './App.css';

type ExampleComponent = 'rotating-cubes' | 'simple-square';

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
  }

];

export default function App() {
  const [selectedExampleName, setSelectedExample] = useState<ExampleComponent>('rotating-cubes');

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
