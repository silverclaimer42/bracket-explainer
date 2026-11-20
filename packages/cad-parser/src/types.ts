export type Vec3 = [number, number, number];

export interface BBox {
  min: Vec3;
  max: Vec3;
}

/** Instance of schemas/geometry.schema.json */
export interface Geometry {
  units: "mm";
  sourceFormat: "stl" | "step";
  parts: GeometryPart[];
}

export interface GeometryPart {
  id: string;
  name: string;
  vertices: number[];
  triangles: number[];
  bbox: BBox;
  surfaceArea: number;
  volume: number | null;
  watertight: boolean;
}

/** Instance of schemas/bom.schema.json */
export interface Bom {
  items: BomItem[];
}

export interface BomItem {
  partId: string;
  name: string;
  quantity: number;
  material?: string | null;
  volume_mm3: number | null;
  bbox_mm: BBox;
}
