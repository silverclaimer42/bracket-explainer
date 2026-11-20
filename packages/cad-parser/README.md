# @bracket-explainer/cad-parser

Stage 1 of the v2 pipeline (issue #3). Turns a CAD file into two JSON documents:

- `geometry` — validates against [`schemas/geometry.schema.json`](../../schemas/geometry.schema.json) (consumed by the meshing bot, #4)
- `bom` — validates against [`schemas/bom.schema.json`](../../schemas/bom.schema.json) (consumed by the frontend, #6)

```ts
import { parse } from "./src/index.js";
const { geometry, bom } = parse(fileBytes, "l-bracket.stl");
```

Supported: STL (ASCII and binary), pure TypeScript. One STL file = one part, BOM quantity 1.
Vertices are merged within 1e-6 mm; `volume` is `null` unless every edge is shared by exactly two triangles.

Not yet: STEP (`.step`/`.stp` throws). Planned via opencascade.js in a separate `step.ts`.

```sh
npm install && npm test        # typecheck + Vitest
npm run fixtures               # regenerate fixtures/l-bracket.stl (hand-calc volume 37 500 mm³)
```
