import raw from './bom.json';
import type { BomItem, PartId } from '../types';

const PART_IDS: readonly PartId[] = ['base-plate', 'l-bracket', 'washer', 'bolt'];

function isPartId(value: string): value is PartId {
  return (PART_IDS as readonly string[]).includes(value);
}

export const bom: BomItem[] = raw.map((item) => {
  if (!isPartId(item.id)) {
    throw new Error(`Unknown BOM id: ${item.id}`);
  }
  return {
    id: item.id,
    partNo: item.partNo,
    name: item.name,
    material: item.material,
    qty: item.qty,
    unitMassKg: item.unitMassKg,
  };
});

export function lineMassKg(item: BomItem): number {
  return item.qty * item.unitMassKg;
}

export function totalMassKg(items: BomItem[] = bom): number {
  return items.reduce((sum, item) => sum + lineMassKg(item), 0);
}

export function formatMass(kg: number): string {
  if (kg < 0.05) return `${Math.round(kg * 1000)} g`;
  return `${kg.toFixed(2)} kg`;
}
