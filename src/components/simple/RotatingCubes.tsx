import { useFrame } from '@react-three/fiber';
import { useRef, useState } from 'react';
import { Mesh } from 'three';
import { Canvas } from '@react-three/fiber';
import '../../App.css';

export interface CubeProps {
  position: [number, number, number];
  color?: string;
}

export function Cube({ position, color = 'white' }: CubeProps) {
  const [hovered, setHover] = useState(false);
  const meshRef = useRef<Mesh>(null!);
  useFrame((_, delta) => (meshRef.current.rotation.x += delta * (hovered ? 1.5 : 1)));

  return (
    <mesh
      ref={meshRef}
      position={position}
      onPointerOver={() => setHover(true)}
      scale={hovered ? 1.5 : 1}
      onPointerOut={() => setHover(false)}
    >
      <boxGeometry args={[1, 1, 1]} />
      <meshPhongMaterial color={color} />
    </mesh>
  );
}

export default function RotatingCubes() {
  const [pointLightActivated, setPointLight] = useState(false);
  const [ambiendLightActivated, setAmbiendLight] = useState(false);
  const [directionalLightActivated, setDirectionalLight] = useState(true);

  return (
    <>
      <div className='canvas-controls'>
        <button className={`control-button ${pointLightActivated ? 'active' : ''}`} onClick={() => setPointLight(!pointLightActivated)}>
          Point light
        </button>
        <button
          className={`control-button ${ambiendLightActivated ? 'active' : ''}`}
          onClick={() => setAmbiendLight(!ambiendLightActivated)}
        >
          Ambiend light
        </button>
        <button
          className={`control-button ${directionalLightActivated ? 'active' : ''}`}
          onClick={() => setDirectionalLight(!directionalLightActivated)}
        >
          Directional light
        </button>
      </div>
      <Canvas>
        <Cube position={[-1.5, 0, 0]} color='hotpink' />
        <Cube position={[1.5, 0, 0]} color='gold' />
        {ambiendLightActivated && <ambientLight intensity={20} />}
        {pointLightActivated && <pointLight position={[1.5, 0, 1]} color='green' />}
        {directionalLightActivated && <directionalLight position={[0, 0, 1]} color='white' />}
      </Canvas>
    </>
  );
}
