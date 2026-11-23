import { useState, useRef, useEffect } from 'react'
import styles from './AudioPlayer.module.css'

function formatTime(seconds) {
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

export default function AudioPlayer({ src, duration, label, errorText }) {
  const audioRef = useRef(null)
  // `playing` follows the <audio> element's own events ('playing' / 'pause'),
  // never the click: play() is async and can fail (autoplay policy, missing
  // file, offline without cache), so the UI only shows "pause" once sound starts.
  const [playing, setPlaying] = useState(false)
  const [progress, setProgress] = useState(0)
  const [currentTime, setCurrentTime] = useState('0:00')
  const [error, setError] = useState(false)

  useEffect(() => {
    // New src (another station, or a language switch): start from scratch.
    setPlaying(false)
    setProgress(0)
    setCurrentTime('0:00')
    setError(false)

    const audio = audioRef.current
    if (!audio) return

    const onTimeUpdate = () => {
      const pct = (audio.currentTime / audio.duration) * 100
      setProgress(Number.isFinite(pct) ? pct : 0)
      setCurrentTime(formatTime(audio.currentTime))
    }
    const onPlaying = () => {
      setError(false)
      setPlaying(true)
    }
    const onPause = () => setPlaying(false)
    const onEnded = () => {
      setPlaying(false)
      setProgress(0)
      setCurrentTime('0:00')
    }
    const onError = () => {
      setPlaying(false)
      setError(true)
    }

    audio.addEventListener('timeupdate', onTimeUpdate)
    audio.addEventListener('playing', onPlaying)
    audio.addEventListener('pause', onPause)
    audio.addEventListener('ended', onEnded)
    audio.addEventListener('error', onError)
    return () => {
      audio.removeEventListener('timeupdate', onTimeUpdate)
      audio.removeEventListener('playing', onPlaying)
      audio.removeEventListener('pause', onPause)
      audio.removeEventListener('ended', onEnded)
      audio.removeEventListener('error', onError)
    }
  }, [src])

  const togglePlay = () => {
    const audio = audioRef.current
    if (!audio) return
    if (!audio.paused) {
      audio.pause()
      return
    }
    setError(false)
    const result = audio.play()
    // Older browsers return undefined instead of a promise.
    if (result && typeof result.catch === 'function') {
      result.catch((err) => {
        // AbortError: paused or src changed before playback started — not a failure.
        if (err?.name === 'AbortError') return
        setPlaying(false)
        setError(true)
      })
    }
  }

  const seek = (e) => {
    const audio = audioRef.current
    if (!audio || !Number.isFinite(audio.duration)) return
    const rect = e.currentTarget.getBoundingClientRect()
    const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
    audio.currentTime = pct * audio.duration
  }

  return (
    <div className={styles.player}>
      {/* El audio solo se carga si hay un src real */}
      {src && <audio ref={audioRef} src={src} preload="none" />}

      <button
        className={styles.playBtn}
        onClick={togglePlay}
        aria-label={playing ? 'Pausar audio' : 'Reproducir audio'}
      >
        {playing
          ? <span className={styles.pauseIcon}><span /><span /></span>
          : <span className={styles.playIcon} />
        }
      </button>

      <div className={styles.info}>
        <p className={styles.title}>{label}</p>
        <div
          className={styles.track}
          onClick={seek}
          role="progressbar"
          aria-valuenow={Math.round(progress)}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <div className={styles.fill} style={{ width: `${progress}%` }} />
        </div>
        <div className={styles.times}>
          <span>{currentTime}</span>
          <span>{duration}</span>
        </div>
        {error && errorText && (
          <p className={styles.error} role="alert">{errorText}</p>
        )}
      </div>
    </div>
  )
}
