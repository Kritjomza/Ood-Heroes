import React from 'react';
export class ErrorBoundary extends React.Component<React.PropsWithChildren, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch(error: Error) {
    if (import.meta.env.DEV) console.error('Odd Tower UI failed', error);
  }
  render() {
    return this.state.failed ? (
      <main className="fatal">
        <h1>Odd Tower could not start</h1>
        <p>Please reload the page.</p>
      </main>
    ) : (
      this.props.children
    );
  }
}
