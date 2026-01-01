import { useFrame, useThree } from '@react-three/fiber';
import { useRef, useState } from 'react';
import { Mesh } from 'three';
import { Canvas } from '@react-three/fiber';
import { useDrag } from '@use-gesture/react';
import '../../App.css';

export interface DodecahedronProps {
  color?: string;
  positionZ: number;
  opacity?: number;
}

export function Dodecahedron({ color, positionZ, opacity = 1 }: DodecahedronProps) {
  const [hovered, setHover] = useState(false);
  const { viewport } = useThree();
  const meshRef = useRef<Mesh>(null!);
  const [position, setPosition] = useState<[number, number, number]>([0, 0, positionZ]);

  useFrame((_, delta) => {
    meshRef.current.rotation.x += delta;
    meshRef.current.rotation.y += delta;
  });

  const bind = useDrag(({ event, offset: [x, y] }) => {
    event.stopPropagation();
    const aspect = viewport.getCurrentViewport().factor;
    setPosition([x / aspect, -y / aspect, positionZ]);
  });

  return (
    <mesh
      ref={meshRef}
      position={position}
      {...bind()}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHover(true);
      }}
      onPointerOut={(e) => {
        e.stopPropagation();
        setHover(false);
      }}
    >
      <dodecahedronGeometry args={[1, 0]} />
      <meshStandardMaterial transparent opacity={opacity} color={hovered ? 'hotpink' : color} />
    </mesh>
  );
}

export default function DodecahedronWithGestures() {
  return (
    <>
      <Canvas>
        <ambientLight intensity={0.5 * Math.PI} />
        <spotLight decay={0} position={[10, 10, 10]} angle={0.15} penumbra={1} />
        <pointLight decay={0} position={[-10, -10, -10]} />
        <Dodecahedron color='gold' positionZ={1} opacity={0.8} />
        <Dodecahedron color='gold' positionZ={-2} />
      </Canvas>
    </>
  );
}
