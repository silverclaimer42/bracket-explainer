import { Component, type ReactNode } from 'react';
import { WebGLFallback } from './WebGLFallback';

interface Props {
  children: ReactNode;
}

interface State {
  failed: boolean;
}

export class SceneBoundary extends Component<Props, State> {
  state: State = { failed: false };

  static getDerivedStateFromError(): State {
    return { failed: true };
  }

  render() {
    if (this.state.failed) return <WebGLFallback />;
    return this.props.children;
  }
}
