import { useEffect, useRef, useState } from 'react'
import { useRegisterSW } from 'virtual:pwa-register/react'
import {
  getPrecacheStatus,
  onPrecacheProgress,
  watchInstallFailure,
  retryDownload,
} from '../offline/precacheStatus'
import styles from './OfflineBanner.module.css'

// checking    → asking the SW whether everything is already cached (renders nothing)
// downloading → first visit, files being cached (real progress)
// error       → download failed or content missing from the cache
// done        → verified complete: fill the bar, fade out
// hidden      → nothing to show (all cached, unsupported, or dismissed)

export default function OfflineBanner() {
  const supported = typeof navigator !== 'undefined' && 'serviceWorker' in navigator
  const [status, setStatus] = useState(supported ? 'checking' : 'hidden')
  const [progress, setProgress] = useState({ done: 0, total: 0 })
  const [fading, setFading] = useState(false)
  const statusRef = useRef(status)
  statusRef.current = status

  // Listen for progress before the SW is registered, so no message is missed.
  useEffect(() => {
    if (!supported) return
    return onPrecacheProgress((p) => setProgress((prev) => (p.done > prev.done ? p : prev)))
  }, [supported])

  const {
    offlineReady: [offlineReady],
  } = useRegisterSW({
    onRegisteredSW(_url, registration) {
      if (!registration) return
      // First visit: show the overlay only once a SW is really installing.
      // (No registration at all — dev server, blocked SW — means nothing to wait for.)
      if ((registration.installing || registration.waiting) && statusRef.current === 'checking') {
        setStatus('downloading')
      }
      watchInstallFailure(registration, () => {
        if (statusRef.current === 'downloading' || statusRef.current === 'checking') setStatus('error')
      })
    },
    onRegisterError() {
      setStatus('hidden') // no offline support; the app still works online
    },
  })

  // On load: is the content already cached? (second visit, QR deep link)
  useEffect(() => {
    if (!supported) return
    let cancelled = false
    ;(async () => {
      const registration = await navigator.serviceWorker.getRegistration()
      if (!registration?.active) return // first visit: onRegisteredSW decides
      const result = await getPrecacheStatus()
      if (cancelled) return
      if (!result || result.complete) setStatus('hidden')
      else if (registration.installing || registration.waiting) setStatus('downloading')
      else setStatus('error') // SW active but files missing (e.g. evicted by the browser)
    })()
    return () => { cancelled = true }
  }, [supported])

  // The SW finished installing: verify before telling the visitor it's ready.
  useEffect(() => {
    if (!offlineReady) return
    let cancelled = false
    ;(async () => {
      const result = await getPrecacheStatus()
      if (cancelled) return
      if (result?.complete) {
        setProgress({ done: result.total, total: result.total })
        setStatus('done')
      } else {
        setStatus('error')
      }
    })()
    return () => { cancelled = true }
  }, [offlineReady])

  useEffect(() => {
    if (status !== 'done') return
    const fade = setTimeout(() => setFading(true), 700)
    const hide = setTimeout(() => setStatus('hidden'), 1300)
    return () => { clearTimeout(fade); clearTimeout(hide) }
  }, [status])

  if (status === 'checking' || status === 'hidden') return null

  const percent = status === 'done'
    ? 100
    : progress.total ? Math.round((progress.done / progress.total) * 100) : 0

  return (
    <div className={`${styles.overlay} ${fading ? styles.fading : ''}`}>
      <div className={styles.content}>
        <h1 className={styles.title}>Jardín Botánico</h1>

        {status === 'error' ? (
          <>
            <p className={styles.textEs} role="alert">No se pudo descargar todo el contenido para usar sin internet.</p>
            <p className={styles.textEn}>Couldn't download all the content for offline use.</p>
            <button className={styles.primaryBtn} onClick={retryDownload}>Reintentar · Retry</button>
          </>
        ) : (
          <>
            <p className={styles.textEs}>Descargando contenido para uso sin internet</p>
            <p className={styles.textEn}>Downloading content for offline use</p>
            <div
              className={styles.track}
              role="progressbar"
              aria-label="Descarga · Download"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={percent}
            >
              <div className={styles.fill} style={{ width: `${percent}%` }} />
            </div>
            <p className={styles.percent}>{percent}%</p>
          </>
        )}

        {status !== 'done' && (
          <button className={styles.linkBtn} onClick={() => setStatus('hidden')}>
            {status === 'error' ? 'Continuar igual · Continue anyway' : 'Continuar sin esperar · Continue without waiting'}
          </button>
        )}
      </div>
    </div>
  )
}
