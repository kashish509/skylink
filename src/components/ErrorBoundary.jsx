import React from 'react';
import { Plane, RefreshCw } from 'lucide-react';

// Catches render errors so a bug in one screen shows a friendly page instead of a blank white one.
export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { failed: false };
  }

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error, info) {
    // Hook point for a real error-reporting service (Sentry, etc.).
    console.error('SkyLink UI error:', error, info?.componentStack);
  }

  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <div className="status-page" role="alert">
        <div className="glass status-page__card">
          <Plane size={30} className="icon-ice" />
          <h1 className="status-page__title">Something went off course</h1>
          <p className="status-page__text">An unexpected error occurred. Your bookings are safe. Reload the page to get back on track.</p>
          <div className="status-page__actions">
            <button type="button" className="btn-primary" onClick={() => window.location.reload()}><RefreshCw size={14} /> Reload page</button>
            <a className="btn-outline" href="#" onClick={() => this.setState({ failed: false })}>Back to home</a>
          </div>
        </div>
      </div>
    );
  }
}
