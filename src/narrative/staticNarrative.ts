import { storySteps } from '../data/story';
import type { NarrativeSource } from './NarrativeSource';

/** The v1 narrative. Synchronous, local, and safe to call more than once. */
export const staticNarrative: NarrativeSource = {
  id: 'static-brief',
  label: 'Pre-written brief',
  load() {
    return storySteps;
  },
};
