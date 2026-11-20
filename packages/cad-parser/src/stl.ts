/**
 * Pure-TypeScript STL reader (ASCII + binary). Returns a triangle soup:
 * flat xyz coordinates, 9 numbers per triangle. Facet normals are ignored.
 */
export function readStl(buf: Uint8Array): Float64Array {
  return isBinaryStl(buf) ? readBinary(buf) : readAscii(buf);
}

export function isBinaryStl(buf: Uint8Array): boolean {
  if (buf.length >= 84) {
    const count = new DataView(buf.buffer, buf.byteOffset, buf.byteLength).getUint32(80, true);
    if (84 + count * 50 === buf.length) return true;
  }
  const head = new TextDecoder().decode(buf.subarray(0, Math.min(buf.length, 512))).trimStart();
  return !(head.startsWith("solid") && /facet|endsolid/.test(head + decodeTail(buf)));
}

function decodeTail(buf: Uint8Array): string {
  return new TextDecoder().decode(buf.subarray(Math.max(0, buf.length - 256)));
}

function readBinary(buf: Uint8Array): Float64Array {
  if (buf.length < 84) throw new Error("Binary STL too short");
  const dv = new DataView(buf.buffer, buf.byteOffset, buf.byteLength);
  const count = dv.getUint32(80, true);
  if (84 + count * 50 > buf.length) throw new Error(`Binary STL truncated: header says ${count} triangles`);
  const out = new Float64Array(count * 9);
  for (let t = 0; t < count; t++) {
    const base = 84 + t * 50 + 12; // skip normal
    for (let k = 0; k < 9; k++) out[t * 9 + k] = dv.getFloat32(base + k * 4, true);
  }
  return out;
}

function readAscii(buf: Uint8Array): Float64Array {
  const text = new TextDecoder().decode(buf);
  const coords: number[] = [];
  const re = /vertex\s+(\S+)\s+(\S+)\s+(\S+)/gi;
  for (let m = re.exec(text); m; m = re.exec(text)) {
    const xyz = [Number(m[1]), Number(m[2]), Number(m[3])];
    if (xyz.some((n) => !Number.isFinite(n))) throw new Error(`Bad ASCII STL vertex: ${m[0]}`);
    coords.push(...xyz);
  }
  if (coords.length % 9 !== 0) throw new Error("ASCII STL vertex count is not a multiple of 3");
  return Float64Array.from(coords);
}
