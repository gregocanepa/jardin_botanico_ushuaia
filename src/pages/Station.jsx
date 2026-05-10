import { useParams, useNavigate } from 'react-router-dom'
import { useStation, useAllStations } from '../hooks/useStation'
import AudioPlayer from '../components/AudioPlayer.jsx'
import styles from './Station.module.css'

export default function Station() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const { station, loading, error } = useStation(slug)
  const { stations } = useAllStations()

  if (loading) return <div className={styles.loading}>Cargando...</div>
  if (error)   return <div className={styles.error}>{error}</div>

  const currentIndex = stations.findIndex(s => s.slug === slug)
  const nextStation  = stations[currentIndex + 1] ?? null
  const prevStation  = stations[currentIndex - 1] ?? null

  return (
    <div className={styles.page}>

      {/* Nav */}
      <nav className={styles.nav}>
        <button className={styles.back} onClick={() => navigate('/')}>
          ← Recorrido
        </button>
        <span className={styles.progress}>
          Estación {station.order} de {stations.length}
        </span>
      </nav>

      {/* Hero */}
      <header className={styles.hero}>
        <div className={styles.heroContent}>
          <span className={styles.badge}>Estación {station.order}</span>
          <h1 className={styles.name}>{station.name}</h1>
          <p className={styles.sci}>{station.scientificName}</p>
        </div>
      </header>

      {/* Audio */}
      <section className={styles.section}>
        <p className={styles.label}>Guía de audio</p>
        <AudioPlayer src={station.audio} duration={station.audioDuration} />
      </section>

      {/* Descripción */}
      <section className={styles.section}>
        <p className={styles.label}>Sobre esta planta</p>
        <p className={styles.body}>{station.description}</p>
      </section>

      {/* Facts */}
      <section className={styles.section}>
        <p className={styles.label}>Datos</p>
        <div className={styles.factsGrid}>
          {Object.entries(station.facts).map(([key, val]) => (
            <div key={key} className={styles.factCard}>
              <p className={styles.factLabel}>{key.charAt(0).toUpperCase() + key.slice(1)}</p>
              <p className={styles.factValue}>{val}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Tags */}
      <section className={styles.section}>
        <p className={styles.label}>Características</p>
        <div className={styles.tags}>
          {station.tags.map(tag => (
            <span key={tag} className={styles.tag}>{tag}</span>
          ))}
        </div>
      </section>

      {/* Links */}
      {station.links?.length > 0 && (
        <section className={styles.section}>
          <p className={styles.label}>Referencias</p>
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
          Mapa
        </button>
        {nextStation ? (
          <button
            className={styles.btnPrimary}
            onClick={() => navigate(`/estacion/${nextStation.slug}`)}
          >
            Siguiente →
          </button>
        ) : (
          <button
            className={styles.btnPrimary}
            onClick={() => navigate('/')}
          >
            Fin del recorrido
          </button>
        )}
      </div>

    </div>
  )
}
