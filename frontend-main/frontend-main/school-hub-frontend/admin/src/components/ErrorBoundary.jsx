import { Component } from 'react'

// Catches render errors inside one page so the sidebar and header keep working.
// App.jsx keys it by page, so navigating to another page clears the error.
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { error: null }
  }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidCatch(error, info) {
    console.error('Page crashed:', error, info?.componentStack)
  }

  render() {
    if (!this.state.error) return this.props.children
    return (
      <div className="card" role="alert" style={{ padding: 32, textAlign: 'center' }}>
        <div style={{ fontSize: 32, marginBottom: 12 }}>⚠</div>
        <div style={{ fontWeight: 700, marginBottom: 8 }}>Something went wrong on this page</div>
        <div style={{ color: 'var(--ink-muted)', fontSize: 13, marginBottom: 16 }}>
          The rest of the app still works. Try again, or open another section from the menu.
        </div>
        <button className="btn-secondary" onClick={() => this.setState({ error: null })}>↻ Try again</button>
      </div>
    )
  }
}
