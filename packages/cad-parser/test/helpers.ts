import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { Ajv2020 } from "ajv/dist/2020.js";

type Tri = [number[], number[], number[]];

/** Axis-aligned cube [0, s]^3 with outward (CCW) winding, 12 triangles. */
export function cubeTriangles(s = 10): Tri[] {
  const v = (x: number, y: number, z: number) => [x * s, y * s, z * s];
  const quads: number[][][] = [
    [v(0, 0, 0), v(0, 1, 0), v(1, 1, 0), v(1, 0, 0)], // -z
    [v(0, 0, 1), v(1, 0, 1), v(1, 1, 1), v(0, 1, 1)], // +z
    [v(0, 0, 0), v(1, 0, 0), v(1, 0, 1), v(0, 0, 1)], // -y
    [v(0, 1, 0), v(0, 1, 1), v(1, 1, 1), v(1, 1, 0)], // +y
    [v(0, 0, 0), v(0, 0, 1), v(0, 1, 1), v(0, 1, 0)], // -x
    [v(1, 0, 0), v(1, 1, 0), v(1, 1, 1), v(1, 0, 1)], // +x
  ];
  return quads.flatMap(([a, b, c, d]) => [[a, b, c], [a, c, d]] as Tri[]);
}

export function toAsciiStl(tris: Tri[], name = "cube"): Uint8Array {
  let s = `solid ${name}\n`;
  for (const t of tris) {
    s += "facet normal 0 0 0\n outer loop\n";
    for (const p of t) s += `  vertex ${p.join(" ")}\n`;
    s += " endloop\nendfacet\n";
  }
  s += `endsolid ${name}\n`;
  return new TextEncoder().encode(s);
}

export function toBinaryStl(tris: Tri[]): Uint8Array {
  const buf = new ArrayBuffer(84 + tris.length * 50);
  const dv = new DataView(buf);
  // Header deliberately starts with "solid" to exercise binary detection.
  new Uint8Array(buf).set(new TextEncoder().encode("solid binary header"), 0);
  dv.setUint32(80, tris.length, true);
  tris.forEach((t, i) => {
    const base = 84 + i * 50 + 12;
    t.flat().forEach((n, k) => dv.setFloat32(base + k * 4, n, true));
  });
  return new Uint8Array(buf);
}

const schemaDir = new URL("../../../schemas/", import.meta.url);
const loadSchema = (f: string) => JSON.parse(readFileSync(fileURLToPath(new URL(f, schemaDir)), "utf8"));

const ajv = new Ajv2020({ allErrors: true, strict: true });
export const validateGeometry = ajv.compile(loadSchema("geometry.schema.json"));
export const validateBom = ajv.compile(loadSchema("bom.schema.json"));

export function fixture(name: string): Uint8Array {
  return new Uint8Array(readFileSync(fileURLToPath(new URL(`../fixtures/${name}`, import.meta.url))));
}
