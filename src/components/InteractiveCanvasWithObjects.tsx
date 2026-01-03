import { Canvas, useFrame, useThree } from '@react-three/fiber';
import type { ThreeEvent } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import { useState, useRef, useMemo, useEffect } from 'react';
import { Mesh, Vector3, CatmullRomCurve3, TubeGeometry } from 'three';
import '../App.css';

type ObjectType = 'triangle' | 'cube' | 'sphere' | 'torus';

interface PlacedObject {
  id: string;
  type: ObjectType;
  position: [number, number, number];
}

interface DrawnLine {
  id: string;
  points: [number, number, number][];
  thickness: number;
}

const objectTypes: ObjectType[] = ['triangle', 'cube', 'sphere', 'torus'];
const objectIcons: Record<ObjectType, string> = { triangle: '▲', cube: '■', sphere: '●', torus: '◯' };

function getColorFromPosition(position: [number, number, number]): string {
  const hash = position[0] * 1000 + position[1] * 100 + position[2] * 10;
  return `hsl(${((hash % 360) + 360) % 360}, 70%, 60%)`;
}

function RotatingMesh({ children, position }: { children: React.ReactNode; position: [number, number, number] }) {
  const meshRef = useRef<Mesh>(null);
  useFrame((_, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.x += delta;
    }
  });
  return (
    <mesh ref={meshRef} position={position}>
      {children}
      <meshStandardMaterial color={useMemo(() => getColorFromPosition(position), [position])} />
    </mesh>
  );
}

function ObjectRenderer({ type, position }: { type: ObjectType; position: [number, number, number] }) {
  const geometries = {
    triangle: <tetrahedronGeometry args={[0.8]} />,
    cube: <boxGeometry args={[1, 1, 1]} />,
    sphere: <sphereGeometry args={[0.5, 32, 32]} />,
    torus: <torusGeometry args={[0.5, 0.25, 16, 100]} />
  };
  return <RotatingMesh position={position}>{geometries[type]}</RotatingMesh>;
}

function KeyboardControls() {
  const { camera } = useThree();
  const keysPressed = useRef<Set<string>>(new Set());

  useEffect(() => {
    const arrows = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'];
    const handleKey = (e: KeyboardEvent, down: boolean) => {
      if (arrows.includes(e.key)) {
        e.preventDefault();
        if (down) {
          keysPressed.current.add(e.key);
        } else {
          keysPressed.current.delete(e.key);
        }
      }
    };
    const downHandler = (e: KeyboardEvent) => handleKey(e, true);
    const upHandler = (e: KeyboardEvent) => handleKey(e, false);
    window.addEventListener('keydown', downHandler);
    window.addEventListener('keyup', upHandler);
    return () => {
      window.removeEventListener('keydown', downHandler);
      window.removeEventListener('keyup', upHandler);
    };
  }, []);

  useFrame((_, delta) => {
    const move = new Vector3();
    const speed = 20 * delta;
    const keys = keysPressed.current;
    if (keys.has('ArrowUp')) {
      move.y += speed;
    }
    if (keys.has('ArrowDown')) {
      move.y -= speed;
    }
    if (keys.has('ArrowLeft')) {
      move.x -= speed;
    }
    if (keys.has('ArrowRight')) {
      move.x += speed;
    }
    if (move.length() > 0) {
      camera.position.add(move);
    }
  });

  return null;
}

function LineRenderer({ line }: { line: DrawnLine }) {
  const geometry = useMemo(() => {
    if (line.points.length < 2) {
      return null;
    }
    return new TubeGeometry(
      new CatmullRomCurve3(line.points.map((point) => new Vector3(...point))),
      Math.max(32, line.points.length * 2),
      line.thickness / 50,
      8,
      false
    );
  }, [line.points, line.thickness]);
  if (!geometry) {
    return null;
  }
  return (
    <mesh geometry={geometry}>
      <meshStandardMaterial color='#ff0000' />
    </mesh>
  );
}

function CanvasContent({
  selectedObjectType,
  placedObjects,
  onPlaceObject,
  isDrawing,
  onDrawingStart,
  onDrawingMove,
  onDrawingEnd,
  drawnLines
}: {
  selectedObjectType: ObjectType | null;
  placedObjects: PlacedObject[];
  onPlaceObject: (position: [number, number, number], type: ObjectType) => void;
  isDrawing: boolean;
  onDrawingStart: (point: [number, number, number]) => void;
  onDrawingMove: (point: [number, number, number]) => void;
  onDrawingEnd: () => void;
  drawnLines: DrawnLine[];
}) {
  const [isDrawingActive, setIsDrawingActive] = useState(false);
  const clickStartRef = useRef<{ point: Vector3; time: number } | null>(null);
  const getPoint = (e: ThreeEvent<MouseEvent | PointerEvent>) => [e.point.x, e.point.y, e.point.z] as [number, number, number];

  return (
    <>
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 10, 5]} intensity={1} />
      <pointLight position={[-10, -10, -5]} intensity={0.5} />
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0, 0]}
        onPointerDown={(event) => {
          if (isDrawing) {
            event.stopPropagation();
            setIsDrawingActive(true);
            onDrawingStart(getPoint(event));
          } else if (selectedObjectType) {
            clickStartRef.current = { point: event.point.clone(), time: Date.now() };
          }
        }}
        onClick={(event) => {
          if (!isDrawing && !isDrawingActive && selectedObjectType && clickStartRef.current) {
            const moved = clickStartRef.current.point.distanceTo(event.point) > 0.1;
            const timeDiff = Date.now() - clickStartRef.current.time;
            if (!moved && timeDiff < 300) {
              event.stopPropagation();
              onPlaceObject(getPoint(event), selectedObjectType);
            }
            clickStartRef.current = null;
          }
        }}
        onPointerMove={(event) => {
          if (isDrawing && isDrawingActive) {
            event.stopPropagation();
            onDrawingMove(getPoint(event));
          } else if (clickStartRef.current && !isDrawing) {
            // Clear click tracking if user moved during camera pan
            const moved = clickStartRef.current.point.distanceTo(event.point) > 0.1;
            if (moved) {
              clickStartRef.current = null;
            }
          }
        }}
        onPointerUp={() => {
          if (isDrawingActive) {
            setIsDrawingActive(false);
            onDrawingEnd();
          }
        }}
        onPointerLeave={() => {
          if (isDrawingActive) {
            setIsDrawingActive(false);
            onDrawingEnd();
          }
        }}
      >
        <planeGeometry args={[1000, 1000]} />
        <meshBasicMaterial transparent opacity={0} />
      </mesh>
      <gridHelper args={[100, 100, '#666666', '#999999']} position={[0, -0.01, 0]} />
      {drawnLines.map((line) => (
        <LineRenderer key={line.id} line={line} />
      ))}
      {placedObjects.map((obj) => (
        <ObjectRenderer key={obj.id} type={obj.type} position={obj.position} />
      ))}
      <KeyboardControls />
      <OrbitControls enableDamping dampingFactor={0.05} minDistance={5} maxDistance={100} enabled={!isDrawing} />
    </>
  );
}

export default function Interactive3DCanvasWithObjects() {
  const [selectedObjectType, setSelectedObjectType] = useState<ObjectType | null>(null);
  const [placedObjects, setPlacedObjects] = useState<PlacedObject[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawnLines, setDrawnLines] = useState<DrawnLine[]>([]);
  const [lineThickness, setLineThickness] = useState(2);
  const currentLineRef = useRef<DrawnLine | null>(null);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <div className='canvas-controls'>
        {objectTypes.map((objectType) => (
          <button
            key={objectType}
            className={`control-button ${selectedObjectType === objectType ? 'active' : ''}`}
            onClick={() => {
              setSelectedObjectType((currentSelectedObjectType) => (currentSelectedObjectType === objectType ? null : objectType));
              setIsDrawing(false);
            }}
          >
            <span style={{ fontSize: '1.2em', marginRight: '8px' }}>{objectIcons[objectType]}</span>
            {objectType.charAt(0).toUpperCase() + objectType.slice(1)}
          </button>
        ))}
        <button
          className={`control-button ${isDrawing ? 'active' : ''}`}
          onClick={() => {
            setIsDrawing(!isDrawing);
            setSelectedObjectType(null);
          }}
          style={isDrawing ? { background: 'rgba(76, 175, 80, 0.9)', color: 'white' } : {}}
        >
          ✏️ Draw
        </button>
        {isDrawing && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              background: 'rgba(255, 255, 255, 0.9)',
              padding: '8px 12px',
              borderRadius: '8px',
              border: '2px solid rgba(102, 126, 234, 0.5)'
            }}
          >
            <label style={{ fontSize: '12px', fontWeight: '600', color: '#667eea', whiteSpace: 'nowrap' }}>Thickness:</label>
            <input
              type='range'
              min='1'
              max='5'
              value={lineThickness}
              onChange={(event) => setLineThickness(Number(event.target.value))}
              style={{ width: '100px' }}
            />
            <span style={{ fontSize: '12px', fontWeight: '600', color: '#667eea', minWidth: '20px' }}>{lineThickness}</span>
          </div>
        )}
        <button
          className='control-button'
          onClick={() => {
            setPlacedObjects([]);
            setDrawnLines([]);
            setSelectedObjectType(null);
            setIsDrawing(false);
          }}
          style={{ background: 'rgba(244, 67, 54, 0.9)', color: 'white' }}
        >
          🗑️ Clear
        </button>
      </div>
      <Canvas>
        <PerspectiveCamera makeDefault position={[0, 5, 10]} fov={75} />
        <CanvasContent
          selectedObjectType={selectedObjectType}
          placedObjects={placedObjects}
          onPlaceObject={(position, type) =>
            setPlacedObjects((currentPlacedObjects) => [
              ...currentPlacedObjects,
              { id: `obj-${Date.now()}-${position[0] * 1000 + position[1] * 100 + position[2]}`, type, position }
            ])
          }
          isDrawing={isDrawing}
          onDrawingStart={(point) => {
            const newLine: DrawnLine = { id: `line-${Date.now()}`, points: [point], thickness: lineThickness };
            currentLineRef.current = newLine;
            setDrawnLines((currentDrawnLines) => [...currentDrawnLines, newLine]);
          }}
          onDrawingMove={(point) => {
            if (!currentLineRef.current) return;
            currentLineRef.current.points.push(point);
            setDrawnLines((currentDrawnLines) => {
              const updated = [...currentDrawnLines];
              const index = updated.findIndex((line) => line.id === currentLineRef.current?.id);
              if (index !== -1 && currentLineRef.current) {
                updated[index] = { ...currentLineRef.current, points: [...currentLineRef.current.points] };
              }
              return updated;
            });
          }}
          onDrawingEnd={() => (currentLineRef.current = null)}
          drawnLines={drawnLines}
        />
      </Canvas>
    </div>
  );
}
