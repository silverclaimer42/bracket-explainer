import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { bom } from '../data/bom';
import { storySteps } from '../data/story';
import { isStoryStepList, type NarrativeSource } from '../narrative/NarrativeSource';
import { staticNarrative } from '../narrative/staticNarrative';
import type { BomItem, PartId, StoryStep } from '../types';

type CaptureFn = () => string;

interface DemoContextValue {
  items: BomItem[];
  steps: StoryStep[];
  narrativeId: string;
  narrativeLabel: string;
  stepIndex: number;
  cameraNonce: number;
  explode: number;
  load: number;
  loadEnabled: boolean;
  selectedId: PartId | null;
  hoveredId: PartId | null;
  activeId: PartId | null;
  briefOpen: boolean;
  snapshot: string | null;
  goToStep: (index: number) => void;
  setExplode: (value: number) => void;
  setLoadEnabled: (enabled: boolean) => void;
  replayLoad: () => void;
  select: (id: PartId | null) => void;
  setHovered: (id: PartId | null) => void;
  registerCapture: (capture: CaptureFn | null) => void;
  openBrief: () => void;
  closeBrief: () => void;
}

const DemoContext = createContext<DemoContextValue | null>(null);

function clamp01(value: number): number {
  if (value < 0) return 0;
  if (value > 1) return 1;
  return value;
}

export function DemoProvider({
  source = staticNarrative,
  children,
}: {
  source?: NarrativeSource;
  children: ReactNode;
}) {
  const [steps, setSteps] = useState<StoryStep[]>(() => {
    const value = source.load();
    if (value instanceof Promise) return storySteps;
    return isStoryStepList(value) ? value : storySteps;
  });
  const [narrativeId, setNarrativeId] = useState(source.id);
  const [narrativeLabel, setNarrativeLabel] = useState(source.label);
  const [stepIndex, setStepIndex] = useState(0);
  const [cameraNonce, setCameraNonce] = useState(0);
  const [explode, setExplodeState] = useState(0);
  const [load, setLoadState] = useState(0);
  const [loadEnabled, setLoadEnabledState] = useState(false);
  const [selectedId, setSelectedId] = useState<PartId | null>(null);
  const [hoveredId, setHoveredId] = useState<PartId | null>(null);
  const [briefOpen, setBriefOpen] = useState(false);
  const [snapshot, setSnapshot] = useState<string | null>(null);

  const explodeRef = useRef(0);
  const explodeTarget = useRef(0);
  const easingExplode = useRef(false);
  const loadRef = useRef(0);
  const loadEnabledRef = useRef(false);
  const loadStartRef = useRef<number | null>(null);
  const captureRef = useRef<CaptureFn | null>(null);

  useEffect(() => {
    let live = true;
    setNarrativeId(source.id);
    setNarrativeLabel(source.label);
    Promise.resolve(source.load()).then((next) => {
      if (!live) return;
      setSteps(isStoryStepList(next) ? next : storySteps);
    });
    return () => {
      live = false;
    };
  }, [source]);

  useEffect(() => {
    let frame = 0;
    const tick = (now: number) => {
      if (easingExplode.current) {
        const target = explodeTarget.current;
        const current = explodeRef.current;
        const next = Math.abs(target - current) < 0.004 ? target : current + (target - current) * 0.14;
        explodeRef.current = next;
        if (next === target) easingExplode.current = false;
        setExplodeState(next);
      }

      let nextLoad = loadRef.current;
      if (loadEnabledRef.current) {
        if (loadStartRef.current === null) loadStartRef.current = now;
        const t = Math.min(1, (now - loadStartRef.current) / 1700);
        nextLoad = 1 - (1 - t) ** 3;
      } else if (nextLoad > 0) {
        nextLoad = nextLoad < 0.015 ? 0 : nextLoad * 0.84;
      }

      if (Math.abs(nextLoad - loadRef.current) > 0.001 || (nextLoad === 0 && loadRef.current !== 0)) {
        loadRef.current = nextLoad;
        setLoadState(nextLoad);
      }

      frame = window.requestAnimationFrame(tick);
    };
    frame = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(frame);
  }, []);

  const goToStep = useCallback(
    (index: number) => {
      const step = steps[index];
      if (!step) return;
      setStepIndex(index);
      setCameraNonce((value) => value + 1);
      explodeTarget.current = step.explode;
      easingExplode.current = true;
      loadEnabledRef.current = step.playLoad;
      setLoadEnabledState(step.playLoad);
      if (step.playLoad) {
        loadStartRef.current = null;
        loadRef.current = 0;
        setLoadState(0);
      }
    },
    [steps],
  );

  const setExplode = useCallback((value: number) => {
    const next = clamp01(value);
    explodeRef.current = next;
    explodeTarget.current = next;
    easingExplode.current = false;
    setExplodeState(next);
  }, []);

  const setLoadEnabled = useCallback((enabled: boolean) => {
    loadEnabledRef.current = enabled;
    setLoadEnabledState(enabled);
    if (enabled) {
      loadStartRef.current = null;
      loadRef.current = 0;
      setLoadState(0);
    }
  }, []);

  const replayLoad = useCallback(() => {
    loadEnabledRef.current = true;
    setLoadEnabledState(true);
    loadStartRef.current = null;
    loadRef.current = 0;
    setLoadState(0);
  }, []);

  const select = useCallback((id: PartId | null) => {
    setSelectedId(id);
  }, []);

  const setHovered = useCallback((id: PartId | null) => {
    setHoveredId(id);
  }, []);

  const registerCapture = useCallback((capture: CaptureFn | null) => {
    captureRef.current = capture;
  }, []);

  const openBrief = useCallback(() => {
    const url = captureRef.current?.() ?? null;
    setSnapshot(url);
    setBriefOpen(true);
  }, []);

  const closeBrief = useCallback(() => {
    setBriefOpen(false);
  }, []);

  const value = useMemo<DemoContextValue>(
    () => ({
      items: bom,
      steps,
      narrativeId,
      narrativeLabel,
      stepIndex,
      cameraNonce,
      explode,
      load,
      loadEnabled,
      selectedId,
      hoveredId,
      activeId: hoveredId ?? selectedId,
      briefOpen,
      snapshot,
      goToStep,
      setExplode,
      setLoadEnabled,
      replayLoad,
      select,
      setHovered,
      registerCapture,
      openBrief,
      closeBrief,
    }),
    [
      steps,
      narrativeId,
      narrativeLabel,
      stepIndex,
      cameraNonce,
      explode,
      load,
      loadEnabled,
      selectedId,
      hoveredId,
      briefOpen,
      snapshot,
      goToStep,
      setExplode,
      setLoadEnabled,
      replayLoad,
      select,
      setHovered,
      registerCapture,
      openBrief,
      closeBrief,
    ],
  );

  return <DemoContext.Provider value={value}>{children}</DemoContext.Provider>;
}

export function useDemo(): DemoContextValue {
  const value = useContext(DemoContext);
  if (!value) throw new Error('useDemo must be used within DemoProvider');
  return value;
}
