import { formatMass } from '../data/bom';
import { useDemo } from '../state/DemoProvider';

export function ViewportChrome() {
  const { explode, setExplode, load, loadEnabled, setLoadEnabled, replayLoad, activeId, items } = useDemo();
  const active = items.find((item) => item.id === activeId) ?? null;
  const percent = `${Math.round(explode * 100)}%`;

  return (
    <div className="chrome">
      <div className="caption">
        <strong>{active ? active.name : 'L-bracket assembly'}</strong>
        <span>{active ? active.partNo : 'Millimetres · studio view'}</span>
      </div>

      {load > 0.04 ? (
        <div className="legend">
          <span>Low</span>
          <i />
          <span>High</span>
        </div>
      ) : null}

      <div className="chrome-card">
        <label className="slider">
          <span>
            Exploded view <strong>{percent}</strong>
          </span>
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={explode}
            aria-valuetext={percent}
            style={{ ['--fill' as string]: percent }}
            onChange={(event) => setExplode(Number(event.target.value))}
          />
        </label>
        <div className="load-actions">
          <button
            type="button"
            className={loadEnabled ? 'button button-toggle is-on' : 'button button-toggle'}
            aria-pressed={loadEnabled}
            onClick={() => setLoadEnabled(!loadEnabled)}
          >
            Illustrative load
          </button>
          <button type="button" className="button" onClick={replayLoad} disabled={!loadEnabled}>
            Replay
          </button>
        </div>
        <p className={load > 0.04 ? 'disclaimer is-live' : 'disclaimer'}>
          Illustrative deflection and colour only. This is not a finite-element solve.
        </p>
      </div>
      <p className="sr-only">{active ? `${active.name}, ${formatMass(active.unitMassKg)} each` : ''}</p>
    </div>
  );
}
