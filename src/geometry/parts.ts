import {
  BufferAttribute,
  BufferGeometry,
  CylinderGeometry,
  ExtrudeGeometry,
  Path,
  Shape,
} from 'three';
import { toCreasedNormals } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { ADDITION, Brush, Evaluator, SUBTRACTION } from 'three-bvh-csg';
import {
  BRACKET,
  deflectionAt,
  FACE_HOLE_RADIUS,
  FACE_HOLES,
  FLANGE_TOP,
  HEAD_ACROSS_FLATS,
  HEAD_HEIGHT,
  MOUNT_HOLE_RADIUS,
  MOUNT_HOLES,
  PLATE,
  SHANK_RADIUS,
  WASHER,
  WASHER_Y,
  clamp01,
} from './dimensions';

const ALUMINIUM: readonly [number, number, number] = [0.86, 0.88, 0.9];

const STRESS_STOPS: readonly (readonly [number, number, number])[] = [
  [0.114, 0.306, 0.847],
  [0.024, 0.714, 0.831],
  [0.133, 0.773, 0.369],
  [0.918, 0.702, 0.031],
  [0.863, 0.149, 0.149],
];

export interface AssemblyGeometries {
  plate: BufferGeometry;
  bracket: BufferGeometry;
  washer: BufferGeometry;
  bolt: BufferGeometry;
}

export interface BracketBuffers {
  geometry: BufferGeometry;
  basePosition: Float32Array;
  baseNormal: Float32Array;
  stress: Float32Array;
}

function roundedRect(width: number, height: number, radius: number): Shape {
  const x = -width / 2;
  const y = -height / 2;
  const shape = new Shape();
  shape.moveTo(x + radius, y);
  shape.lineTo(x + width - radius, y);
  shape.absarc(x + width - radius, y + radius, radius, -Math.PI / 2, 0, false);
  shape.lineTo(x + width, y + height - radius);
  shape.absarc(x + width - radius, y + height - radius, radius, 0, Math.PI / 2, false);
  shape.lineTo(x + radius, y + height);
  shape.absarc(x + radius, y + height - radius, radius, Math.PI / 2, Math.PI, false);
  shape.lineTo(x, y + radius);
  shape.absarc(x + radius, y + radius, radius, Math.PI, Math.PI * 1.5, false);
  return shape;
}

function bracketProfile(): Shape {
  const wall = BRACKET.wall;
  const fillet = BRACKET.fillet;
  const shape = new Shape();
  shape.moveTo(-wall, BRACKET.baseY);
  shape.lineTo(BRACKET.footEndZ, BRACKET.baseY);
  shape.lineTo(BRACKET.footEndZ, FLANGE_TOP);
  shape.lineTo(fillet, FLANGE_TOP);
  shape.absarc(fillet, FLANGE_TOP + fillet, fillet, -Math.PI / 2, Math.PI, true);
  shape.lineTo(0, BRACKET.topY);
  shape.lineTo(-wall, BRACKET.topY);
  shape.lineTo(-wall, BRACKET.baseY);
  return shape;
}

function extrude(shape: Shape, depth: number, curveSegments: number): BufferGeometry {
  return new ExtrudeGeometry(shape, {
    depth,
    bevelEnabled: false,
    curveSegments,
    steps: 1,
  });
}

function subtract(base: BufferGeometry, cutters: BufferGeometry[]): BufferGeometry {
  const evaluator = new Evaluator();
  evaluator.useGroups = false;
  // CDT clipping is more robust on the fillet and hole intersections. The
  // published types lag the runtime flag.
  (evaluator as Evaluator & { useCDTClipping: boolean }).useCDTClipping = true;

  let current = base;
  for (const cutter of cutters) {
    const a = new Brush(current);
    const b = new Brush(cutter);
    a.updateMatrixWorld();
    b.updateMatrixWorld();
    current = evaluator.evaluate(a, b, SUBTRACTION).geometry;
  }

  current.clearGroups();
  current.computeVertexNormals();
  return toCreasedNormals(current, Math.PI / 6);
}

function plateGeometry(): BufferGeometry {
  const geometry = extrude(roundedRect(PLATE.width, PLATE.depth, PLATE.corner), PLATE.thickness, 8);
  geometry.rotateX(-Math.PI / 2);
  geometry.translate(0, 0, PLATE.centerZ);

  const cutters = MOUNT_HOLES.map((hole) => {
    const cutter = new CylinderGeometry(MOUNT_HOLE_RADIUS, MOUNT_HOLE_RADIUS, PLATE.thickness + 8, 40);
    cutter.translate(hole.x, PLATE.thickness / 2, hole.z);
    return cutter;
  });

  return subtract(geometry, cutters);
}

function bracketBlank(): BufferGeometry {
  const geometry = extrude(bracketProfile(), BRACKET.width, 14);
  geometry.rotateY(-Math.PI / 2);
  geometry.translate(BRACKET.width / 2, 0, 0);
  return geometry;
}

function bracketGeometry(): BufferGeometry {
  const mountCutters = MOUNT_HOLES.map((hole) => {
    const cutter = new CylinderGeometry(MOUNT_HOLE_RADIUS, MOUNT_HOLE_RADIUS, 24, 40);
    cutter.translate(hole.x, (BRACKET.baseY + FLANGE_TOP) / 2, hole.z);
    return cutter;
  });

  const faceCutters = FACE_HOLES.map((hole) => {
    const cutter = new CylinderGeometry(FACE_HOLE_RADIUS, FACE_HOLE_RADIUS, 24, 32);
    cutter.rotateX(Math.PI / 2);
    cutter.translate(hole.x, hole.y, -BRACKET.wall / 2);
    return cutter;
  });

  return subtract(bracketBlank(), [...mountCutters, ...faceCutters]);
}

function washerGeometry(): BufferGeometry {
  const shape = new Shape();
  shape.absarc(0, 0, WASHER.outer, 0, Math.PI * 2, false);
  const hole = new Path();
  hole.absarc(0, 0, WASHER.inner, 0, Math.PI * 2, true);
  shape.holes.push(hole);
  const geometry = extrude(shape, WASHER.thick, 40);
  geometry.rotateX(-Math.PI / 2);
  geometry.computeVertexNormals();
  return geometry;
}

function boltGeometry(): BufferGeometry {
  const headRadius = HEAD_ACROSS_FLATS / Math.sqrt(3);
  const washerTop = WASHER_Y + WASHER.thick;
  const shankLength = washerTop + 0.35 - 1.2;

  const shank = new CylinderGeometry(SHANK_RADIUS, SHANK_RADIUS, shankLength, 32);
  shank.translate(0, 1.2 + shankLength / 2, 0);

  const head = new CylinderGeometry(headRadius, headRadius, HEAD_HEIGHT, 6);
  head.rotateY(Math.PI / 6);
  head.translate(0, washerTop + HEAD_HEIGHT / 2, 0);

  const evaluator = new Evaluator();
  evaluator.useGroups = false;
  const result = evaluator.evaluate(new Brush(head), new Brush(shank), ADDITION).geometry;
  result.clearGroups();
  result.computeVertexNormals();
  return toCreasedNormals(result, Math.PI / 7);
}

function stressField(y: number, z: number): number {
  const span = BRACKET.topY - FLANGE_TOP;
  const above = clamp01((y - FLANGE_TOP) / span);
  const inner = clamp01((z + 2) / 12);
  const dy = y - (FLANGE_TOP + 5);
  const dz = z - 1.5;
  const fillet = Math.exp(-(dy * dy + dz * dz) / (2 * 9 * 9));
  const upright = (1 - above) * (0.2 + 0.8 * inner) * (y > FLANGE_TOP - 1 ? 1 : 0);
  const foot = Math.exp(-Math.max(z - BRACKET.fillet, 0) / 16) * (y < FLANGE_TOP + 2 ? 0.4 : 0);
  return fillet * 1.5 + upright * 0.9 + foot;
}

function ramp(t: number, channel: 0 | 1 | 2): number {
  const scaled = clamp01(t) * (STRESS_STOPS.length - 1);
  const index = Math.min(STRESS_STOPS.length - 2, Math.floor(scaled));
  const mix = scaled - index;
  const from = STRESS_STOPS[index][channel];
  const to = STRESS_STOPS[index + 1][channel];
  return from + (to - from) * mix;
}

export function createBracketBuffers(geometry: BufferGeometry): BracketBuffers {
  const position = geometry.getAttribute('position');
  const normal = geometry.getAttribute('normal');
  const count = position.count;
  const basePosition = new Float32Array(position.array as ArrayLike<number>);
  const baseNormal = new Float32Array(normal.array as ArrayLike<number>);
  const stress = new Float32Array(count);
  let peak = 0.0001;

  for (let index = 0; index < count; index += 1) {
    const value = stressField(basePosition[index * 3 + 1], basePosition[index * 3 + 2]);
    stress[index] = value;
    if (value > peak) peak = value;
  }

  for (let index = 0; index < count; index += 1) {
    stress[index] = clamp01(stress[index] / peak);
  }

  const colors = new Float32Array(count * 3);
  for (let index = 0; index < count; index += 1) {
    colors[index * 3] = ALUMINIUM[0];
    colors[index * 3 + 1] = ALUMINIUM[1];
    colors[index * 3 + 2] = ALUMINIUM[2];
  }
  geometry.setAttribute('color', new BufferAttribute(colors, 3));

  return { geometry, basePosition, baseNormal, stress };
}

export function applyBracketLoad(buffers: BracketBuffers, load: number): void {
  const { geometry, basePosition, baseNormal, stress } = buffers;
  const position = geometry.getAttribute('position') as BufferAttribute;
  const normal = geometry.getAttribute('normal') as BufferAttribute;
  const color = geometry.getAttribute('color') as BufferAttribute;
  const amount = clamp01(load);
  const count = position.count;

  for (let index = 0; index < count; index += 1) {
    const offset = index * 3;
    const y = basePosition[offset + 1];
    const { dz, drop, theta } = deflectionAt(y, amount);
    const cos = Math.cos(theta);
    const sin = Math.sin(theta);
    const ny = baseNormal[offset + 1];
    const nz = baseNormal[offset + 2];

    position.setXYZ(index, basePosition[offset], y - drop, basePosition[offset + 2] - dz);
    normal.setXYZ(index, baseNormal[offset], ny * cos - nz * sin, ny * sin + nz * cos);

    const t = stress[index];
    color.setXYZ(
      index,
      ALUMINIUM[0] + (ramp(t, 0) - ALUMINIUM[0]) * amount,
      ALUMINIUM[1] + (ramp(t, 1) - ALUMINIUM[1]) * amount,
      ALUMINIUM[2] + (ramp(t, 2) - ALUMINIUM[2]) * amount,
    );
  }

  position.needsUpdate = true;
  normal.needsUpdate = true;
  color.needsUpdate = true;
  geometry.computeBoundingSphere();
}

function withoutBvhNoise<T>(build: () => T): T {
  const original = console.warn;
  console.warn = (...args: unknown[]) => {
    const message = typeof args[0] === 'string' ? args[0] : '';
    if (message.includes('maxLeafSize') || message.includes('maxLeafTris')) return;
    original.apply(console, args);
  };
  try {
    return build();
  } finally {
    console.warn = original;
  }
}

function safeBuild(): AssemblyGeometries {
  // three-bvh-csg still passes the deprecated MeshBVH maxLeafSize option.
  return withoutBvhNoise(() => ({
    plate: plateGeometry(),
    bracket: bracketGeometry(),
    washer: washerGeometry(),
    bolt: boltGeometry(),
  }));
}

export const geometries: AssemblyGeometries = safeBuild();
export const bracketBuffers: BracketBuffers = createBracketBuffers(geometries.bracket);

/** Used by the load arrow so it stays on the deflected upright. */
export function uprightFaceZ(y: number, load: number): number {
  return -BRACKET.wall - deflectionAt(y, load).dz;
}
