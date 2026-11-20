import { useEffect } from 'react';
import { bom, formatMass, lineMassKg, totalMassKg } from '../data/bom';
import { useDemo } from '../state/DemoProvider';

export function OnePager() {
  const { briefOpen, closeBrief, snapshot, steps } = useDemo();

  useEffect(() => {
    if (!briefOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeBrief();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [briefOpen, closeBrief]);

  if (!briefOpen) return null;

  return (
    <div className="brief-backdrop">
      <div className="brief-actions">
        <button type="button" className="button" onClick={closeBrief}>
          Back to model
        </button>
        <button type="button" className="button button-primary" onClick={() => window.print()}>
          Print / Save as PDF
        </button>
      </div>
      <article className="sheet">
        <header className="sheet-header">
          <div>
            <p className="sheet-kicker">Customer one-pager</p>
            <h2>L-bracket assembly</h2>
          </div>
          <p className="sheet-rev">Revision A · demonstration data</p>
        </header>
        <p className="sheet-lead">
          Illustrative brief for a design-review conversation: intent, geometry, the bill of materials,
          and a picture of how the upright responds to a lateral service load.
        </p>
        <figure className="sheet-figure">
          {snapshot ? (
            <img src={snapshot} alt="Snapshot of the L-bracket assembly in the interactive view" />
          ) : (
            <div className="sheet-missing">No 3D snapshot — WebGL was not available when this page opened.</div>
          )}
          <figcaption>View captured from the interactive model when this page was opened.</figcaption>
        </figure>
        <ol className="sheet-steps">
          {steps.map((step) => (
            <li key={step.id}>
              <span>{step.indexLabel}</span>
              <div>
                <h3>{step.title}</h3>
                <p>{step.body}</p>
              </div>
            </li>
          ))}
        </ol>
        <h3 className="sheet-table-title">Bill of materials</h3>
        <table className="sheet-table">
          <thead>
            <tr>
              <th scope="col">Part no.</th>
              <th scope="col">Name</th>
              <th scope="col">Material</th>
              <th scope="col">Qty</th>
              <th scope="col">Unit mass</th>
              <th scope="col">Line mass</th>
            </tr>
          </thead>
          <tbody>
            {bom.map((item) => (
              <tr key={item.id}>
                <td className="mono">{item.partNo}</td>
                <td>{item.name}</td>
                <td>{item.material}</td>
                <td className="num">{item.qty}</td>
                <td className="num">{formatMass(item.unitMassKg)}</td>
                <td className="num">{formatMass(lineMassKg(item))}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan={5}>Nominal total</td>
              <td className="num">{formatMass(totalMassKg())}</td>
            </tr>
          </tfoot>
        </table>
        <footer className="sheet-footer">
          <p>Illustrative deflection and colour only. This is not a finite-element solve, and it is not a released structural result.</p>
        </footer>
      </article>
    </div>
  );
}
