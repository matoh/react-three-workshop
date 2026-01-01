import { Canvas } from '@react-three/fiber';

export default function SimpleSquare() {
  return (
    <Canvas>
      <mesh>
        <boxGeometry args={[2, 2, 2]} />
        <meshPhongMaterial />
      </mesh>
      <ambientLight intensity={0.1} />
      <directionalLight position={[0, 0, 1]} color='green' />
    </Canvas>
  );
}
