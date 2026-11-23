import { Component } from 'react'
import styles from './ErrorBoundary.module.css'

// Catches render errors so a bug (e.g. a missing field in stations.json) shows
// a way out instead of a blank screen. The fallback depends on nothing that
// could itself be broken: no router, no language context, both languages.
// Pass `resetKey` (e.g. the pathname) so navigating elsewhere clears the error,
// and `fallback` to render something else (e.g. null) instead of the default.
export default class ErrorBoundary extends Component {
  state = { error: null, resetKey: this.props.resetKey }

  static getDerivedStateFromError(error) {
    return { error }
  }

  static getDerivedStateFromProps(props, state) {
    if (props.resetKey !== state.resetKey) return { error: null, resetKey: props.resetKey }
    return null
  }

  componentDidCatch(error, info) {
    console.error('[ErrorBoundary]', error, info?.componentStack)
  }

  render() {
    if (!this.state.error) return this.props.children
    return 'fallback' in this.props ? this.props.fallback : <ErrorFallback />
  }
}

export function ErrorFallback() {
  return (
    <div className={styles.wrap} role="alert">
      <p className={styles.icon} aria-hidden="true">🌿</p>
      <h1 className={styles.title}>Algo salió mal</h1>
      <p className={styles.titleEn} lang="en">Something went wrong</p>
      <div className={styles.actions}>
        {/* Full page load to "/": works offline (the SW serves index.html) and starts from a clean state */}
        <a className={styles.primaryBtn} href="/">Volver al recorrido · Back to tour</a>
        <button className={styles.secondaryBtn} onClick={() => window.location.reload()}>
          Recargar · Reload
        </button>
      </div>
    </div>
  )
}
