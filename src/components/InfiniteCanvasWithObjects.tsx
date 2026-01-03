import { Canvas, useFrame, useThree } from '@react-three/fiber';
import type { ThreeEvent } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import { useState, useRef, useMemo, useEffect } from 'react';
import { Mesh, BufferGeometry, Float32BufferAttribute, Uint16BufferAttribute, Vector3, CatmullRomCurve3, TubeGeometry } from 'three';
import '../App.css';

type ObjectType = 'triangle' | 'cube' | 'sphere' | 'star' | 'torus';

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

const objectTypes: ObjectType[] = ['triangle', 'cube', 'sphere', 'star', 'torus'];
const objectIcons: Record<ObjectType, string> = { triangle: '▲', cube: '■', sphere: '●', star: '★', torus: '◯' };

function getColorFromPosition(position: [number, number, number]): string {
  const hash = position[0] * 1000 + position[1] * 100 + position[2] * 10;
  return `hsl(${((hash % 360) + 360) % 360}, 70%, 60%)`;
}

function RotatingMesh({ children, position }: { children: React.ReactNode; position: [number, number, number] }) {
  const meshRef = useRef<Mesh>(null);
  useFrame(() => {
    if (meshRef.current) meshRef.current.rotation.y += 0.01;
  });
  return (
    <mesh ref={meshRef} position={position}>
      {children}
      <meshStandardMaterial color={useMemo(() => getColorFromPosition(position), [position])} />
    </mesh>
  );
}

function StarMesh({ position }: { position: [number, number, number] }) {
  const meshRef = useRef<Mesh>(null);
  const geometry = useMemo(() => {
    const geo = new BufferGeometry();
    const vertices: number[] = [];
    const indices: number[] = [];
    const outerRadius = 0.6;
    const innerRadius = 0.3;
    const points = 5;
    const depth = 0.3;

    for (let layer = 0; layer < 2; layer++) {
      const z = layer === 0 ? depth / 2 : -depth / 2;
      for (let i = 0; i < points * 2; i++) {
        const angle = (i * Math.PI) / points - Math.PI / 2;
        const radius = i % 2 === 0 ? outerRadius : innerRadius;
        vertices.push(Math.cos(angle) * radius, Math.sin(angle) * radius, z);
      }
    }

    const bottomStart = points * 2;
    for (let i = 0; i < points * 2; i++) {
      const next = (i + 1) % (points * 2);
      indices.push(0, i, next, bottomStart, bottomStart + next, bottomStart + i);
      indices.push(i, bottomStart + i, next, next, bottomStart + i, bottomStart + next);
    }

    geo.setAttribute('position', new Float32BufferAttribute(new Float32Array(vertices), 3));
    geo.setIndex(new Uint16BufferAttribute(new Uint16Array(indices), 1));
    geo.computeVertexNormals();
    return geo;
  }, []);

  useFrame(() => {
    if (meshRef.current) {
      meshRef.current.rotation.y += 0.01;
      meshRef.current.rotation.z += 0.005;
    }
  });

  return (
    <mesh ref={meshRef} position={position} geometry={geometry}>
      <meshStandardMaterial color={useMemo(() => getColorFromPosition(position), [position])} />
    </mesh>
  );
}

function ObjectRenderer({ type, position }: { type: ObjectType; position: [number, number, number] }) {
  if (type === 'triangle')
    return (
      <RotatingMesh position={position}>
        <tetrahedronGeometry args={[0.8]} />
      </RotatingMesh>
    );
  if (type === 'star') return <StarMesh position={position} />;
  const geometries = {
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
        if (down) keysPressed.current.add(e.key);
        else keysPressed.current.delete(e.key);
      }
    };
    const down = (e: KeyboardEvent) => handleKey(e, true);
    const up = (e: KeyboardEvent) => handleKey(e, false);
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
    };
  }, []);

  useFrame((_, delta) => {
    const move = new Vector3();
    const speed = 20 * delta;
    const keys = keysPressed.current;
    if (keys.has('ArrowUp')) move.y += speed;
    if (keys.has('ArrowDown')) move.y -= speed;
    if (keys.has('ArrowLeft')) move.x -= speed;
    if (keys.has('ArrowRight')) move.x += speed;
    if (move.length() > 0) camera.position.add(move);
  });

  return null;
}

function LineRenderer({ line }: { line: DrawnLine }) {
  const geometry = useMemo(() => {
    if (line.points.length < 2) return null;
    return new TubeGeometry(
      new CatmullRomCurve3(line.points.map((p) => new Vector3(...p))),
      Math.max(32, line.points.length * 2),
      line.thickness / 50,
      8,
      false
    );
  }, [line.points, line.thickness]);
  if (!geometry) return null;
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
        onPointerDown={(e) => {
          if (isDrawing) {
            e.stopPropagation();
            setIsDrawingActive(true);
            onDrawingStart(getPoint(e));
          } else if (selectedObjectType) {
            clickStartRef.current = { point: e.point.clone(), time: Date.now() };
          }
        }}
        onClick={(e) => {
          if (!isDrawing && !isDrawingActive && selectedObjectType && clickStartRef.current) {
            const moved = clickStartRef.current.point.distanceTo(e.point) > 0.1;
            const timeDiff = Date.now() - clickStartRef.current.time;
            if (!moved && timeDiff < 300) {
              e.stopPropagation();
              onPlaceObject(getPoint(e), selectedObjectType);
            }
            clickStartRef.current = null;
          }
        }}
        onPointerMove={(e) => {
          if (isDrawing && isDrawingActive) {
            e.stopPropagation();
            onDrawingMove(getPoint(e));
          } else if (clickStartRef.current && !isDrawing) {
            // Clear click tracking if user moved during camera pan
            const moved = clickStartRef.current.point.distanceTo(e.point) > 0.1;
            if (moved) clickStartRef.current = null;
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

export default function InfiniteCanvasWithObjects() {
  const [selectedObjectType, setSelectedObjectType] = useState<ObjectType | null>(null);
  const [placedObjects, setPlacedObjects] = useState<PlacedObject[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawnLines, setDrawnLines] = useState<DrawnLine[]>([]);
  const [lineThickness, setLineThickness] = useState(2);
  const currentLineRef = useRef<DrawnLine | null>(null);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <div className='canvas-controls'>
        {objectTypes.map((type) => (
          <button
            key={type}
            className={`control-button ${selectedObjectType === type ? 'active' : ''}`}
            onClick={() => {
              setSelectedObjectType((prev) => (prev === type ? null : type));
              setIsDrawing(false);
            }}
          >
            <span style={{ fontSize: '1.2em', marginRight: '8px' }}>{objectIcons[type]}</span>
            {type.charAt(0).toUpperCase() + type.slice(1)}
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
              onChange={(e) => setLineThickness(Number(e.target.value))}
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
            setPlacedObjects((prev) => [
              ...prev,
              { id: `obj-${Date.now()}-${position[0] * 1000 + position[1] * 100 + position[2]}`, type, position }
            ])
          }
          isDrawing={isDrawing}
          onDrawingStart={(point) => {
            const newLine: DrawnLine = { id: `line-${Date.now()}`, points: [point], thickness: lineThickness };
            currentLineRef.current = newLine;
            setDrawnLines((prev) => [...prev, newLine]);
          }}
          onDrawingMove={(point) => {
            if (!currentLineRef.current) return;
            currentLineRef.current.points.push(point);
            setDrawnLines((prev) => {
              const updated = [...prev];
              const index = updated.findIndex((line) => line.id === currentLineRef.current?.id);
              if (index !== -1 && currentLineRef.current)
                updated[index] = { ...currentLineRef.current, points: [...currentLineRef.current.points] };
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
