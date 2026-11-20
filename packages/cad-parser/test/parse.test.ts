import { describe, expect, it } from "vitest";
import { computeStats, indexTriangleSoup, parse, readStl } from "../src/index.js";
import { cubeTriangles, fixture, toAsciiStl, toBinaryStl, validateBom, validateGeometry } from "./helpers.js";

function expectValid(result: ReturnType<typeof parse>) {
  expect(validateGeometry(result.geometry), JSON.stringify(validateGeometry.errors)).toBe(true);
  expect(validateBom(result.bom), JSON.stringify(validateBom.errors)).toBe(true);
}

describe("STL cube", () => {
  const ascii = parse(toAsciiStl(cubeTriangles(10)), "cube.stl");
  const binary = parse(toBinaryStl(cubeTriangles(10)), "cube.stl");

  it("ASCII: volume 1000, area 600, watertight, 8 merged vertices", () => {
    const part = ascii.geometry.parts[0];
    expect(part.volume).toBeCloseTo(1000, 6);
    expect(Math.abs(part.volume! - 1000)).toBeLessThanOrEqual(1e-6);
    expect(part.surfaceArea).toBeCloseTo(600, 6);
    expect(part.watertight).toBe(true);
    expect(part.vertices.length / 3).toBe(8);
    expect(part.triangles.length / 3).toBe(12);
    expect(part.bbox).toEqual({ min: [0, 0, 0], max: [10, 10, 10] });
  });

  it("binary gives the same result as ASCII", () => {
    expect(binary).toEqual(ascii);
  });

  it("BOM has one item, quantity 1, matching the part", () => {
    expect(ascii.bom.items).toEqual([
      { partId: "cube", name: "cube", quantity: 1, material: null, volume_mm3: ascii.geometry.parts[0].volume, bbox_mm: ascii.geometry.parts[0].bbox },
    ]);
  });

  it("outputs validate against the schemas", () => {
    expectValid(ascii);
    expectValid(binary);
  });

  it("cube with one triangle missing is not watertight and has null volume", () => {
    const open = parse(toAsciiStl(cubeTriangles(10).slice(1)), "open-cube.stl");
    const part = open.geometry.parts[0];
    expect(part.watertight).toBe(false);
    expect(part.volume).toBeNull();
    expect(open.bom.items[0].volume_mm3).toBeNull();
    expectValid(open);
  });

  it("merges vertices within 1e-6 tolerance", () => {
    const tris = cubeTriangles(10);
    tris[0][0] = tris[0][0].map((n) => n + 4e-7);
    const part = parse(toAsciiStl(tris), "cube.stl").geometry.parts[0];
    expect(part.vertices.length / 3).toBe(8);
    expect(part.watertight).toBe(true);
  });

  it("rejects unsupported formats", () => {
    expect(() => parse(new Uint8Array(), "part.step")).toThrow(/STEP/);
    expect(() => parse(new Uint8Array(), "part.obj")).toThrow(/Unsupported/);
  });
});

describe("L-bracket fixture", () => {
  const HAND_CALC = 100 * 50 * 5 + 5 * 50 * 50; // 37500 mm^3
  const result = parse(fixture("l-bracket.stl"), "l-bracket.stl");
  const part = result.geometry.parts[0];

  it("is watertight with volume within 0.1% of the hand calc", () => {
    expect(part.watertight).toBe(true);
    expect(Math.abs(part.volume! - HAND_CALC) / HAND_CALC).toBeLessThan(1e-3);
    expect(part.bbox).toEqual({ min: [0, 0, 0], max: [100, 50, 55] });
  });

  it("has outward winding (positive signed volume)", () => {
    expect(computeStats(indexTriangleSoup(readStl(fixture("l-bracket.stl")))).signedVolume).toBeGreaterThan(0);
  });

  it("outputs validate against the schemas", () => {
    expectValid(result);
  });
});
