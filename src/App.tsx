import { useEffect } from 'react';
import { BomPanel } from './components/BomPanel';
import { Header } from './components/Header';
import { OnePager } from './components/OnePager';
import { SceneBoundary } from './components/SceneBoundary';
import { StoryPanel } from './components/StoryPanel';
import { Viewer } from './components/Viewer';
import { ViewportChrome } from './components/ViewportChrome';
import { WebGLFallback } from './components/WebGLFallback';
import { DemoProvider, useDemo } from './state/DemoProvider';
import { isWebGLAvailable } from './webgl';

function Shell({ webgl }: { webgl: boolean }) {
  const { hoveredId, briefOpen, goToStep, stepIndex, steps } = useDemo();

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (briefOpen) return;
      const target = event.target;
      if (target instanceof HTMLElement && target.closest('input, textarea, select, button')) return;
      if (event.key === 'ArrowRight') goToStep(Math.min(steps.length - 1, stepIndex + 1));
      if (event.key === 'ArrowLeft') goToStep(Math.max(0, stepIndex - 1));
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [briefOpen, goToStep, stepIndex, steps.length]);

  return (
    <div className={briefOpen ? 'app is-brief' : 'app'}>
      <Header />
      <main className="workspace">
        <section className={hoveredId ? 'viewport is-hot' : 'viewport'} aria-label="3D assembly">
          {webgl ? (
            <SceneBoundary>
              <Viewer />
            </SceneBoundary>
          ) : (
            <WebGLFallback />
          )}
          <ViewportChrome />
        </section>
        <aside className="side">
          <StoryPanel />
          <BomPanel />
        </aside>
      </main>
      <OnePager />
    </div>
  );
}

export function App() {
  const webgl = isWebGLAvailable();
  return (
    <DemoProvider>
      <Shell webgl={webgl} />
    </DemoProvider>
  );
}
