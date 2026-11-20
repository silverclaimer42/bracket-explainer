// Generates fixtures/l-bracket.stl (ASCII): an L-shaped profile in the XZ plane extruded 50 mm along +Y.
//   base plate:    100 (x) x 50 (y) x 5 (z)
//   upright plate:   5 (x) x 50 (y) x 50 (z), sitting on top of the base at x = 0..5
// Hand calc: 100*50*5 + 5*50*50 = 25000 + 12500 = 37500 mm^3
import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const DEPTH = 50;
// CCW in (x, z); the reflex corner (5, 5) is index 3 so a fan from it triangulates the L.
const profile = [
  [0, 0], [100, 0], [100, 5], [5, 5], [5, 55], [0, 55],
];

const p = ([x, z], y) => [x, y, z];
const tris = [];
// Caps: fan from the reflex vertex. y=0 cap faces -y (profile order), y=DEPTH cap faces +y (reversed).
const r = 3;
for (let i = 1; i < profile.length - 1; i++) {
  const a = profile[r], b = profile[(r + i) % profile.length], c = profile[(r + i + 1) % profile.length];
  tris.push([p(a, 0), p(b, 0), p(c, 0)]);
  tris.push([p(a, DEPTH), p(c, DEPTH), p(b, DEPTH)]);
}
// Side walls: one quad per profile edge, wound so normals face outward.
for (let i = 0; i < profile.length; i++) {
  const a = profile[i], b = profile[(i + 1) % profile.length];
  tris.push([p(a, 0), p(a, DEPTH), p(b, DEPTH)]);
  tris.push([p(a, 0), p(b, DEPTH), p(b, 0)]);
}

const fmt = (v) => v.map((n) => n.toFixed(6)).join(" ");
let out = "solid l_bracket\n";
for (const t of tris) {
  out += "  facet normal 0 0 0\n    outer loop\n";
  for (const v of t) out += `      vertex ${fmt(v)}\n`;
  out += "    endloop\n  endfacet\n";
}
out += "endsolid l_bracket\n";

writeFileSync(fileURLToPath(new URL("./l-bracket.stl", import.meta.url)), out);
console.log(`wrote l-bracket.stl (${tris.length} triangles)`);
