import React from 'react';

/**
 * Top-level error boundary. Without this, a render error anywhere
 * white-screens the whole app. Catches render errors and shows a fallback
 * with a reload action.
 */
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    // Surface for monitoring; silenced in production by suppressConsole.
    // eslint-disable-next-line no-console
    console.error('[ErrorBoundary] Caught render error:', error, info);
  }

  handleReload = () => {
    window.location.assign('/');
  };

  render() {
    if (this.state.hasError) {
      return (
        <div
          role="alert"
          style={{
            minHeight: '60vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '1rem',
            textAlign: 'center',
            padding: '2rem',
          }}
        >
          <h2>Something went wrong.</h2>
          <p>Please try again. If the problem persists, contact support.</p>
          <button className="btn btn-white" onClick={this.handleReload}>
            Go to Home
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
