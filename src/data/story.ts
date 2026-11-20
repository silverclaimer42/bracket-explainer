import type { StoryStep } from '../types';

/**
 * Pre-written customer narrative. Camera, explode, and load cues live with
 * the text so a later generated source can return the same shape.
 */
export const storySteps: StoryStep[] = [
  {
    id: 'intent',
    indexLabel: '01',
    title: 'Design intent',
    body: 'This bracket adapts a small unit to a machine frame without welding the frame. The aluminium upright is the mounting face. The foot clamps to a thicker steel plate, and that plate is the replaceable interface. Four bolts put the clamp load into the steel. The shape is what a design review would walk before anyone opens a structural study.',
    camera: {
      position: [1.22, 0.78, 1.36],
      target: [0, 0.32, 0.22],
    },
    explode: 0,
    playLoad: false,
  },
  {
    id: 'geometry',
    indexLabel: '02',
    title: 'Geometry',
    body: 'The section is a constant 8 mm wall with a 10 mm fillet on the re-entrant corner, which is where a bending load concentrates. The foot has four Ø9 mm clearance holes. The upright has a four-hole clearance pattern for the mounted unit. The plate is 10 mm steel, larger than the foot, with the same bolt pattern and a small radius on the corners.',
    camera: {
      position: [1.35, 0.62, 0.9],
      target: [0, 0.38, 0.2],
    },
    explode: 0.38,
    playLoad: false,
  },
  {
    id: 'bom',
    indexLabel: '03',
    title: 'BOM',
    body: 'Four line items. The plate and the bracket are designed parts. The bolt and the washer are catalogue fasteners, four of each. Masses are nominal catalogue values for a costing conversation, not a weighed prototype. Select a row to find the solid, or select a solid to find its line. A PLM release would hand this same list to sourcing and to the shop.',
    camera: {
      position: [3.15, 2.05, 3.25],
      target: [0, 0.92, 0.28],
    },
    explode: 1,
    playLoad: false,
  },
  {
    id: 'behaviour',
    indexLabel: '04',
    title: 'Behaviour',
    body: 'The arrow is a lateral service load on the upright. The upright leans with it — exaggerated, so the sense of the motion is obvious — and the colour runs from low (blue) to high (red), with the peak held on the fillet. That is where a bending-dominated response would be discussed. It is drawn on the CAD shape. It is not a mesh, not a contact solve, and not a pass or fail.',
    camera: {
      position: [2.25, 0.92, 0.72],
      target: [0, 0.5, 0.05],
    },
    explode: 0,
    playLoad: true,
  },
];
