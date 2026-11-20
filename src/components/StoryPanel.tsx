import { AI_NARRATIVE_HOOK } from '../narrative/NarrativeSource';
import { useDemo } from '../state/DemoProvider';

export function StoryPanel() {
  const { steps, stepIndex, goToStep, narrativeId, narrativeLabel } = useDemo();
  const last = steps.length - 1;

  return (
    <section
      className="story"
      aria-label="Story"
      data-narrative-hook={AI_NARRATIVE_HOOK.id}
      data-narrative-source={narrativeId}
    >
      <div className="panel-heading">
        <h2>Walkthrough</h2>
        <p title="Implement NarrativeSource to plug in a generated narrative later. This build does not call a model.">
          {narrativeLabel}
        </p>
      </div>
      <ol className="steps">
        {steps.map((step, index) => {
          const active = index === stepIndex;
          return (
            <li key={step.id}>
              <button
                type="button"
                className={active ? 'step is-active' : 'step'}
                aria-current={active ? 'step' : undefined}
                onClick={() => goToStep(index)}
              >
                <span className="step-index">{step.indexLabel}</span>
                <span className="step-copy">
                  <strong>{step.title}</strong>
                  {active ? <span>{step.body}</span> : null}
                </span>
              </button>
            </li>
          );
        })}
      </ol>
      <div className="step-nav">
        <button type="button" className="button" onClick={() => goToStep(stepIndex - 1)} disabled={stepIndex === 0}>
          Back
        </button>
        <span>
          Step {stepIndex + 1} of {steps.length}
        </span>
        <button type="button" className="button" onClick={() => goToStep(stepIndex + 1)} disabled={stepIndex === last}>
          Next
        </button>
      </div>
    </section>
  );
}
