import type { BBox } from "./types.js";

export const MERGE_TOLERANCE = 1e-6;

export interface IndexedMesh {
  vertices: number[];
  triangles: number[];
}

/**
 * Merge vertices closer than `tol` (per axis) using a hash grid with cell size `tol`,
 * checking neighbouring cells so points straddling a cell boundary still merge.
 * Triangles that collapse after merging are dropped.
 */
export function indexTriangleSoup(soup: Float64Array | number[], tol = MERGE_TOLERANCE): IndexedMesh {
  const vertices: number[] = [];
  const triangles: number[] = [];
  const grid = new Map<string, number[]>();
  const remap = new Array<number>(soup.length / 3);

  for (let i = 0; i < soup.length / 3; i++) {
    const x = soup[3 * i], y = soup[3 * i + 1], z = soup[3 * i + 2];
    const cx = Math.floor(x / tol), cy = Math.floor(y / tol), cz = Math.floor(z / tol);
    let found = -1;
    search: for (let dx = -1; dx <= 1; dx++) {
      for (let dy = -1; dy <= 1; dy++) {
        for (let dz = -1; dz <= 1; dz++) {
          const bucket = grid.get(`${cx + dx},${cy + dy},${cz + dz}`);
          if (!bucket) continue;
          for (const v of bucket) {
            if (
              Math.abs(vertices[3 * v] - x) <= tol &&
              Math.abs(vertices[3 * v + 1] - y) <= tol &&
              Math.abs(vertices[3 * v + 2] - z) <= tol
            ) {
              found = v;
              break search;
            }
          }
        }
      }
    }
    if (found < 0) {
      found = vertices.length / 3;
      vertices.push(x, y, z);
      const key = `${cx},${cy},${cz}`;
      const bucket = grid.get(key);
      if (bucket) bucket.push(found);
      else grid.set(key, [found]);
    }
    remap[i] = found;
  }

  // Drop collapsed triangles, then keep only vertices still referenced so they don't skew the bounds.
  const compact = new Map<number, number>();
  const kept: number[] = [];
  const keep = (v: number) => {
    let i = compact.get(v);
    if (i === undefined) {
      i = kept.length / 3;
      compact.set(v, i);
      kept.push(vertices[3 * v], vertices[3 * v + 1], vertices[3 * v + 2]);
    }
    return i;
  };
  for (let t = 0; t < remap.length; t += 3) {
    const a = remap[t], b = remap[t + 1], c = remap[t + 2];
    if (a !== b && b !== c && a !== c) triangles.push(keep(a), keep(b), keep(c));
  }
  return { vertices: kept, triangles };
}

export interface MeshStats {
  bbox: BBox;
  surfaceArea: number;
  signedVolume: number;
  watertight: boolean;
}

export function computeStats({ vertices, triangles }: IndexedMesh): MeshStats {
  const min: [number, number, number] = [Infinity, Infinity, Infinity];
  const max: [number, number, number] = [-Infinity, -Infinity, -Infinity];
  for (let i = 0; i < vertices.length; i += 3) {
    for (let k = 0; k < 3; k++) {
      min[k] = Math.min(min[k], vertices[i + k]);
      max[k] = Math.max(max[k], vertices[i + k]);
    }
  }
  if (vertices.length === 0) {
    min.fill(0);
    max.fill(0);
  }

  let area = 0;
  let vol6 = 0;
  const edges = new Map<string, number>();
  const addEdge = (a: number, b: number) => {
    const key = a < b ? `${a},${b}` : `${b},${a}`;
    edges.set(key, (edges.get(key) ?? 0) + 1);
  };

  for (let t = 0; t < triangles.length; t += 3) {
    const ia = 3 * triangles[t], ib = 3 * triangles[t + 1], ic = 3 * triangles[t + 2];
    const ax = vertices[ia], ay = vertices[ia + 1], az = vertices[ia + 2];
    const bx = vertices[ib], by = vertices[ib + 1], bz = vertices[ib + 2];
    const cx = vertices[ic], cy = vertices[ic + 1], cz = vertices[ic + 2];
    const ux = bx - ax, uy = by - ay, uz = bz - az;
    const vx = cx - ax, vy = cy - ay, vz = cz - az;
    const nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx;
    area += 0.5 * Math.hypot(nx, ny, nz);
    // a . (b x c)
    vol6 += ax * (by * cz - bz * cy) + ay * (bz * cx - bx * cz) + az * (bx * cy - by * cx);
    addEdge(triangles[t], triangles[t + 1]);
    addEdge(triangles[t + 1], triangles[t + 2]);
    addEdge(triangles[t + 2], triangles[t]);
  }

  let watertight = triangles.length > 0;
  for (const n of edges.values()) {
    if (n !== 2) {
      watertight = false;
      break;
    }
  }

  return { bbox: { min, max }, surfaceArea: area, signedVolume: vol6 / 6, watertight };
}
