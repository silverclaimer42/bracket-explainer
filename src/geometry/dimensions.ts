/** Modelled in millimetres. The scene scales the assembly by 0.01. */

export const WORLD_SCALE = 0.01;

export const PLATE = {
  width: 180,
  depth: 132,
  thickness: 10,
  corner: 6,
  centerZ: 30,
};

export const BRACKET = {
  width: 76,
  wall: 8,
  fillet: 10,
  footEndZ: 72,
  baseY: 10.2,
  topY: 88,
};

export const FLANGE_TOP = BRACKET.baseY + BRACKET.wall;
export const WASHER_GAP = 0.2;
export const WASHER = {
  outer: 8,
  inner: 4.2,
  thick: 1.6,
};
export const WASHER_Y = FLANGE_TOP + WASHER_GAP;
export const HEAD_HEIGHT = 5.3;
export const HEAD_ACROSS_FLATS = 13;
export const SHANK_RADIUS = 4;
export const MOUNT_HOLE_RADIUS = 4.5;
export const FACE_HOLE_RADIUS = 3.25;

/** Clearance holes shared by the foot and the plate. */
export const MOUNT_HOLES = [
  { x: -18, z: 24 },
  { x: 18, z: 24 },
  { x: -18, z: 50 },
  { x: 18, z: 50 },
] as const;

/** Clearance pattern on the upright, for the mounted unit. */
export const FACE_HOLES = [
  { x: -16, y: 46 },
  { x: 16, y: 46 },
  { x: -16, y: 68 },
  { x: 16, y: 68 },
] as const;

/** Travel along +Y at explode = 1, in millimetres. The plate stays put. */
export const EXPLODE_MM = {
  plate: 0,
  bracket: 46,
  washer: 104,
  bolt: 162,
} as const;

export const TIP_DEFLECTION_MM = 32;

export function clamp01(value: number): number {
  if (value < 0) return 0;
  if (value > 1) return 1;
  return value;
}

/** Exaggerated cantilever bend of the upright, in millimetres toward -Z. */
export function deflectionAt(y: number, load: number): { dz: number; drop: number; theta: number } {
  const span = BRACKET.topY - FLANGE_TOP;
  const h = clamp01((y - FLANGE_TOP) / span);
  const amount = clamp01(load);
  const dz = amount * h * h * TIP_DEFLECTION_MM;
  const drop = amount * h * h * h * 5;
  const slope = (amount * 2 * h * TIP_DEFLECTION_MM) / span;
  const theta = -Math.atan(slope);
  return { dz, drop, theta };
}
