import { createPortal, useFrame, useThree } from '@react-three/fiber';
import { useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Mesh, Scene, OrthographicCamera, Matrix4 } from 'three';
import { Canvas } from '@react-three/fiber';
import '../App.css';
import { OrbitControls } from '@react-three/drei';

export interface TorusCubeViewProps {
  color?: string;
  positionZ: number;
  opacity?: number;
}

function ViewCube() {
  const { gl, scene: defaultScene, camera: defaultCamera, size, events } = useThree();
  const scene = useMemo(() => new Scene(), []);
  const camera = useMemo(() => new OrthographicCamera(-1, 1, 1, -1, 0.1, 1000), []);

  useLayoutEffect(() => {
    // eslint-disable-next-line
    camera.left = -size.width / 2;
    camera.right = size.width / 2;
    camera.top = size.height / 2;
    camera.bottom = -size.height / 2;
    camera.position.set(0, 0, 100);
    camera.updateProjectionMatrix();
  }, [size, camera]);

  const ref = useRef<Mesh>(null!);
  const [hover, setHover] = useState<number | null>(null);
  const matrix = new Matrix4();

  useFrame(() => {
    matrix.copy(defaultCamera.matrix).invert();
    ref.current.quaternion.setFromRotationMatrix(matrix);
    // eslint-disable-next-line
    gl.autoClear = true;
    gl.render(defaultScene, defaultCamera);
    gl.autoClear = false;
    gl.clearDepth();
    gl.render(scene, camera);
  }, 1);

  return (
    <>
      {createPortal(
        <group>
          <mesh
            ref={ref}
            position={[size.width / 2 - 120, size.height / 2 - 120, 0]}
            onPointerOut={() => setHover(null)}
            onPointerMove={({ faceIndex }) => setHover(Math.floor((faceIndex || 0) / 2))}
          >
            {[...Array(6)].map((_, index) => (
              <meshLambertMaterial attach={`material-${index}`} key={index} color={hover === index ? 'hotpink' : 'white'} />
            ))}
            <boxGeometry args={[80, 80, 80]} />
          </mesh>
          <ambientLight intensity={0.5 * Math.PI} />
          <pointLight decay={0} position={[10, 10, 10]} intensity={0.5} />
        </group>,
        scene,
        { camera, events: { priority: events.priority + 1 } }
      )}
    </>
  );
}

export default function TorusCubeView() {
  return (
    <>
      <Canvas>
        <mesh>
          <torusGeometry args={[1, 0.5, 32, 100]} />
          <meshNormalMaterial />
        </mesh>
        <ViewCube />
        <OrbitControls />
      </Canvas>
    </>
  );
}
