import { useEffect, useRef, useState } from 'react'
import { useRegisterSW } from 'virtual:pwa-register/react'
import styles from './OfflineBanner.module.css'

const DONE_KEY = 'offline-cached'

export default function OfflineBanner() {
  const supported = 'serviceWorker' in navigator
  const [show, setShow] = useState(supported && !localStorage.getItem(DONE_KEY))
  const [progress, setProgress] = useState(0)
  const [fast, setFast] = useState(false)
  const [fading, setFading] = useState(false)
  const done = useRef(false)

  const { offlineReady: [offlineReady] } = useRegisterSW()

  // Animate to 75% slowly while SW is installing
  useEffect(() => {
    if (!show) return
    const t = setTimeout(() => setProgress(75), 80)
    return () => clearTimeout(t)
  }, [show])

  // Complete when SW reports all assets are cached
  useEffect(() => {
    if (offlineReady) complete()
  }, [offlineReady])

  // Fallback: dismiss after 20s if SW never responds
  useEffect(() => {
    if (!show) return
    const t = setTimeout(complete, 2700)
    return () => clearTimeout(t)
  }, [show])

  function complete() {
    if (done.current) return
    done.current = true
    setFast(true)
    setProgress(100)
    localStorage.setItem(DONE_KEY, '1')
    setTimeout(() => setFading(true), 700)
    setTimeout(() => setShow(false), 1300)
  }

  if (!show) return null

  return (
    <div className={`${styles.overlay} ${fading ? styles.fading : ''}`}>
      <div className={styles.content}>
        <h1 className={styles.title}>Jardín Botánico</h1>
        <p className={styles.textEs}>Descargando contenido para uso sin internet</p>
        <p className={styles.textEn}>Downloading content for offline use</p>
        <div className={styles.track}>
          <div
            className={styles.fill}
            style={{
              width: `${progress}%`,
              transitionDuration: fast ? '0.35s' : '2.5s',
            }}
          />
        </div>
      </div>
    </div>
  )
}
