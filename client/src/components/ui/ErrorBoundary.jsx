import { Component } from 'react';
import { Button } from './Button';

export class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }
  static getDerivedStateFromError(error) {
    return { error };
  }
  componentDidCatch(error, info) {
    console.error('[boundary]', error, info?.componentStack);
  }
  render() {
    if (this.state.error) {
      return (
        <div className="grid min-h-[60vh] place-items-center px-6 text-center">
          <div>
            <h1 className="text-xl font-bold text-ink">Something went wrong</h1>
            <p className="mx-auto mt-2 max-w-md text-sm text-muted">
              This section could not be displayed. You can retry, or head back to your dashboard — your data is safe.
            </p>
            <div className="mt-5 flex justify-center gap-2">
              <Button onClick={() => window.location.reload()}>Reload page</Button>
              <Button variant="secondary" to="/">Go home</Button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
