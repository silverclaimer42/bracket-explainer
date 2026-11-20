import type { StoryStep } from '../types';

/**
 * ============================================================
 *  AI NARRATIVE HOOK
 * ============================================================
 *  The story panel does not call a model and does not use the network.
 *  It reads four steps through a NarrativeSource.
 *
 *  v1 ships `staticNarrative` (src/narrative/staticNarrative.ts), which
 *  returns the pre-written copy in src/data/story.ts.
 *
 *  To plug in an AI-generated narrative later:
 *    1. Implement NarrativeSource. `load()` may be async.
 *    2. Produce steps in the StoryStep shape, including camera, explode,
 *       and playLoad, so the view still has cues to follow.
 *    3. Pass the source to <DemoProvider source={...} />.
 *    4. Resolve any model call outside this module. Do not fetch from here.
 *
 *  The app treats a failed or empty load as a reason to keep the static
 *  brief, so a future source cannot blank the demo.
 * ============================================================
 */
export const AI_NARRATIVE_HOOK = {
  id: 'NarrativeSource',
  module: 'src/narrative/NarrativeSource.ts',
  staticModule: 'src/narrative/staticNarrative.ts',
} as const;

export interface NarrativeSource {
  /** Stable id, surfaced as a data attribute on the story panel. */
  readonly id: string;
  /** Short customer-safe label, e.g. "Pre-written brief". */
  readonly label: string;
  /**
   * Four story steps. May return a promise so a generated source can
   * resolve after its text already exists. Must not perform network I/O.
   */
  load(): StoryStep[] | Promise<StoryStep[]>;
}

export function isStoryStepList(value: unknown): value is StoryStep[] {
  if (!Array.isArray(value) || value.length !== 4) return false;
  return value.every((step) => {
    if (!step || typeof step !== 'object') return false;
    const candidate = step as Partial<StoryStep>;
    return (
      typeof candidate.title === 'string' &&
      typeof candidate.body === 'string' &&
      typeof candidate.explode === 'number' &&
      typeof candidate.playLoad === 'boolean' &&
      Array.isArray(candidate.camera?.position) &&
      Array.isArray(candidate.camera?.target)
    );
  });
}
