import { useState, useRef, useEffect } from 'react'
import styles from './AudioPlayer.module.css'

export default function AudioPlayer({ src, duration, label }) {
  const audioRef = useRef(null)
  const [playing, setPlaying] = useState(false)
  const [progress, setProgress] = useState(0)
  const [currentTime, setCurrentTime] = useState('0:00')

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const onTimeUpdate = () => {
      const pct = (audio.currentTime / audio.duration) * 100
      setProgress(isNaN(pct) ? 0 : pct)
      const m = Math.floor(audio.currentTime / 60)
      const s = Math.floor(audio.currentTime % 60)
      setCurrentTime(`${m}:${s.toString().padStart(2, '0')}`)
    }

    const onEnded = () => {
      setPlaying(false)
      setProgress(0)
      setCurrentTime('0:00')
    }

    audio.addEventListener('timeupdate', onTimeUpdate)
    audio.addEventListener('ended', onEnded)
    return () => {
      audio.removeEventListener('timeupdate', onTimeUpdate)
      audio.removeEventListener('ended', onEnded)
    }
  }, [src])

  const togglePlay = () => {
    const audio = audioRef.current
    if (!audio) return
    if (playing) {
      audio.pause()
    } else {
      audio.play()
    }
    setPlaying(!playing)
  }

  const seek = (e) => {
    const audio = audioRef.current
    if (!audio || isNaN(audio.duration)) return
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
      </div>
    </div>
  )
}
