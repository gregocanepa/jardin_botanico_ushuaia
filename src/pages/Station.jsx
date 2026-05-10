import { useParams, useNavigate } from 'react-router-dom'
import { useStation, useAllStations } from '../hooks/useStation'
import { useLang } from '../context/LanguageContext'
import { strings } from '../i18n/strings'
import AudioPlayer from '../components/AudioPlayer.jsx'
import LanguageToggle from '../components/LanguageToggle'
import styles from './Station.module.css'

export default function Station() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const { station, loading, error } = useStation(slug)
  const { stations } = useAllStations()
  const { lang } = useLang()
  const s = strings[lang]

  if (loading) return <div className={styles.loading}>{s.loading}</div>
  if (error)   return <div className={styles.error}>{error}</div>

  const currentIndex = stations.findIndex(st => st.slug === slug)
  const nextStation  = stations[currentIndex + 1] ?? null

  return (
    <div className={styles.page}>

      {/* Nav */}
      <nav className={styles.nav}>
        <button className={styles.back} onClick={() => navigate('/')}>
          {s.back}
        </button>
        <span className={styles.progress}>
          {s.stationOf(station.order, stations.length)}
        </span>
        <LanguageToggle />
      </nav>

      {/* Hero */}
      <header className={styles.hero}>
        <div className={styles.heroContent}>
          <span className={styles.badge}>{s.stationLabel} {station.order}</span>
          <h1 className={styles.name}>{station.name}</h1>
          <p className={styles.sci}>{station.scientificName}</p>
        </div>
      </header>

      {/* Audio */}
      <section className={styles.section}>
        <p className={styles.label}>{s.audioGuide}</p>
        <AudioPlayer src={station.audio} duration={station.audioDuration} label={s.narration} />
      </section>

      {/* Descripción */}
      <section className={styles.section}>
        <p className={styles.label}>{s.about}</p>
        <p className={styles.body}>{station.description}</p>
      </section>

      {/* Facts */}
      <section className={styles.section}>
        <p className={styles.label}>{s.data}</p>
        <div className={styles.factsGrid}>
          {Object.entries(station.facts).map(([key, val]) => (
            <div key={key} className={styles.factCard}>
              <p className={styles.factLabel}>{s.factLabels[key] || key}</p>
              <p className={styles.factValue}>{val}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Tags */}
      <section className={styles.section}>
        <p className={styles.label}>{s.features}</p>
        <div className={styles.tags}>
          {station.tags.map(tag => (
            <span key={tag} className={styles.tag}>{tag}</span>
          ))}
        </div>
      </section>

      {/* Links */}
      {station.links?.length > 0 && (
        <section className={styles.section}>
          <p className={styles.label}>{s.references}</p>
          <div className={styles.links}>
            {station.links.map(link => (
              <a
                key={link.url}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.linkItem}
              >
                {link.label}
                <span>↗</span>
              </a>
            ))}
          </div>
        </section>
      )}

      {/* Navegación entre estaciones */}
      <div className={styles.navBar}>
        <button
          className={styles.btnSecondary}
          onClick={() => navigate('/')}
        >
          {s.map}
        </button>
        {nextStation ? (
          <button
            className={styles.btnPrimary}
            onClick={() => navigate(`/estacion/${nextStation.slug}`)}
          >
            {s.next}
          </button>
        ) : (
          <button
            className={styles.btnPrimary}
            onClick={() => navigate('/')}
          >
            {s.end}
          </button>
        )}
      </div>

    </div>
  )
}
