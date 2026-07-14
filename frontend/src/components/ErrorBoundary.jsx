import { Component } from 'react';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="page-gradient flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center">
          <span className="text-5xl">🦷</span>
          <h1 className="text-2xl font-bold text-theme-heading">Something went wrong</h1>
          <p className="max-w-md text-theme-muted">An unexpected error occurred. Please refresh the page.</p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="btn-primary"
          >
            Refresh Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
