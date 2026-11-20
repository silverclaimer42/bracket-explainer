import { computeStats, indexTriangleSoup } from "./mesh.js";
import { readStl } from "./stl.js";
import type { Bom, Geometry, GeometryPart } from "./types.js";

export type * from "./types.js";
export { readStl } from "./stl.js";
export { computeStats, indexTriangleSoup } from "./mesh.js";

export interface ParseResult {
  geometry: Geometry;
  bom: Bom;
}

/** Parse a CAD file into instances of schemas/geometry.schema.json and schemas/bom.schema.json. */
export function parse(fileBuffer: ArrayBuffer | Uint8Array, filename: string): ParseResult {
  const buf = fileBuffer instanceof Uint8Array ? fileBuffer : new Uint8Array(fileBuffer);
  const ext = filename.toLowerCase().split(".").pop();
  if (ext === "stl") return parseStl(buf, filename);
  if (ext === "step" || ext === "stp") throw new Error("STEP input is not supported yet (see issue #3)");
  throw new Error(`Unsupported file extension: ${filename}`);
}

function parseStl(buf: Uint8Array, filename: string): ParseResult {
  const mesh = indexTriangleSoup(readStl(buf));
  const stats = computeStats(mesh);
  const name = baseName(filename);
  const part: GeometryPart = {
    id: slug(name) || "part-1",
    name,
    vertices: mesh.vertices,
    triangles: mesh.triangles,
    bbox: stats.bbox,
    surfaceArea: stats.surfaceArea,
    // abs() tolerates inward-facing winding; volume is only meaningful for closed meshes.
    volume: stats.watertight ? Math.abs(stats.signedVolume) : null,
    watertight: stats.watertight,
  };
  return {
    geometry: { units: "mm", sourceFormat: "stl", parts: [part] },
    bom: {
      items: [
        { partId: part.id, name, quantity: 1, material: null, volume_mm3: part.volume, bbox_mm: part.bbox },
      ],
    },
  };
}

function baseName(filename: string): string {
  return filename.split(/[\\/]/).pop()!.replace(/\.[^.]+$/, "");
}

function slug(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}
