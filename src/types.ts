export type PartId = 'base-plate' | 'l-bracket' | 'washer' | 'bolt';

export interface BomItem {
  id: PartId;
  partNo: string;
  name: string;
  material: string;
  qty: number;
  unitMassKg: number;
}

export interface CameraPose {
  position: [number, number, number];
  target: [number, number, number];
}

export interface StoryStep {
  id: 'intent' | 'geometry' | 'bom' | 'behaviour';
  indexLabel: string;
  title: string;
  body: string;
  camera: CameraPose;
  /** 0 assembled, 1 fully exploded. */
  explode: number;
  /** Play the illustrative load when this step is shown. */
  playLoad: boolean;
}
