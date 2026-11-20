import { useLayoutEffect, useRef } from 'react';
import { MathUtils, MeshPhysicalMaterial, type Vector3Tuple } from 'three';
import { EXPLODE_MM, MOUNT_HOLES, WASHER_Y } from '../geometry/dimensions';
import { applyBracketLoad, bracketBuffers, geometries, uprightFaceZ } from '../geometry/parts';
import { useDemo } from '../state/DemoProvider';
import type { PartId } from '../types';

interface SolidProps {
  partId: PartId;
  geometry: typeof geometries.plate;
  position?: Vector3Tuple;
  color: string;
  metalness: number;
  roughness: number;
}

function Solid({ partId, geometry, position, color, metalness, roughness }: SolidProps) {
  const { select, setHovered, activeId } = useDemo();
  const highlighted = activeId === partId;

  return (
    <mesh
      name={partId}
      geometry={geometry}
      position={position}
      onClick={(event) => {
        event.stopPropagation();
        select(partId);
      }}
      onPointerOver={(event) => {
        event.stopPropagation();
        setHovered(partId);
      }}
      onPointerOut={(event) => {
        event.stopPropagation();
        setHovered(null);
      }}
    >
      <meshPhysicalMaterial
        color={color}
        metalness={metalness}
        roughness={roughness}
        clearcoat={partId === 'bolt' ? 0.04 : 0.06}
        clearcoatRoughness={0.4}
        envMapIntensity={0.9}
        emissive={highlighted ? '#145ea8' : '#000000'}
        emissiveIntensity={highlighted ? 0.95 : 0}
      />
    </mesh>
  );
}

function Bracket() {
  const { select, setHovered, activeId, load } = useDemo();
  const highlighted = activeId === 'l-bracket';
  const material = useRef<MeshPhysicalMaterial>(null);

  useLayoutEffect(() => {
    applyBracketLoad(bracketBuffers, load);
  }, [load]);

  return (
    <mesh
      name="l-bracket"
      geometry={geometries.bracket}
      onClick={(event) => {
        event.stopPropagation();
        select('l-bracket');
      }}
      onPointerOver={(event) => {
        event.stopPropagation();
        setHovered('l-bracket');
      }}
      onPointerOut={(event) => {
        event.stopPropagation();
        setHovered(null);
      }}
    >
      <meshPhysicalMaterial
        ref={material}
        vertexColors
        color="#ffffff"
        metalness={MathUtils.lerp(0.48, 0.02, load)}
        roughness={MathUtils.lerp(0.4, 0.68, load)}
        clearcoat={MathUtils.lerp(0.08, 0, load)}
        clearcoatRoughness={0.5}
        envMapIntensity={MathUtils.lerp(0.45, 0.05, load)}
        emissive={highlighted && load < 0.2 ? '#145ea8' : '#000000'}
        emissiveIntensity={highlighted && load < 0.2 ? 0.55 : 0}
      />
    </mesh>
  );
}

function LoadArrow() {
  const { load } = useDemo();
  if (load < 0.03) return null;
  const y = 76;
  const opacity = Math.min(1, (load - 0.03) / 0.22);
  const originZ = uprightFaceZ(y, load) - 1.5;

  return (
    <group position={[0, y, originZ]} rotation={[-Math.PI / 2, 0, 0]} raycast={() => null}>
      <mesh position={[0, 15, 0]}>
        <cylinderGeometry args={[1.8, 1.8, 26, 20]} />
        <meshStandardMaterial
          color="#b42318"
          emissive="#8f1d14"
          emissiveIntensity={0.45}
          roughness={0.42}
          metalness={0.05}
          transparent
          opacity={opacity}
          depthWrite={opacity > 0.9}
        />
      </mesh>
      <mesh position={[0, 33, 0]}>
        <coneGeometry args={[4.8, 13, 24]} />
        <meshStandardMaterial
          color="#b42318"
          emissive="#8f1d14"
          emissiveIntensity={0.45}
          roughness={0.42}
          metalness={0.05}
          transparent
          opacity={opacity}
          depthWrite={opacity > 0.9}
        />
      </mesh>
    </group>
  );
}

export function Assembly() {
  const { explode } = useDemo();

  return (
    <group scale={0.01}>
      <group position={[0, EXPLODE_MM.plate * explode, 0]}>
        <Solid
          partId="base-plate"
          geometry={geometries.plate}
          color="#3e4650"
          metalness={0.34}
          roughness={0.55}
        />
      </group>
      <group position={[0, EXPLODE_MM.bracket * explode, 0]}>
        <Bracket />
        <LoadArrow />
      </group>
      {MOUNT_HOLES.map((hole) => (
        <group key={`${hole.x}:${hole.z}`}>
          <Solid
            partId="washer"
            geometry={geometries.washer}
            position={[hole.x, WASHER_Y + EXPLODE_MM.washer * explode, hole.z]}
            color="#8d949d"
            metalness={0.46}
            roughness={0.4}
          />
          <Solid
            partId="bolt"
            geometry={geometries.bolt}
            position={[hole.x, EXPLODE_MM.bolt * explode, hole.z]}
            color="#2a2e33"
            metalness={0.62}
            roughness={0.34}
          />
        </group>
      ))}
    </group>
  );
}
