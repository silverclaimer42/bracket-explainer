import { useDemo } from '../state/DemoProvider';

export function Header() {
  const { openBrief, briefOpen } = useDemo();

  return (
    <header className="topbar">
      <div className="brand">
        <span className="mark" aria-hidden="true" />
        <div>
          <p className="eyebrow">Design-to-simulation explainer</p>
          <h1>L-bracket assembly</h1>
        </div>
      </div>
      <button type="button" className="button button-primary" onClick={openBrief} disabled={briefOpen}>
        Customer one-pager
      </button>
    </header>
  );
}
