import { ContactShadows, CameraControls } from '@react-three/drei';
import { Canvas, useThree } from '@react-three/fiber';
import { useEffect, useLayoutEffect, useRef } from 'react';
import CameraControlsImpl from 'camera-controls';
import {
  ACESFilmicToneMapping,
  Group,
  Mesh,
  PMREMGenerator,
} from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { storySteps } from '../data/story';
import { useDemo } from '../state/DemoProvider';
import { Assembly } from './Assembly';

function StudioEnvironment() {
  const gl = useThree((state) => state.gl);
  const scene = useThree((state) => state.scene);

  useLayoutEffect(() => {
    const pmrem = new PMREMGenerator(gl);
    const room = new RoomEnvironment();
    const texture = pmrem.fromScene(room, 0.04).texture;
    scene.environment = texture;
    scene.environmentIntensity = 0.28;
    return () => {
      scene.environment = null;
      texture.dispose();
      pmrem.dispose();
      room.dispose();
    };
  }, [gl, scene]);

  return null;
}

function CameraRig() {
  const controls = useRef<CameraControlsImpl>(null);
  const { steps, stepIndex, cameraNonce } = useDemo();
  const posed = useRef(false);

  useLayoutEffect(() => {
    const pose = steps[stepIndex]?.camera ?? storySteps[0].camera;
    const api = controls.current;
    if (!api) return;
    void api.setLookAt(
      pose.position[0],
      pose.position[1],
      pose.position[2],
      pose.target[0],
      pose.target[1],
      pose.target[2],
      posed.current,
    );
    posed.current = true;
  }, [steps, stepIndex, cameraNonce]);

  return (
    <CameraControls
      ref={controls}
      smoothTime={0.55}
      dollyToCursor={false}
      minDistance={0.45}
      maxDistance={9}
      maxPolarAngle={Math.PI / 2.06}
    />
  );
}

function CaptureBridge() {
  const gl = useThree((state) => state.gl);
  const scene = useThree((state) => state.scene);
  const camera = useThree((state) => state.camera);
  const { registerCapture } = useDemo();

  useEffect(() => {
    registerCapture(() => {
      gl.setRenderTarget(null);
      gl.render(scene, camera);
      return gl.domElement.toDataURL('image/png');
    });
    return () => registerCapture(null);
  }, [camera, gl, registerCapture, scene]);

  return null;
}

function ShadowCatcher() {
  const ref = useRef<Group>(null);

  useLayoutEffect(() => {
    ref.current?.traverse((object) => {
      if (object instanceof Mesh) object.raycast = () => null;
    });
  }, []);

  return (
    <ContactShadows
      ref={ref}
      position={[0, -0.004, 0.3]}
      opacity={0.42}
      scale={9}
      blur={2.5}
      far={4.5}
      resolution={1024}
      color="#1d2630"
    />
  );
}

export function Viewer() {
  const { select } = useDemo();
  const pose = storySteps[0].camera;

  return (
    <Canvas
      className="scene-canvas"
      shadows={false}
      dpr={[1, 2]}
      camera={{ position: pose.position, fov: 32, near: 0.05, far: 40 }}
      gl={{
        preserveDrawingBuffer: true,
        antialias: true,
        alpha: false,
        powerPreference: 'high-performance',
      }}
      onPointerMissed={() => select(null)}
      onCreated={({ gl }) => {
        gl.toneMapping = ACESFilmicToneMapping;
        gl.toneMappingExposure = 0.96;
        gl.setClearColor('#d5dae1');
      }}
    >
      <color attach="background" args={['#d5dae1']} />
      <StudioEnvironment />
      <hemisphereLight args={['#f7f8fa', '#6d7784', 0.28]} />
      <ambientLight intensity={0.03} />
      <directionalLight position={[2.2, 8.4, 0.6]} intensity={1.85} />
      <directionalLight position={[-3.4, 2.2, 2.8]} intensity={0.22} color="#d5e2f4" />
      <directionalLight position={[-0.4, 3.2, -5.2]} intensity={0.45} />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.008, 0.25]} raycast={() => null}>
        <circleGeometry args={[12, 48]} />
        <meshStandardMaterial color="#c5ccd4" roughness={1} metalness={0} />
      </mesh>
      <Assembly />
      <ShadowCatcher />
      <CameraRig />
      <CaptureBridge />
    </Canvas>
  );
}
